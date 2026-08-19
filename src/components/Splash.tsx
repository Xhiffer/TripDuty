import { useEffect, useState } from 'react'
import { LogoStacked } from './Logo'

/**
 * Ecran d'ouverture. Il tient deux secondes, le temps que l'application
 * charge, puis s'efface. Sur un telephone, c'est ce qui fait la difference
 * entre « un site qui met du temps » et « une application qui demarre ».
 *
 * C'est le seul endroit ou le logo empile s'affiche.
 */
export function Splash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const hold = setTimeout(() => setLeaving(true), 2000)
    const done = setTimeout(onDone, 2400)
    return () => {
      clearTimeout(hold)
      clearTimeout(done)
    }
  }, [onDone])

  return (
    <div className={`splash ${leaving ? 'is-leaving' : ''}`} aria-hidden="true">
      <div className="splash-photo" />
      <div className="splash-veil" />
      <LogoStacked className="splash-logo" />
    </div>
  )
}
