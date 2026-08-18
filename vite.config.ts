import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// L'application est servie a la racine du domaine sur notre serveur.
// VITE_BASE_PATH permet de la servir depuis un sous-dossier si besoin.
export default defineConfig({
  plugins: [react()],
  // Sur le serveur, l'application est servie a la racine du domaine.
  base: process.env.VITE_BASE_PATH ?? '/',
  server: {
    port: 3400,
    // En developpement, l'API tourne a cote : on lui passe les appels /api.
    proxy: {
      '/api': { target: 'http://127.0.0.1:8090', changeOrigin: true },
    },
  },
})
