import { type GameState, isValidState } from './logic';

const KEY = 'jardin-de-nazrit:v1';

export interface SaveData {
  game: GameState;
  tutorialDone: boolean;
  muted: boolean;
}

export function loadSave(): Partial<SaveData> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as Partial<SaveData>;
    return {
      game: isValidState(data.game) ? data.game : undefined,
      tutorialDone: data.tutorialDone === true,
      muted: data.muted === true,
    };
  } catch {
    return {};
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Modo privado o almacenamiento lleno: el juego sigue funcionando sin guardar.
  }
}
