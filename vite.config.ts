import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// GitHub Pages sert le site depuis /<nom-du-depot>/, alors qu'un hebergeur
// comme Cloudflare Pages sert depuis la racine. Le chemin est pilote par
// l'environnement pour pouvoir changer d'hebergeur sans toucher au code.
const base = process.env.VITE_BASE_PATH ?? '/TripDuty/'

export default defineConfig({
  plugins: [react()],
  base,
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: { reporter: ['text', 'lcov'], include: ['src/lib/**'] },
  },
})
