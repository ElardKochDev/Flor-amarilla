import { useMemo, useState, type CSSProperties } from 'react';
import { IMG } from '../game/assets';
import { VICTORY_MESSAGE, VICTORY_TITLE } from '../game/messages';
import { Sprite } from './Sprite';

const FALLING = [IMG.petalo1, IMG.petalo2, IMG.petalo3, IMG.petalo4, IMG.fxCorazon, IMG.florBrillo, 'assets/sprites/items/margarita.png', IMG.petaloRosa];

const TITLE_START = 1.2; // s
const LETTER_STEP = 0.045;
const WORD_STEP = 0.11;

interface Props {
  onReplay: () => void;
}

export function Victory({ onReplay }: Props) {
  const [shareMsg, setShareMsg] = useState('');

  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        src: FALLING[i % FALLING.length],
        style: {
          left: `${Math.random() * 100}%`,
          '--size': `${18 + Math.random() * 22}px`,
          '--dur': `${6 + Math.random() * 6}s`,
          '--delay': `${-Math.random() * 10}s`,
          '--sway': `${(Math.random() * 2 - 1) * 60}px`,
          '--spin': `${(Math.random() * 2 - 1) * 540}deg`,
        } as CSSProperties,
      })),
    [],
  );

  // Título letra por letra (agrupado por palabras para que no se corten).
  let letterIndex = 0;
  const titleWords = VICTORY_TITLE.split(' ').map((word, wi) => (
    <span key={wi} className="word">
      {Array.from(word).map((ch, ci) => {
        const delay = TITLE_START + letterIndex++ * LETTER_STEP;
        return (
          <span key={ci} className="letter" style={{ animationDelay: `${delay}s` }}>
            {ch}
          </span>
        );
      })}
    </span>
  ));
  const messageStart = TITLE_START + letterIndex * LETTER_STEP + 0.4;
  const messageWords = VICTORY_MESSAGE.split(' ');
  const buttonsDelay = messageStart + messageWords.length * WORD_STEP + 0.3;

  const share = async () => {
    const url = window.location.href.split('#')[0];
    const data = { title: 'El jardín de Nazrit', text: '🌻 Un jardín de flores amarillas hecho con amor', url };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareMsg('¡Enlace copiado!');
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      setShareMsg(url);
    }
  };

  return (
    <div className="victory" role="dialog" aria-modal="true" aria-label={VICTORY_TITLE}>
      <div className="victory-bg" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}${IMG.escenaFinal})` }} />
      <div className="victory-shade" />

      <div className="falling" aria-hidden>
        {particles.map((p, i) => (
          <Sprite key={i} src={p.src} alt="" className="fall" style={p.style} fallback="🌼" />
        ))}
      </div>

      <div className="victory-content">
        <div className="scene-frame">
          <Sprite src={IMG.escenaFinal} alt="Nazrit y su esposo abrazados con Muchacho y Luna" className="scene-img" fallback="💛" />
          <Sprite src={IMG.macetaGirasol} alt="" className="frame-deco tl" />
          <Sprite src={IMG.macetaGirasol} alt="" className="frame-deco tr" />
          <div className="float-hearts" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <Sprite key={i} src={IMG.fxCorazon} alt="" className={`float-heart h${i}`} fallback="❤️" />
            ))}
          </div>
        </div>

        <h1 className="victory-title" aria-label={VICTORY_TITLE}>
          <span aria-hidden>{titleWords}</span>
        </h1>

        <p className="victory-message card" aria-label={VICTORY_MESSAGE}>
          {messageWords.map((w, i) => (
            <span key={i} aria-hidden className="mword" style={{ animationDelay: `${messageStart + i * WORD_STEP}s` }}>
              {w}{' '}
            </span>
          ))}
        </p>

        <div className="victory-actions" style={{ animationDelay: `${buttonsDelay}s` }}>
          <button className="btn btn-primary" onClick={onReplay}>
            Volver a jugar
          </button>
          <button className="btn btn-secondary" onClick={share}>
            Compartir 💌
          </button>
        </div>
        {shareMsg && <p className="share-msg">{shareMsg}</p>}
      </div>
    </div>
  );
}
