export const COLS = 6;
export const ROWS = 7;
export const CELLS = COLS * ROWS;

export const MAX_LEVEL = 7;

/** Energía máxima del generador y ritmo de recarga. */
export const MAX_ENERGY = 30;
export const ENERGY_REGEN_MS = 3000;
/** Probabilidad de que la regadera entregue directamente un Brote (nivel 2). */
export const LUCKY_SPAWN_CHANCE = 0.2;
/** Energía de regalo al crear objetos de cierto nivel. */
export const ENERGY_REWARD: Record<number, number> = { 4: 2, 5: 3, 6: 5 };
/** Energía que regalan Muchacho y Luna cuando el jardín se queda sin opciones. */
export const RESCUE_ENERGY = 12;

export interface ItemDef {
  level: number;
  name: string;
  sprite: string;
}

export const CHAIN: ItemDef[] = [
  { level: 1, name: 'Semilla', sprite: 'assets/sprites/items/semilla.png' },
  { level: 2, name: 'Brote', sprite: 'assets/sprites/items/brote.png' },
  { level: 3, name: 'Planta pequeña', sprite: 'assets/sprites/items/planta.png' },
  { level: 4, name: 'Capullo', sprite: 'assets/sprites/items/capullo.png' },
  { level: 5, name: 'Margarita amarilla', sprite: 'assets/sprites/items/margarita.png' },
  { level: 6, name: 'Girasol', sprite: 'assets/sprites/items/girasol.png' },
  { level: 7, name: 'Ramo de flores amarillas', sprite: 'assets/sprites/items/ramo.png' },
];

export function itemDef(level: number): ItemDef {
  return CHAIN[Math.min(Math.max(level, 1), MAX_LEVEL) - 1];
}

export interface Goal {
  level: number;
  label: string;
}

export const GOALS: Goal[] = [
  { level: 5, label: 'Margarita amarilla' },
  { level: 6, label: 'Girasol' },
  { level: 7, label: 'Ramo de flores amarillas' },
];

/** Objetos iniciales del tablero: [índice de celda, nivel]. */
export const STARTING_ITEMS: Array<[number, number]> = [
  [14, 1],
  [15, 1],
  [20, 1],
  [21, 1],
  [26, 2],
  [27, 2],
  [33, 3],
];

/** Valor en "semillas" de un objeto de cierto nivel. */
export function seedValue(level: number): number {
  return 2 ** (level - 1);
}

export const TARGET_VALUE = seedValue(MAX_LEVEL);
