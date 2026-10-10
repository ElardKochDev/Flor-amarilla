import {
  CELLS,
  ENERGY_REGEN_MS,
  ENERGY_REWARD,
  GOALS,
  LUCKY_SPAWN_CHANCE,
  MAX_ENERGY,
  MAX_LEVEL,
  RESCUE_ENERGY,
  STARTING_ITEMS,
  TARGET_VALUE,
  seedValue,
} from './config';

export interface Item {
  id: number;
  level: number;
}

export type Cell = Item | null;

export interface GameState {
  board: Cell[];
  energy: number;
  /** Marca de tiempo (ms) desde la que se cuenta la próxima recarga. */
  energyTs: number;
  nextId: number;
  maxLevel: number;
  merges: number;
  won: boolean;
}

export type Rng = () => number;

export function createInitialState(now: number): GameState {
  const board: Cell[] = Array.from({ length: CELLS }, () => null);
  let nextId = 1;
  for (const [index, level] of STARTING_ITEMS) {
    board[index] = { id: nextId++, level };
  }
  return {
    board,
    energy: MAX_ENERGY,
    energyTs: now,
    nextId,
    maxLevel: Math.max(...STARTING_ITEMS.map(([, l]) => l)),
    merges: 0,
    won: false,
  };
}

/** Aplica la recarga de energía transcurrida desde energyTs. */
export function regenEnergy(state: GameState, now: number): GameState {
  if (state.energy >= MAX_ENERGY) {
    return state.energyTs === now ? state : { ...state, energyTs: now };
  }
  const elapsed = Math.max(0, now - state.energyTs);
  const gained = Math.floor(elapsed / ENERGY_REGEN_MS);
  if (gained <= 0) return state;
  const energy = Math.min(MAX_ENERGY, state.energy + gained);
  const energyTs = energy >= MAX_ENERGY ? now : state.energyTs + gained * ENERGY_REGEN_MS;
  return { ...state, energy, energyTs };
}

/** Milisegundos que faltan para la siguiente unidad de energía (0 si está llena). */
export function msToNextEnergy(state: GameState, now: number): number {
  if (state.energy >= MAX_ENERGY) return 0;
  return Math.max(0, ENERGY_REGEN_MS - (now - state.energyTs));
}

export function emptyCells(board: Cell[]): number[] {
  const out: number[] = [];
  board.forEach((c, i) => {
    if (!c) out.push(i);
  });
  return out;
}

export type SpawnResult =
  | { ok: true; state: GameState; index: number; level: number }
  | { ok: false; reason: 'noEnergy' | 'boardFull' | 'won' };

export function spawn(state: GameState, now: number, rng: Rng = Math.random): SpawnResult {
  if (state.won) return { ok: false, reason: 'won' };
  if (state.energy <= 0) return { ok: false, reason: 'noEnergy' };
  const empty = emptyCells(state.board);
  if (empty.length === 0) return { ok: false, reason: 'boardFull' };
  // Se prefieren las celdas de abajo (cerca de la regadera) para que se sienta natural.
  const bottomFirst = [...empty].sort((a, b) => b - a);
  const pool = bottomFirst.slice(0, Math.max(1, Math.ceil(bottomFirst.length / 3)));
  const index = pool[Math.floor(rng() * pool.length) % pool.length];
  const level = rng() < LUCKY_SPAWN_CHANCE ? 2 : 1;
  const board = state.board.slice();
  board[index] = { id: state.nextId, level };
  const wasFull = state.energy >= MAX_ENERGY;
  return {
    ok: true,
    index,
    level,
    state: {
      ...state,
      board,
      energy: state.energy - 1,
      nextId: state.nextId + 1,
      maxLevel: Math.max(state.maxLevel, level),
      // Si la energía estaba llena, el reloj de recarga empieza ahora.
      energyTs: wasFull ? now : state.energyTs,
    },
  };
}

export function canMerge(a: Cell, b: Cell): boolean {
  return !!a && !!b && a.level === b.level && a.level < MAX_LEVEL;
}

export type MoveResult =
  | { kind: 'none'; state: GameState }
  | { kind: 'move' | 'swap'; state: GameState }
  | { kind: 'merge'; state: GameState; level: number; reward: number };

/** Mueve el objeto de `from` a `to`, combinándolo si son iguales o intercambiándolos si no. */
export function moveItem(state: GameState, from: number, to: number): MoveResult {
  if (state.won || from === to || from < 0 || to < 0 || from >= CELLS || to >= CELLS) {
    return { kind: 'none', state };
  }
  const a = state.board[from];
  const b = state.board[to];
  if (!a) return { kind: 'none', state };
  const board = state.board.slice();

  if (!b) {
    board[to] = a;
    board[from] = null;
    return { kind: 'move', state: { ...state, board } };
  }

  if (canMerge(a, b)) {
    const level = a.level + 1;
    const reward = ENERGY_REWARD[level] ?? 0;
    board[to] = { id: state.nextId, level };
    board[from] = null;
    const maxLevel = Math.max(state.maxLevel, level);
    return {
      kind: 'merge',
      level,
      reward,
      state: {
        ...state,
        board,
        nextId: state.nextId + 1,
        energy: Math.min(MAX_ENERGY + 10, state.energy + reward),
        maxLevel,
        merges: state.merges + 1,
        won: level >= MAX_LEVEL,
      },
    };
  }

  board[to] = a;
  board[from] = b;
  return { kind: 'swap', state: { ...state, board } };
}

/** Devuelve un par de celdas combinables, priorizando los niveles más altos. */
export function findMergePair(board: Cell[]): [number, number] | null {
  const firstOfLevel = new Map<number, number>();
  let best: [number, number] | null = null;
  let bestLevel = 0;
  for (let i = 0; i < board.length; i++) {
    const c = board[i];
    if (!c || c.level >= MAX_LEVEL) continue;
    const prev = firstOfLevel.get(c.level);
    if (prev === undefined) {
      firstOfLevel.set(c.level, i);
    } else if (c.level > bestLevel) {
      best = [prev, i];
      bestLevel = c.level;
    }
  }
  return best;
}

export type BlockReason = 'boardFull' | 'noEnergy';

/**
 * El jardín está bloqueado si no hay ninguna combinación posible y además
 * no se puede generar nada nuevo (tablero lleno o sin energía).
 */
export function detectBlock(state: GameState): BlockReason | null {
  if (state.won) return null;
  if (findMergePair(state.board)) return null;
  if (emptyCells(state.board).length === 0) return 'boardFull';
  if (state.energy <= 0) return 'noEnergy';
  return null;
}

/** Recupera el juego de un bloqueo sin esperas ni compras. */
export function recover(state: GameState, reason: BlockReason, now: number): GameState {
  if (reason === 'noEnergy') {
    return { ...state, energy: state.energy + RESCUE_ENERGY, energyTs: now };
  }
  // Tablero lleno sin pares: se retira el objeto de menor nivel y se regala energía.
  let lowest = -1;
  state.board.forEach((c, i) => {
    if (c && (lowest < 0 || c.level < (state.board[lowest] as Item).level)) lowest = i;
  });
  const board = state.board.slice();
  if (lowest >= 0) board[lowest] = null;
  return { ...state, board, energy: Math.max(state.energy, 5) };
}

export function boardValue(board: Cell[]): number {
  return board.reduce((sum, c) => sum + (c ? seedValue(c.level) : 0), 0);
}

/** Progreso hacia el ramo final, entre 0 y 1. */
export function progress(state: GameState): number {
  if (state.won) return 1;
  return Math.min(0.99, boardValue(state.board) / TARGET_VALUE);
}

export function goalStatus(state: GameState): boolean[] {
  return GOALS.map((g) => state.maxLevel >= g.level);
}

/** Valida datos guardados para no romper el juego con un localStorage corrupto. */
export function isValidState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false;
  const s = value as GameState;
  if (!Array.isArray(s.board) || s.board.length !== CELLS) return false;
  const ids = new Set<number>();
  for (const c of s.board) {
    if (c === null) continue;
    if (typeof c !== 'object' || !Number.isInteger(c.id) || !Number.isInteger(c.level)) return false;
    if (c.level < 1 || c.level > MAX_LEVEL || ids.has(c.id)) return false;
    ids.add(c.id);
  }
  return (
    Number.isFinite(s.energy) &&
    s.energy >= 0 &&
    Number.isFinite(s.energyTs) &&
    Number.isInteger(s.nextId) &&
    s.nextId > Math.max(0, ...ids) &&
    Number.isInteger(s.maxLevel) &&
    typeof s.won === 'boolean'
  );
}
