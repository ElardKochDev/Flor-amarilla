import { describe, expect, it } from 'vitest';
import { VICTORY_MESSAGE, VICTORY_TITLE } from './messages';

describe('mensaje final', () => {
  it('tiene el texto exacto dedicado a Nazrit', () => {
    expect(VICTORY_TITLE).toBe('¡Feliz día de las flores amarillas, mi amada esposa Nazrit!');
    expect(VICTORY_MESSAGE).toBe(
      'Eres la flor más hermosa de mi vida. Gracias por llenar nuestros días de amor, alegría y felicidad. Te amo muchísimo. ❤️',
    );
  });

  it('al separarlo en palabras/letras para la animación se reconstruye igual', () => {
    expect(VICTORY_TITLE.split(' ').map((w) => Array.from(w).join('')).join(' ')).toBe(VICTORY_TITLE);
    expect(VICTORY_MESSAGE.split(' ').join(' ')).toBe(VICTORY_MESSAGE);
  });
});
