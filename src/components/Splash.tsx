import { useEffect, useState } from 'react'

/**
 * Ecran d'ouverture. Il tient une seconde, le temps que l'application charge,
 * puis s'efface. Sur un telephone, c'est ce qui fait la difference entre
 * « un site qui met du temps » et « une application qui demarre ».
 */
export function Splash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const hold = setTimeout(() => setLeaving(true), 1000)
    const done = setTimeout(onDone, 1400)
    return () => {
      clearTimeout(hold)
      clearTimeout(done)
    }
  }, [onDone])

  return (
    <div className={`splash ${leaving ? 'is-leaving' : ''}`} aria-hidden="true">
      <div className="splash-photo" />
      <div className="splash-veil" />
      <div className="splash-center">
        <span className="splash-mark">⛰️</span>
        <span className="splash-name">Trip Duty</span>
      </div>
    </div>
  )
}
