import { execSync } from 'node:child_process'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Les dernieres modifications, lues dans l'historique au moment de la
 * compilation. L'application peut ainsi dire qui a change quoi et quand,
 * sans avoir a interroger qui que ce soit.
 *
 * Le numero de version se deduit du nombre de commits : chaque envoi avance
 * d'un cran, et chaque cran s'arrete a neuf avant de passer au suivant.
 * 35 commits donnent 0.3.5, le centieme donnera 1.0.0.
 */
function versionOf(count: number) {
  return `${Math.floor(count / 100)}.${Math.floor(count / 10) % 10}.${count % 10}`
}

function recentChanges() {
  try {
    const total = Number(execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim())
    // %x1f separe les champs, %x1e les enregistrements : un message de commit
    // contient des retours a la ligne, pas ces caracteres-la.
    const raw = execSync('git log -12 --date=short "--format=%an%x1f%ad%x1f%s%x1f%b%x1e"', {
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
    })
    return raw
      .split('\u001e')
      .map((record) => record.trim())
      .filter(Boolean)
      .map((record, index) => {
        const [author, date, subject, body] = record.split('\u001f')
        return {
          version: versionOf(total - index),
          author,
          date,
          subject,
          // On retire la co-signature, puis on defait les retours a la ligne
          // du message : ils sont cales sur 80 colonnes, pas sur un telephone.
          // Les lignes vides restent, ce sont les paragraphes.
          body: (body ?? '')
            .split('\n')
            .filter((line) => !/^Co-Authored-By:/i.test(line.trim()))
            .join('\n')
            .trim()
            .replace(/([^\n])\n(?!\n)/g, '$1 '),
        }
      })
  } catch {
    // Historique indisponible : l'ecran n'affichera simplement rien.
    return []
  }
}

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
