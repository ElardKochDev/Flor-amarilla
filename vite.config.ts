import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages sirve el sitio en https://<usuario>.github.io/<repositorio>/
const REPO_BASE = '/Flor-amarilla/';

export default defineConfig({
  base: REPO_BASE,
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
