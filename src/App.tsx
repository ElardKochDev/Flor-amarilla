import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { COLS, GOALS, ROWS, itemDef } from './game/config';
import {
  type GameState,
  createInitialState,
  detectBlock,
  findMergePair,
  goalStatus,
  moveItem,
  msToNextEnergy,
  progress,
  recover,
  regenEnergy,
  spawn,
} from './game/logic';
import { loadSave, writeSave } from './game/storage';
import { preloadAssets, IMG } from './game/assets';
import { haptic, setMuted as setAudioMuted, sfx, startMusic, stopMusic, unlockAudio } from './game/audio';
import { Board, type BoardEffect } from './components/Board';
import { Hud } from './components/Hud';
import { Goals } from './components/Goals';
import { Generator } from './components/Generator';
import { Tutorial, type TutorialStep } from './components/Tutorial';
import { Victory } from './components/Victory';
import { TitleScreen } from './components/TitleScreen';
import { Sprite } from './components/Sprite';

type Phase = 'title' | 'playing' | 'celebrating' | 'victory';

interface Toast {
  key: number;
  text: string;
}

const HINT_AFTER_MS = 8000;
const CELEBRATION_MS = 2600;

const saved = loadSave();

export default function App() {
  const [phase, setPhase] = useState<Phase>('title');
  const [loading, setLoading] = useState<number | null>(0);
  const [game, setGame] = useState<GameState>(() => saved.game ?? createInitialState(Date.now()));
  const [tutorialDone, setTutorialDone] = useState(saved.tutorialDone ?? false);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep | null>(null);
  const [muted, setMuted] = useState(saved.muted ?? false);
  const [now, setNow] = useState(Date.now());
  const [lastAction, setLastAction] = useState(Date.now());
  const [effects, setEffects] = useState<BoardEffect[]>([]);
  const [freshIds, setFreshIds] = useState<Set<number>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [shake, setShake] = useState(0);
  const [cellSize, setCellSize] = useState(52);
  const boardArea = useRef<HTMLDivElement>(null);
  const fxKey = useRef(0);

  // --- Precarga de recursos ---
  useEffect(() => {
    let alive = true;
    preloadAssets((r) => alive && setLoading(r)).then((failed) => {
      if (!alive) return;
      if (failed.length) console.warn('[jardin] recursos que no cargaron:', failed);
      setLoading(null);
    });
    return () => {
      alive = false;
    };
  }, []);

  // --- Guardado ---
  useEffect(() => {
    writeSave({ game, tutorialDone, muted });
  }, [game, tutorialDone, muted]);

  // --- Audio ---
  useEffect(() => {
    setAudioMuted(muted);
  }, [muted]);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) stopMusic();
      else if (phase !== 'title') startMusic();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [phase]);

  // --- Reloj: recarga de energía ---
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      setGame((g) => regenEnergy(g, t));
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  // --- Tamaño de celda según el espacio disponible (responsive) ---
  useLayoutEffect(() => {
    const el = boardArea.current;
    if (!el) return;
    const measure = () => {
      const pad = 16; // marco del tablero
      const w = el.clientWidth - pad;
      const h = el.clientHeight - pad;
      const size = Math.floor(Math.min(w / COLS, h / ROWS, 78));
      setCellSize(Math.max(34, size));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [phase === 'title']);

  const toast = useCallback((text: string) => {
    const key = ++fxKey.current;
    setToasts((t) => [...t.slice(-2), { key, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.key !== key)), 2200);
  }, []);

  const addEffect = (index: number, kind: BoardEffect['kind'], id: number) => {
    const key = ++fxKey.current;
    setEffects((e) => [...e, { key, index, kind }]);
    setFreshIds((s) => new Set(s).add(id));
    window.setTimeout(() => {
      setEffects((e) => e.filter((x) => x.key !== key));
      setFreshIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }, 700);
  };

  // --- Acciones ---
  const startPlaying = (fresh: boolean) => {
    unlockAudio();
    if (fresh || game.won) setGame(createInitialState(Date.now()));
    setPhase('playing');
    setLastAction(Date.now());
    startMusic();
    if (!tutorialDone) setTutorialStep(0);
  };

  const handleGenerate = () => {
    unlockAudio();
    if (phase !== 'playing' || tutorialStep === 0 || tutorialStep === 3) return;
    setLastAction(Date.now());
    const t = Date.now();
    const r = spawn(regenEnergy(game, t), t);
    if (!r.ok) {
      sfx.error();
      setShake((s) => s + 1);
      if (r.reason === 'noEnergy') toast('Sin energía ⚡ ¡Combina flores mientras se recarga!');
      if (r.reason === 'boardFull') toast('¡Jardín lleno! Combina flores para hacer espacio');
      return;
    }
    setGame(r.state);
    addEffect(r.index, 'spawn', r.state.nextId - 1);
    sfx.spawn();
    haptic(8);
    if (r.level === 2) toast('¡Suerte! Salió un Brote 🌱');
    if (tutorialStep === 1) {
      const seeds = r.state.board.filter((c) => c?.level === 1).length;
      if (seeds >= 2) setTutorialStep(2);
    }
  };

  const handleMove = (from: number, to: number) => {
    if (phase !== 'playing' || tutorialStep === 0 || tutorialStep === 3) return;
    setLastAction(Date.now());
    const r = moveItem(game, from, to);
    if (r.kind === 'none') return;
    setGame(r.state);
    if (r.kind !== 'merge') {
      sfx.drop();
      return;
    }
    addEffect(to, 'merge', r.state.nextId - 1);
    sfx.merge(r.level);
    haptic(20);
    if (r.reward) toast(`+${r.reward} ⚡ de regalo`);
    const goal = GOALS.find((g) => g.level === r.level && game.maxLevel < g.level);
    if (goal && !r.state.won) {
      window.setTimeout(() => sfx.goal(), 250);
      toast(`¡Objetivo cumplido: ${itemDef(goal.level).name}!`);
    }
    if (tutorialStep === 2) setTutorialStep(3);
    if (r.state.won) {
      setTutorialStep(null);
      setPhase('celebrating');
      window.setTimeout(() => sfx.win(), 300);
      window.setTimeout(() => setPhase('victory'), CELEBRATION_MS);
    }
  };

  const handleRecover = () => {
    const reason = detectBlock(game);
    if (!reason) return;
    setGame(recover(game, reason, Date.now()));
    sfx.goal();
    toast(reason === 'noEnergy' ? '¡Muchacho y Luna te trajeron energía! 🐶🐩' : 'Hicimos espacio en el jardín 🌱');
  };

  const handleReplay = () => {
    setGame(createInitialState(Date.now()));
    setEffects([]);
    setPhase('playing');
    setLastAction(Date.now());
  };

  const nextTutorial = () => {
    if (tutorialStep === 0) setTutorialStep(1);
    else finishTutorial();
  };

  const finishTutorial = () => {
    setTutorialStep(null);
    setTutorialDone(true);
    setLastAction(Date.now());
  };

  // --- Derivados ---
  const playing = phase === 'playing';
  const block = playing && tutorialStep === null ? detectBlock(game) : null;
  const idle = now - lastAction > HINT_AFTER_MS;
  const hint = playing && tutorialStep === null && idle && !block ? findMergePair(game.board) : null;
  let guide: [number, number] | null = null;
  if (tutorialStep === 2) {
    const seeds = game.board.flatMap((c, i) => (c?.level === 1 ? [i] : []));
    if (seeds.length >= 2) guide = [seeds[0], seeds[1]];
  }

  if (phase === 'title') {
    return (
      <div className="app">
        <Backdrop />
        <TitleScreen
          loading={loading}
          hasProgress={!!saved.game && !saved.game.won && saved.game.merges > 0}
          onPlay={() => startPlaying(false)}
          onNewGame={() => startPlaying(true)}
        />
      </div>
    );
  }

  return (
    <div className={`app phase-${phase}`}>
      <Backdrop />
      <div className="game">
        <Hud
          energy={game.energy}
          secondsToNext={Math.ceil(msToNextEnergy(game, now) / 1000)}
          progress={progress(game)}
          muted={muted}
          onToggleMute={() => {
            unlockAudio();
            setMuted((m) => !m);
          }}
          onHelp={() => playing && setTutorialStep(0)}
        />
        <Goals done={goalStatus(game)} celebrating={phase !== 'playing'} />

        <div className="board-area" ref={boardArea}>
          <Board
            board={game.board}
            cellSize={cellSize}
            locked={!playing || tutorialStep === 0 || tutorialStep === 3}
            freshIds={freshIds}
            effects={effects}
            hint={hint}
            guide={guide}
            onMove={handleMove}
            onInteract={unlockAudio}
          />
        </div>

        <Generator
          energy={game.energy}
          disabled={!playing}
          shake={shake}
          spotlight={tutorialStep === 1}
          celebrating={phase !== 'playing'}
          onGenerate={handleGenerate}
        />
      </div>

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.key} className="toast">
            {t.text}
          </div>
        ))}
      </div>

      {tutorialStep !== null && playing && <Tutorial step={tutorialStep} onNext={nextTutorial} onSkip={finishTutorial} />}

      {block && (
        <div className="modal-backdrop">
          <div className="modal card pop-in">
            <div className="modal-dogs">
              <Sprite src={IMG.muchacho} alt="Muchacho" className="jump" />
              <Sprite src={IMG.luna} alt="Luna" className="jump delay" />
            </div>
            <h2>{block === 'noEnergy' ? '¡Sin energía!' : '¡Jardín sin espacio!'}</h2>
            <p>
              {block === 'noEnergy'
                ? 'No quedan flores iguales para combinar. Muchacho y Luna te traen energía para seguir.'
                : 'No hay espacio ni combinaciones. Vamos a liberar una casilla.'}
            </p>
            <button className="btn btn-primary" onClick={handleRecover}>
              ¡Gracias, perritos! 🐾
            </button>
          </div>
        </div>
      )}

      {phase === 'celebrating' && <div className="bloom" />}
      {phase === 'victory' && <Victory onReplay={handleReplay} />}
    </div>
  );
}

function Backdrop() {
  return (
    <div className="backdrop" aria-hidden>
      <div className="backdrop-img" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}${IMG.balcon})` }} />
      <div className="backdrop-fade" />
    </div>
  );
}
