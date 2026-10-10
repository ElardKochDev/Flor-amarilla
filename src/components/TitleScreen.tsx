import { IMG } from '../game/assets';
import { Sprite } from './Sprite';

interface Props {
  loading: number | null;
  hasProgress: boolean;
  onPlay: () => void;
  onNewGame: () => void;
}

/** Pantalla de inicio. También sirve para "desbloquear" el audio con el primer toque en iOS/Android. */
export function TitleScreen({ loading, hasProgress, onPlay, onNewGame }: Props) {
  return (
    <div className="title-screen">
      <div className="title-sun" />
      <div className="title-logo pop-in">
        <span className="logo-small">El jardín de</span>
        <span className="logo-big">Nazrit</span>
      </div>

      <div className="title-cast">
        <Sprite src={IMG.muchacho} alt="Muchacho" className="cast dog idle" fallback="🐶" />
        <Sprite src={IMG.nazrit} alt="Nazrit" className="cast hero idle delay" fallback="👩" />
        <Sprite src={IMG.esposo} alt="Su esposo" className="cast hero idle" fallback="👨" />
        <Sprite src={IMG.luna} alt="Luna" className="cast dog idle delay" fallback="🐩" />
      </div>
      <div className="title-flowers" aria-hidden>
        <Sprite src={IMG.arbusto} alt="" />
        <Sprite src={IMG.macetaGirasol} alt="" />
        <Sprite src={IMG.arbusto} alt="" />
      </div>

      {loading !== null ? (
        <div className="loader" aria-label="Cargando">
          <div className="bar">
            <div className="bar-fill" style={{ width: `${Math.round(loading * 100)}%` }} />
          </div>
          <p>Regando las flores… {Math.round(loading * 100)}%</p>
        </div>
      ) : (
        <div className="title-actions">
          <button className="btn btn-primary btn-big" onClick={onPlay}>
            {hasProgress ? 'Continuar' : 'Jugar'} 🌻
          </button>
          {hasProgress && (
            <button className="btn btn-ghost" onClick={onNewGame}>
              Empezar de nuevo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
