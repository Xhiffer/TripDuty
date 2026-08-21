import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { Group, Person } from '../types'
import { flatColor, groupEmoji } from '../lib/identity'

/** Pastille de profil : la photo si elle existe, sinon les initiales sur la couleur du compte. */
export function Avatar({ member, size = 40 }: { member: Person | null; size?: number }) {
  const initials = member?.name?.trim().slice(0, 2).toUpperCase() || '?'
  const background = member?.photo ? undefined : (flatColor(member?.color) ?? 'var(--surface-2)')
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background,
        color: member?.photo ? undefined : '#fff',
        borderColor: member?.photo ? undefined : 'transparent',
      }}
    >
      {member?.photo ? (
        <img src={member.photo} alt={member.name} width={size} height={size} style={{ objectFit: 'cover' }} />
      ) : (
        initials
      )}
    </div>
  )
}

/**
 * La vignette d'un groupe : sa photo, sinon son icone.
 *
 * Sans photo, l'icone se pose nue, a la couleur du groupe : une pastille
 * coloree derriere un trait deja colore faisait double emploi.
 */
export function GroupMark({ group, small = false }: { group: Group; small?: boolean }) {
  if (group.photo) {
    return (
      <span className={`group-mark has-photo ${small ? 'is-small' : ''}`}>
        <img src={group.photo} alt="" className="group-photo" />
      </span>
    )
  }

  // Les icones du groupe appartiennent a ceux qui le creent : ils mettent
  // l'emoji qu'ils veulent. Les icones dessinees restent pour l'application.
  return (
    <span className={`group-mark ${small ? 'is-small' : ''}`}>
      <span className="group-emoji">{groupEmoji(group.emoji)}</span>
    </span>
  )
}

export function MedalAvatar({ member, place, size = 56 }: { member: Person; place: 1 | 2 | 3; size?: number }) {
  return (
    <div className={`medal-ring medal-${place}`}>
      <Avatar member={member} size={size} />
    </div>
  )
}

/**
 * L'entete d'une page interne : la fleche retour tombe exactement la ou se
 * trouve celle d'un groupe, pour qu'on la retrouve sans la chercher.
 */
export function PageHeader({
  title,
  onBack,
  backLabel,
}: {
  title: string
  onBack: () => void
  backLabel: string
}) {
  return (
    <div className="topbar">
      <button type="button" className="icon-button" onClick={onBack} aria-label={backLabel}>
        <ArrowLeft size={20} />
      </button>
      <div className="topbar-title">
        <span className="topbar-name">{title}</span>
      </div>
      <span className="icon-button is-ghost" />
    </div>
  )
}

export function Sheet({
  title,
  subtitle,
  onClose,
  from = 'bottom',
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  /* « top » descend sous l'entete, comme un menu deroulant. */
  from?: 'bottom' | 'top'
  children: ReactNode
}) {
  return (
    <div
      className={`sheet-backdrop is-from-${from}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={`sheet is-from-${from}`} role="dialog" aria-modal="true">
        {from === 'bottom' && <div className="sheet-grab" />}
        <h2 className="sheet-title">{title}</h2>
        {subtitle && <p className="sheet-sub">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button type="button" className={`toggle ${checked ? 'is-on' : ''}`} onClick={() => onChange(!checked)}>
      <span className="toggle-box">{checked ? '✓' : ''}</span>
      <span style={{ fontWeight: 600, fontSize: 14 }}>{label}</span>
    </button>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (v: T) => void
}) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button key={o.value} type="button" className={value === o.value ? 'is-on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
