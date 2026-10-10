import { IMG } from '../game/assets';
import { Sprite } from './Sprite';

interface Props {
  energy: number;
  disabled: boolean;
  shake: number;
  spotlight: boolean;
  celebrating: boolean;
  onGenerate: () => void;
}

export function Generator({ energy, disabled, shake, spotlight, celebrating, onGenerate }: Props) {
  return (
    <footer className="footer">
      <Sprite src={IMG.muchacho} alt="Muchacho" className={`dog ${celebrating ? 'jump' : 'idle'}`} fallback="🐶" />
      <button
        key={shake}
        className={`generator ${shake ? 'shake' : ''} ${spotlight ? 'spotlight' : ''} ${energy <= 0 ? 'empty' : ''}`}
        onClick={onGenerate}
        disabled={disabled}
        aria-label="Regadera mágica: plantar una semilla"
      >
        <Sprite src={IMG.regadera} alt="" className="generator-img" fallback="🚿" />
        <span className="generator-label">Plantar</span>
        <span className="generator-cost">
          <Sprite src={IMG.energia} alt="" fallback="⚡" />1
        </span>
      </button>
      <Sprite src={IMG.luna} alt="Luna" className={`dog ${celebrating ? 'jump delay' : 'idle delay'}`} fallback="🐩" />
    </footer>
  );
}
