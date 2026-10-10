import { CHAIN } from './config';

/** Convierte una ruta de /public en una URL que respeta el base path de GitHub Pages. */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

export const IMG = {
  regadera: 'assets/sprites/items/regadera.png',
  nazrit: 'assets/sprites/characters/nazrit.png',
  esposo: 'assets/sprites/characters/esposo.png',
  muchacho: 'assets/sprites/characters/muchacho.png',
  luna: 'assets/sprites/characters/luna.png',
  nazritCara: 'assets/sprites/characters/nazrit-cara-feliz.png',
  esposoCara: 'assets/sprites/characters/esposo-cara.png',
  energia: 'assets/ui/energia.png',
  corazon: 'assets/ui/corazon.png',
  trofeo: 'assets/ui/trofeo.png',
  estrella: 'assets/ui/estrella.png',
  arbusto: 'assets/ui/deco-arbusto.png',
  cerca: 'assets/ui/deco-cerca.png',
  farol: 'assets/ui/deco-farol.png',
  arco: 'assets/ui/deco-arco.png',
  macetaGirasol: 'assets/ui/deco-maceta-girasol.png',
  jardinera: 'assets/ui/deco-jardinera.png',
  fondo: 'assets/backgrounds/atardecer.png',
  balcon: 'assets/backgrounds/balcon-mar.png',
  escenaFinal: 'assets/backgrounds/escena-final.png',
  fxCorazon: 'assets/effects/corazon.png',
  brillo1: 'assets/effects/brillo1.png',
  brillo2: 'assets/effects/brillo2.png',
  brillo3: 'assets/effects/brillo3.png',
  florBrillo: 'assets/effects/flor-brillo.png',
  petalo1: 'assets/effects/petalo1.png',
  petalo2: 'assets/effects/petalo2.png',
  petalo3: 'assets/effects/petalo3.png',
  petalo4: 'assets/effects/petalo4.png',
  petaloRosa: 'assets/effects/petalo-rosa.png',
} as const;

const ALL = [...Object.values(IMG), ...CHAIN.map((c) => c.sprite)];

/** Precarga todas las imágenes. Nunca rechaza: devuelve la lista de las que fallaron. */
export function preloadAssets(onProgress: (ratio: number) => void): Promise<string[]> {
  let done = 0;
  const failed: string[] = [];
  return Promise.all(
    ALL.map(
      (path) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          const finish = (ok: boolean) => {
            if (!ok) failed.push(path);
            done++;
            onProgress(done / ALL.length);
            resolve();
          };
          img.onload = () => finish(true);
          img.onerror = () => finish(false);
          img.src = asset(path);
        }),
    ),
  ).then(() => failed);
}
