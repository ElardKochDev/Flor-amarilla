import { GOALS, itemDef } from '../game/config';
import { IMG } from '../game/assets';
import { Sprite } from './Sprite';

interface Props {
  done: boolean[];
  celebrating: boolean;
}

export function Goals({ done, celebrating }: Props) {
  return (
    <section className="goals-row">
      <Sprite src={IMG.nazrit} alt="Nazrit" className={`hero hero-left ${celebrating ? 'jump' : ''}`} fallback="👩" />
      <div className="goals card">
        <h2>Crea para Nazrit:</h2>
        <ul>
          {GOALS.map((g, i) => (
            <li key={g.level} className={done[i] ? 'done' : ''}>
              <div className="goal-icon">
                <Sprite src={itemDef(g.level).sprite} alt={g.label} fallback="🌼" />
                {done[i] && <span className="check">✔</span>}
              </div>
              <span className="goal-label">{g.label}</span>
            </li>
          ))}
        </ul>
      </div>
      <Sprite src={IMG.esposo} alt="Su esposo" className={`hero hero-right ${celebrating ? 'jump delay' : ''}`} fallback="👨" />
    </section>
  );
}
