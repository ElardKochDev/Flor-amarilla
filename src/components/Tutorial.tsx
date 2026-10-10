import { CHAIN } from '../game/config';
import { IMG } from '../game/assets';
import { Sprite } from './Sprite';

export type TutorialStep = 0 | 1 | 2 | 3;

interface Props {
  step: TutorialStep;
  onNext: () => void;
  onSkip: () => void;
}

export function Tutorial({ step, onNext, onSkip }: Props) {
  if (step === 0 || step === 3) {
    return (
      <div className="modal-backdrop">
        <div className="modal card pop-in">
          <Sprite src={IMG.esposoCara} alt="Tu esposo" className="modal-avatar" fallback="👨" />
          {step === 0 ? (
            <>
              <h2>¡Hola, mi amor!</h2>
              <p>
                Bienvenida a <b>tu jardín</b>. Hoy quiero que juntos hagamos crecer el ramo de{' '}
                <b>flores amarillas</b> más bonito del mundo. 🌻
              </p>
            </>
          ) : (
            <>
              <h2>¡Así se hace!</h2>
              <p>Combina siempre dos iguales para que tu jardín crezca:</p>
              <div className="chain">
                {CHAIN.map((c, i) => (
                  <span key={c.level} className="chain-step">
                    <Sprite src={c.sprite} alt={c.name} fallback="🌼" />
                    {i < CHAIN.length - 1 && <i>›</i>}
                  </span>
                ))}
              </div>
              <p className="small">Cumple los objetivos de arriba hasta crear el Ramo. Si te quedas sin energía, combina flores: ¡las grandes regalan ⚡!</p>
            </>
          )}
          <button className="btn btn-primary" onClick={onNext}>
            {step === 0 ? 'Empezar' : '¡A jugar!'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tutorial-bubble pop-in" role="status">
      <Sprite src={IMG.esposoCara} alt="" className="bubble-avatar" fallback="👨" />
      <p>
        {step === 1 ? (
          <>
            Toca la <b>regadera</b> para plantar semillas. Cada una usa <b>1 ⚡</b>, que se recarga sola.
          </>
        ) : (
          <>
            Ahora <b>arrastra una semilla sobre otra igual</b> para combinarlas.
          </>
        )}
      </p>
      <button className="skip" onClick={onSkip}>
        Saltar
      </button>
    </div>
  );
}
