# 🌻 El jardín de Nazrit

Un pequeño juego web romántico de **combinar objetos (merge‑2)**: une dos semillas iguales para que crezcan, hasta crear el **Ramo de flores amarillas**. Al ganar aparece una sorpresa especial para Nazrit. 💛

**Jugar:** https://elardkochdev.github.io/Flor-amarilla/

## Cómo se juega

- Toca la **regadera** para plantar semillas (usa 1 ⚡; la energía se recarga sola cada 3 s).
- **Arrastra** un objeto sobre otro igual para combinarlo (o toca uno y luego el otro).
- Cadena: Semilla → Brote → Planta pequeña → Capullo → Margarita amarilla → Girasol → Ramo de flores amarillas.
- Los objetos grandes regalan energía. Si te quedas sin opciones, Muchacho y Luna te ayudan: no hay compras ni esperas obligatorias.
- Partida de ~3–5 minutos. El progreso se guarda en el navegador (localStorage).

## Desarrollo

Requisitos: Node 20+.

```bash
npm install
npm run dev       # http://localhost:5173/Flor-amarilla/
npm test          # pruebas de reglas de combinación y victoria (Vitest)
npm run build     # build de producción en dist/
npm run preview   # sirve dist/ en http://localhost:4173/Flor-amarilla/
```

### Estructura

```
src/
  game/        lógica pura (config, logic, storage, audio, assets, messages) + tests
  components/  Board (drag & drop táctil), Hud, Goals, Generator, Tutorial, Victory, TitleScreen…
public/assets/
  sprites/     items/ (cadena de flores) y characters/ (Nazrit, esposo, Muchacho, Luna)
  backgrounds/ fondos y escena final
  ui/          iconos y decoraciones
  effects/     brillos, pétalos, corazones
  audio/       (sonidos sintetizados con Web Audio, ver README dentro)
docs/referencia-arte.png   hoja de arte de referencia
```

## Publicación (GitHub Pages)

1. `vite.config.ts` usa `base: '/Flor-amarilla/'` (el nombre del repositorio). Si renombras el repo, cámbialo ahí.
2. En GitHub → **Settings → Pages → Source: GitHub Actions**.
3. Cada push a `main` ejecuta `.github/workflows/deploy.yml`: instalación → tests → build → despliegue.

## Recursos gráficos

Los sprites se recortaron (con fondo transparente) de la hoja de arte original `docs/referencia-arte.png`, y la **Semilla** es pixel art dibujado a mano para este proyecto. No se usa ningún recurso de Gossip Harbor.

Recursos que convendría reemplazar por versiones dedicadas en el futuro:

| Recurso | Nota |
| --- | --- |
| `sprites/items/semilla.png` | Placeholder pixel art simple (16 px escalado). |
| `sprites/items/ramo.png` | Es una caja de flores; podría ser un ramo 100 % amarillo. |
| `backgrounds/escena-final.png` | Recorte de la escena de referencia; el botón original se cubrió con arbustos. |
| `audio/` | Sin archivos: sonidos sintetizados. |
