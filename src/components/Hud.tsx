import { MAX_ENERGY } from '../game/config';
import { IMG } from '../game/assets';
import { Sprite } from './Sprite';

interface Props {
  energy: number;
  secondsToNext: number;
  progress: number;
  muted: boolean;
  onToggleMute: () => void;
  onHelp: () => void;
}

export function Hud({ energy, secondsToNext, progress, muted, onToggleMute, onHelp }: Props) {
  const pct = Math.round(progress * 100);
  return (
    <header className="hud">
      <div className="pill energy" aria-label={`Energía ${energy} de ${MAX_ENERGY}`}>
        <Sprite src={IMG.energia} alt="" className="pill-icon" fallback="⚡" />
        <div className="pill-text">
          <strong>{energy}</strong>
          <small>{energy >= MAX_ENERGY ? 'MAX' : `+1 en ${secondsToNext}s`}</small>
        </div>
      </div>

      <div className="pill progress" aria-label={`Progreso ${pct}%`}>
        <Sprite src="assets/sprites/items/girasol.png" alt="" className="pill-icon" fallback="🌻" />
        <div className="bar">
          <div className="bar-fill" style={{ width: `${pct}%` }} />
          <span className="bar-text">{pct}%</span>
        </div>
      </div>

      <button className="icon-btn" onClick={onToggleMute} aria-label={muted ? 'Activar sonido' : 'Silenciar'}>
        {muted ? '🔇' : '🔊'}
      </button>
      <button className="icon-btn" onClick={onHelp} aria-label="Ver tutorial">
        ?
      </button>
    </header>
  );
}
