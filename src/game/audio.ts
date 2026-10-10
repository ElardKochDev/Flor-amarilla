/**
 * Sonidos sintetizados con Web Audio: no requieren archivos y pesan 0 KB.
 * Si el navegador no soporta audio, todas las funciones son no-ops.
 */

type Ctx = AudioContext;

let ctx: Ctx | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicTimer: number | null = null;
let muted = false;

// Escala pentatónica de Do mayor: siempre suena agradable.
const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98];

function getCtx(): Ctx | null {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.6;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.18;
    musicGain.connect(master);
    return ctx;
  } catch {
    return null;
  }
}

/** Debe llamarse desde un gesto del usuario (requisito de iOS/Android). */
export function unlockAudio(): void {
  const c = getCtx();
  if (c && c.state === 'suspended') void c.resume();
}

export function setMuted(value: boolean): void {
  muted = value;
  if (master && ctx) master.gain.setTargetAtTime(value ? 0 : 0.6, ctx.currentTime, 0.05);
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number, dest?: AudioNode) {
  const c = getCtx();
  if (!c || !master) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = c.currentTime + start;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(dest ?? master);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export const sfx = {
  spawn() {
    tone(PENTA[0], 0, 0.18, 'triangle', 0.25);
    tone(PENTA[2], 0.05, 0.2, 'sine', 0.18);
  },
  pick() {
    tone(PENTA[3], 0, 0.08, 'sine', 0.12);
  },
  drop() {
    tone(PENTA[1], 0, 0.1, 'triangle', 0.12);
  },
  merge(level: number) {
    const base = Math.min(level - 1, PENTA.length - 3);
    tone(PENTA[base], 0, 0.25, 'triangle', 0.25);
    tone(PENTA[base + 1], 0.07, 0.25, 'sine', 0.22);
    tone(PENTA[base + 2], 0.14, 0.4, 'sine', 0.22);
  },
  error() {
    tone(220, 0, 0.15, 'sine', 0.15);
    tone(196, 0.08, 0.2, 'sine', 0.12);
  },
  goal() {
    [0, 2, 4, 5].forEach((n, i) => tone(PENTA[n], i * 0.09, 0.35, 'triangle', 0.22));
  },
  win() {
    const notes = [0, 2, 4, 5, 7, 8, 7, 5, 8];
    notes.forEach((n, i) => {
      tone(PENTA[n], i * 0.14, 0.6, 'triangle', 0.22);
      tone(PENTA[n] / 2, i * 0.14, 0.6, 'sine', 0.12);
    });
  },
};

// Pequeña melodía de caja de música en bucle.
const MELODY = [0, 2, 4, 2, 3, 4, 5, 4, 0, 2, 4, 5, 4, 2, 1, -1];

export function startMusic(): void {
  const c = getCtx();
  if (!c || !musicGain || musicTimer !== null) return;
  let step = 0;
  const play = () => {
    const n = MELODY[step % MELODY.length];
    if (n >= 0) {
      tone(PENTA[n], 0, 0.9, 'sine', 0.5, musicGain!);
      if (step % 4 === 0) tone(PENTA[n] / 2, 0, 1.4, 'triangle', 0.25, musicGain!);
    }
    step++;
  };
  play();
  musicTimer = window.setInterval(play, 420);
}

export function stopMusic(): void {
  if (musicTimer !== null) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
}

/** Vibración corta en Android (iOS la ignora). */
export function haptic(ms = 12): void {
  try {
    if (!muted) navigator.vibrate?.(ms);
  } catch {
    /* sin vibración */
  }
}
