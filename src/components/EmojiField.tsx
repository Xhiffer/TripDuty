import { useState, type ReactNode } from 'react'
import { useApp } from '../state'
import { GROUP_EMOJIS } from '../lib/catalog'

/**
 * L'icone du groupe posee devant son nom.
 *
 * Le carre ouvre une planche d'emojis sur toute la largeur, sous la ligne du
 * nom. On ne se repose plus sur le clavier du telephone : sur un ordinateur,
 * il faut aller le chercher dans un menu du systeme, et personne n'y pense.
 * Le champ libre en bas reste la pour coller n'importe quel autre symbole.
 *
 * Le champ du nom passe en enfant pour que la planche s'ouvre en dessous des
 * deux, et non a cote du carre.
 */
export function EmojiField({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  const { t } = useApp()
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="row" style={{ gap: 10 }}>
        <button
          type="button"
          className="emoji-field"
          aria-label={t('groupIcon')}
          aria-expanded={open}
          onClick={() => setOpen((was) => !was)}
        >
          {value}
        </button>
        {children}
      </div>

      {open && (
        <div className="emoji-grid emoji-sheet">
          {GROUP_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className={`emoji-btn ${value === e ? 'is-on' : ''}`}
              onClick={() => {
                onChange(e)
                setOpen(false)
              }}
            >
              {e}
            </button>
          ))}
          <input
            className="input emoji-free"
            value={value}
            maxLength={4}
            placeholder={t('otherIcon')}
            onChange={(event) => {
              // Un seul symbole, meme quand il est compose de plusieurs caracteres.
              onChange([...event.target.value.trim()].slice(0, 3).join(''))
            }}
          />
        </div>
      )}
    </>
  )
}
