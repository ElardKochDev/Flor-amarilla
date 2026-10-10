import { useState, type CSSProperties } from 'react';
import { asset } from '../game/assets';

interface Props {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  /** Emoji que se muestra si la imagen no carga. */
  fallback?: string;
}

/** Imagen pixel art con respaldo si el archivo falla al cargar. */
export function Sprite({ src, alt, className, style, fallback = '🌼' }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className={`sprite-fallback ${className ?? ''}`} style={style} role="img" aria-label={alt}>
        {fallback}
      </span>
    );
  }
  return (
    <img
      src={asset(src)}
      alt={alt}
      className={className}
      style={style}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
