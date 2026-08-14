import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base doit correspondre au nom du depot GitHub pour que GitHub Pages
// serve correctement les fichiers depuis /TripDuty/
export default defineConfig({
  plugins: [react()],
  base: '/TripDuty/',
})
