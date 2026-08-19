import { execSync } from 'node:child_process'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Les dernieres modifications, lues dans l'historique au moment de la
 * compilation. L'application peut ainsi dire qui a change quoi et quand,
 * sans avoir a interroger qui que ce soit.
 */
function recentChanges() {
  try {
    // %x1f est un separateur invisible : aucun message de commit ne le contient.
    const raw = execSync('git log -12 --date=short "--format=%an%x1f%ad%x1f%s"', { encoding: 'utf8' })
    return raw
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [author, date, subject] = line.split('\u001f')
        return { author, date, subject }
      })
  } catch {
    // Historique indisponible : l'ecran n'affichera simplement rien.
    return []
  }
}

// GitHub Pages sert le site depuis /<nom-du-depot>/, alors qu'un hebergeur
// comme Cloudflare Pages sert depuis la racine. Le chemin est pilote par
// l'environnement pour pouvoir changer d'hebergeur sans toucher au code.
const base = process.env.VITE_BASE_PATH ?? '/TripDuty/'

export default defineConfig({
  plugins: [react()],
  define: {
    __RECENT_CHANGES__: JSON.stringify(recentChanges()),
  },
  base,
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: { reporter: ['text', 'lcov'], include: ['src/lib/**'] },
  },
})
