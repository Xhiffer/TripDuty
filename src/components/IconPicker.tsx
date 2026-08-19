import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { useApp } from '../state'
import { GROUP_ICONS, GROUP_ICON_KEYS, iconValue, solidColor } from '../lib/groupIcons'

/**
 * Le choix de l'icone d'un groupe.
 *
 * On propose d'abord nos icones au trait, pour que l'application garde son
 * allure. Le bouton « plus » ouvre le clavier du telephone, ou chacun peut
 * prendre l'emoji qu'il veut : on impose une esthetique, on n'enferme pas.
 */
export function IconPicker({
  value,
  color,
  onChange,
}: {
  value: string
  color: string
  onChange: (value: string) => void
}) {
  const { t } = useApp()
  const isEmoji = !value.startsWith('lucide:')
  const [emojiMode, setEmojiMode] = useState(isEmoji)
  const emojiRef = useRef<HTMLInputElement>(null)

  return (
    <div className="field">
      <span className="field-label">{t('groupIcon')}</span>

      <div className="icon-grid">
        {GROUP_ICON_KEYS.map((key) => {
          const Icon = GROUP_ICONS[key]
          const picked = value === iconValue(key)
          return (
            <button
              key={key}
              type="button"
              className={`icon-btn ${picked ? 'is-on' : ''}`}
              onClick={() => {
                setEmojiMode(false)
                onChange(iconValue(key))
              }}
              aria-label={key}
            >
              <Icon size={22} strokeWidth={1.9} color={picked ? solidColor(color) : undefined} />
            </button>
          )
        })}

        <button
          type="button"
          className={`icon-btn ${emojiMode ? 'is-on' : ''}`}
          onClick={() => {
            setEmojiMode(true)
            // Le champ prend le focus : le clavier emoji du telephone s'ouvre.
            setTimeout(() => emojiRef.current?.focus(), 50)
          }}
          aria-label={t('otherIcon')}
        >
          {emojiMode && isEmoji ? <span className="icon-emoji">{value}</span> : <Plus size={22} strokeWidth={2} />}
        </button>
      </div>

      {emojiMode && (
        <>
          <input
            ref={emojiRef}
            className="input"
            style={{ marginTop: 10, textAlign: 'center', fontSize: 26 }}
            value={isEmoji ? value : ''}
            maxLength={4}
            placeholder="🏝️"
            onChange={(e) => {
              const next = [...e.target.value].slice(0, 2).join('')
              if (next) onChange(next)
            }}
          />
          <span className="hint" style={{ textAlign: 'left', display: 'block' }}>
            {t('otherIconHelp')}
          </span>
        </>
      )}
    </div>
  )
}
