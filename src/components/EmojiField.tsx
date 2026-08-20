import { useRef } from 'react'
import { useApp } from '../state'

/**
 * L'icone du groupe : un emoji, celui que la personne veut.
 *
 * C'est un champ de saisie deguise en bouton carre. Le toucher ouvre le
 * clavier du telephone, ou l'on bascule sur les emojis : on propose donc
 * toute la bibliotheque du systeme sans en embarquer une seule.
 */
export function EmojiField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useApp()
  const ref = useRef<HTMLInputElement>(null)

  return (
    <input
      ref={ref}
      className="emoji-field"
      value={value}
      maxLength={4}
      placeholder="🏝️"
      aria-label={t('groupIcon')}
      onChange={(e) => {
        // Un seul symbole, meme quand il est compose de plusieurs caracteres.
        const first = [...e.target.value.trim()].slice(0, 3).join('')
        onChange(first)
      }}
    />
  )
}
