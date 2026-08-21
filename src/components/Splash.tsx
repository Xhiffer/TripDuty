import { useEffect, useState } from 'react'
import { LogoStacked } from './Logo'

/**
 * Les illustrations de la marque, semees autour du logo.
 *
 * Elles laissent une bande libre au milieu : c'est la que le logo se pose, et
 * une illustration qui passerait derriere le rendrait illisible. Les positions
 * sont ecrites a la main plutot que tirees au sort, pour que l'ecran soit le
 * meme a chaque ouverture.
 */
const SCATTER = [
  { file: '11-fete.png', top: 4, left: 30, size: 92, tilt: -14 },
  { file: '02-casserole.png', top: 6, left: 52, size: 104, tilt: 8 },
  { file: '08-lave-linge.png', top: 2, left: 74, size: 96, tilt: 12 },
  { file: '01-mixeur.png', top: 17, left: 36, size: 96, tilt: -6 },
  { file: '10-poubelle.png', top: 15, left: 66, size: 90, tilt: 10 },
  { file: '03-poele-oeuf.png', top: 12, left: 12, size: 84, tilt: -18 },
  { file: '04-salade.png', top: 25, left: 84, size: 82, tilt: 14 },

  { file: '09-courses.png', top: 66, left: 32, size: 100, tilt: -10 },
  { file: '06-spray-nettoyant.png', top: 64, left: 72, size: 92, tilt: 16 },
  { file: '05-vaisselle.png', top: 76, left: 52, size: 96, tilt: 6 },
  { file: '12-liste.png', top: 84, left: 30, size: 90, tilt: -8 },
  { file: '07-balai.png', top: 86, left: 70, size: 94, tilt: 18 },
]

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
      {SCATTER.map((item) => (
        <img
          key={item.file}
          className="splash-illu"
          src={`${import.meta.env.BASE_URL}illus/${item.file}`}
          alt=""
          style={{
            top: `${item.top}%`,
            left: `${item.left}%`,
            width: item.size,
            transform: `translate(-50%, -50%) rotate(${item.tilt}deg)`,
          }}
        />
      ))}
      <LogoStacked className="splash-logo" />
    </div>
  )
}
