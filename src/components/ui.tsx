import type { ReactNode } from 'react'
import type { Person } from '../types'

/** Pastille de profil : la photo si elle existe, sinon les initiales sur la couleur du compte. */
export function Avatar({ member, size = 40 }: { member: Person | null; size?: number }) {
  const initials = member?.name?.trim().slice(0, 2).toUpperCase() || '?'
  const background = member?.photo ? undefined : (member?.color ?? 'var(--surface-2)')
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

export function MedalAvatar({ member, place, size = 56 }: { member: Person; place: 1 | 2 | 3; size?: number }) {
  return (
    <div className={`medal-ring medal-${place}`}>
      <Avatar member={member} size={size} />
    </div>
  )
}

export function Sheet({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div
      className="sheet-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet-grab" />
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
