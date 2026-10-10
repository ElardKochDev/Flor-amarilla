import { describe, expect, it } from 'vitest';
import { CELLS, CHAIN, ENERGY_REGEN_MS, MAX_ENERGY, MAX_LEVEL, RESCUE_ENERGY, STARTING_ITEMS } from './config';
import {
  type Cell,
  type GameState,
  createInitialState,
  detectBlock,
  findMergePair,
  goalStatus,
  isValidState,
  moveItem,
  progress,
  recover,
  regenEnergy,
  spawn,
} from './logic';

const NOW = 1_000_000;

function stateWith(items: Array<[number, number]>, extra: Partial<GameState> = {}): GameState {
  const board: Cell[] = Array.from({ length: CELLS }, () => null);
  let id = 1;
  for (const [i, level] of items) board[i] = { id: id++, level };
  return { board, energy: MAX_ENERGY, energyTs: NOW, nextId: id, maxLevel: 1, merges: 0, won: false, ...extra };
}

/** rng determinista que devuelve los valores dados en ciclo. */
function seq(...values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('cadena de objetos', () => {
  it('tiene 7 niveles en el orden pedido', () => {
    expect(CHAIN.map((c) => c.name)).toEqual([
      'Semilla',
      'Brote',
      'Planta pequeña',
      'Capullo',
      'Margarita amarilla',
      'Girasol',
      'Ramo de flores amarillas',
    ]);
  });
});

describe('estado inicial', () => {
  it('crea un tablero 6x7 con los objetos iniciales y energía llena', () => {
    const s = createInitialState(NOW);
    expect(s.board).toHaveLength(42);
    expect(s.board.filter(Boolean)).toHaveLength(STARTING_ITEMS.length);
    expect(s.energy).toBe(MAX_ENERGY);
    expect(s.won).toBe(false);
    expect(isValidState(s)).toBe(true);
  });
});

describe('combinaciones', () => {
  it('combina dos objetos iguales en uno de nivel superior en la celda destino', () => {
    const s = stateWith([[0, 1], [1, 1]]);
    const r = moveItem(s, 0, 1);
    expect(r.kind).toBe('merge');
    expect(r.state.board[0]).toBeNull();
    expect(r.state.board[1]?.level).toBe(2);
    expect(r.state.merges).toBe(1);
  });

  it('cada nivel de la cadena se combina en el siguiente', () => {
    for (let level = 1; level < MAX_LEVEL; level++) {
      const r = moveItem(stateWith([[5, level], [6, level]]), 5, 6);
      expect(r.kind).toBe('merge');
      expect(r.state.board[6]?.level).toBe(level + 1);
    }
  });

  it('no combina objetos distintos: los intercambia', () => {
    const s = stateWith([[0, 1], [1, 2]]);
    const r = moveItem(s, 0, 1);
    expect(r.kind).toBe('swap');
    expect(r.state.board[0]?.level).toBe(2);
    expect(r.state.board[1]?.level).toBe(1);
  });

  it('mueve un objeto a una celda vacía', () => {
    const r = moveItem(stateWith([[0, 3]]), 0, 41);
    expect(r.kind).toBe('move');
    expect(r.state.board[41]?.level).toBe(3);
    expect(r.state.board[0]).toBeNull();
  });

  it('no combina dos ramos (nivel máximo)', () => {
    const r = moveItem(stateWith([[0, MAX_LEVEL], [1, MAX_LEVEL]]), 0, 1);
    expect(r.kind).toBe('swap');
  });

  it('ignora movimientos inválidos', () => {
    const s = stateWith([[0, 1]]);
    expect(moveItem(s, 0, 0).kind).toBe('none');
    expect(moveItem(s, 3, 4).kind).toBe('none');
    expect(moveItem(s, 0, 99).kind).toBe('none');
  });

  it('regala energía al crear objetos de nivel alto', () => {
    const r = moveItem(stateWith([[0, 4], [1, 4]], { energy: 0 }), 0, 1);
    expect(r.kind === 'merge' && r.reward).toBeGreaterThan(0);
    expect(r.state.energy).toBeGreaterThan(0);
  });
});

describe('victoria', () => {
  it('solo se gana al crear el Ramo de flores amarillas', () => {
    const r1 = moveItem(stateWith([[0, 5], [1, 5]]), 0, 1);
    expect(r1.state.won).toBe(false);
    const r2 = moveItem(stateWith([[0, 6], [1, 6]]), 0, 1);
    expect(r2.state.won).toBe(true);
    expect(progress(r2.state)).toBe(1);
    expect(goalStatus(r2.state)).toEqual([true, true, true]);
  });

  it('el progreso nunca llega a 100% antes de ganar', () => {
    const s = stateWith([[0, 6], [1, 6]]);
    expect(progress(s)).toBeLessThan(1);
  });

  it('no permite seguir jugando después de ganar', () => {
    const s = stateWith([[0, 1], [1, 1]], { won: true });
    expect(moveItem(s, 0, 1).kind).toBe('none');
    expect(spawn(s, NOW).ok).toBe(false);
  });

  it('el nivel se puede completar desde el inicio solo con la regadera y combinaciones', () => {
    let s = createInitialState(NOW);
    let now = NOW;
    const rng = seq(0.1, 0.5, 0.9, 0.3, 0.7);
    let steps = 0;
    while (!s.won && steps < 2000) {
      steps++;
      const pair = findMergePair(s.board);
      if (pair) {
        s = moveItem(s, pair[0], pair[1]).state;
        continue;
      }
      const block = detectBlock(s);
      if (block) {
        s = recover(s, block, now);
        continue;
      }
      const r = spawn(s, now, rng);
      if (r.ok) s = r.state;
      now += 500;
      s = regenEnergy(s, now);
    }
    expect(s.won).toBe(true);
    expect(s.board.some((c) => c?.level === MAX_LEVEL)).toBe(true);
  });
});

describe('generador y energía', () => {
  it('genera una semilla o un brote en una celda vacía y gasta energía', () => {
    const r = spawn(stateWith([]), NOW, seq(0, 0.9));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.energy).toBe(MAX_ENERGY - 1);
      expect(r.state.board[r.index]?.level).toBe(r.level);
      expect([1, 2]).toContain(r.level);
    }
  });

  it('no genera sin energía ni con el tablero lleno', () => {
    expect(spawn(stateWith([], { energy: 0 }), NOW)).toEqual({ ok: false, reason: 'noEnergy' });
    const full = stateWith(Array.from({ length: CELLS }, (_, i) => [i, (i % 6) + 1] as [number, number]));
    expect(spawn(full, NOW)).toEqual({ ok: false, reason: 'boardFull' });
  });

  it('recarga energía con el tiempo sin pasar del máximo', () => {
    const s = stateWith([], { energy: 0, energyTs: NOW });
    expect(regenEnergy(s, NOW + ENERGY_REGEN_MS * 2.5).energy).toBe(2);
    expect(regenEnergy(s, NOW + ENERGY_REGEN_MS * 1000).energy).toBe(MAX_ENERGY);
  });
});

describe('bloqueos y recuperación', () => {
  it('detecta falta de energía sin combinaciones y la recupera', () => {
    const s = stateWith([[0, 1], [1, 2]], { energy: 0 });
    expect(detectBlock(s)).toBe('noEnergy');
    const r = recover(s, 'noEnergy', NOW);
    expect(r.energy).toBe(RESCUE_ENERGY);
    expect(detectBlock(r)).toBeNull();
  });

  it('detecta un tablero lleno sin pares y libera espacio', () => {
    // Situación artificial (imposible en juego normal): tablero lleno de ramos y una semilla.
    const items = Array.from({ length: CELLS }, (_, i) => [i, MAX_LEVEL] as [number, number]);
    items[0] = [0, 1];
    const s = stateWith(items);
    expect(detectBlock(s)).toBe('boardFull');
    const r = recover(s, 'boardFull', NOW);
    expect(r.board[0]).toBeNull();
    expect(detectBlock(r)).toBeNull();
  });

  it('no hay bloqueo si existe una combinación', () => {
    expect(detectBlock(stateWith([[0, 2], [9, 2]], { energy: 0 }))).toBeNull();
  });

  it('findMergePair prioriza el nivel más alto', () => {
    expect(findMergePair(stateWith([[0, 1], [1, 1], [2, 3], [3, 3]]).board)).toEqual([2, 3]);
    expect(findMergePair(stateWith([[0, 1], [1, 2]]).board)).toBeNull();
  });
});

describe('validación de guardado', () => {
  it('rechaza datos corruptos', () => {
    expect(isValidState(null)).toBe(false);
    expect(isValidState({ board: [] })).toBe(false);
    const bad = stateWith([[0, 9]]);
    expect(isValidState(bad)).toBe(false);
  });
});
