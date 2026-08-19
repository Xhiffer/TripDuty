import { useRef, useState } from 'react'
import { useApp } from '../state'
import type { Group, GroupKind } from '../types'
import { GROUP_COLORS, GROUP_EMOJIS, inviteLink, isEmail } from '../lib/identity'
import { Camera, Trash2 } from 'lucide-react'
import { Toggle } from '../components/ui'

/** Reduit la photo du groupe pour qu'elle reste legere. */
async function shrinkGroupPhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const size = 400
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const side = Math.min(bitmap.width, bitmap.height)
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size)
  return canvas.toDataURL('image/jpeg', 0.72)
}

function plusDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const KINDS: Array<{ kind: GroupKind; emoji: string }> = [
  { kind: 'vacances', emoji: '🏝️' },
  { kind: 'couple', emoji: '❤️' },
  { kind: 'potes', emoji: '🍻' },
]

export function CreateGroup({ onDone }: { onDone: () => void }) {
  const { t, createGroup, inviteByEmail, data, selectGroup } = useApp()
  const [step, setStep] = useState<'kind' | 'details' | 'invite'>('kind')
  const [kind, setKind] = useState<GroupKind>('vacances')
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('⛰️')
  const [photo, setPhoto] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [color, setColor] = useState(GROUP_COLORS[0])
  const [startDate, setStartDate] = useState(plusDays(0))
  const [endDate, setEndDate] = useState(plusDays(7))
  const [openEnded, setOpenEnded] = useState(false)
  const hasLicense = false
  const [error, setError] = useState('')
  const [group, setGroup] = useState<Group | null>(null)
  const [invite, setInvite] = useState('')
  const [invited, setInvited] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  async function submitDetails() {
    if (!name.trim()) return setError(t('errGroupNameRequired'))
    if (!openEnded && endDate < startDate) return setError(t('errBadDates'))
    const created = await createGroup({
      kind,
      name,
      emoji,
      photo,
      color,
      startDate,
      endDate: openEnded ? null : endDate,
      hasLicense,
    })
    // La base peut refuser. Passer a l'ecran d'invitation sans groupe
    // afficherait un code vide, sans rien dire de ce qui a echoue.
    if (!created) return setError(t('errServer'))
    setGroup(created)
    setStep('invite')
  }

  function submitInvite() {
    setError('')
    if (!isEmail(invite)) return setError(t('errBadEmail'))
    const result = inviteByEmail(invite)
    if (!result.ok) {
      const messages: Record<string, string> = {
        noAccountForEmail: t('errNoAccountForEmail'),
        alreadyMember: t('errAlreadyMember'),
      }
      return setError(messages[result.error] ?? t('errServer'))
    }
    setInvited((prev) => [...prev, invite.trim().toLowerCase()])
    setInvite('')
  }

  if (step === 'kind') {
    return (
      <>
        <div className="hero">
          <h1 className="hero-title">{t('createGroup')}</h1>
          <p className="hero-sub">{t('chooseKind')}</p>
        </div>
        <div className="stack">
          {KINDS.map((option) => (
            <button
              key={option.kind}
              type="button"
              className="kind-card"
              onClick={() => {
                setKind(option.kind)
                setEmoji(option.kind === 'couple' ? '❤️' : option.kind === 'potes' ? '🍻' : '⛰️')
                setStep('details')
              }}
            >
              <span className="kind-emoji">{option.emoji}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="group-name">{t(`kind_${option.kind}`)}</span>
                <span className="group-meta">{t(`kind_${option.kind}_help`)}</span>
              </span>
              <span className="group-arrow">→</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-block" style={{ marginTop: 18 }} onClick={onDone}>
          {t('cancel')}
        </button>
      </>
    )
  }

  if (step === 'details') {
    return (
      <>
        <div className="hero">
          <h1 className="hero-title">{t(`kind_${kind}`)}</h1>
          <p className="hero-sub">{t('groupDetailsSub')}</p>
        </div>

        <div className="card">
          <label className="field">
            <span className="field-label">{t('groupName')}</span>
            <input
              className="input"
              value={name}
              placeholder={kind === 'vacances' ? 'Gorges du Verdon' : ''}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
            />
          </label>

          <div className="row" style={{ gap: 10 }}>
            <label className="field" style={{ flex: 1 }}>
              <span className="field-label">{t('from')}</span>
              <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            {!openEnded && (
              <label className="field" style={{ flex: 1 }}>
                <span className="field-label">{t('to')}</span>
                <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </label>
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <Toggle checked={openEnded} onChange={setOpenEnded} label={t('noEndDate')} />
            <p className="hint" style={{ textAlign: 'left' }}>
              {t('noEndDateHelp')}
            </p>
          </div>

          <div className="field">
            <span className="field-label">{t('groupPhoto')}</span>
            {photo ? (
              <div className="receipt-preview">
                <img src={photo} alt="" />
                <button type="button" className="btn btn-sm" onClick={() => setPhoto(null)}>
                  <Trash2 size={15} />
                  {t('removePhoto')}
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-block" onClick={() => fileRef.current?.click()}>
                <Camera size={17} />
                {t('addGroupPhoto')}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (file) setPhoto(await shrinkGroupPhoto(file))
              }}
            />
          </div>

          <div className="field">
            <span className="field-label">{t('groupIcon')}</span>
            <div className="emoji-grid">
              {GROUP_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={`emoji-btn ${emoji === e ? 'is-on' : ''}`}
                  onClick={() => setEmoji(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field-label">{t('groupColor')}</span>
            <div className="color-grid">
              {GROUP_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-dot ${color === c ? 'is-on' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="button" className="btn btn-primary btn-block" onClick={submitDetails}>
            {t('create')}
          </button>
        </div>

        <button type="button" className="btn btn-block" style={{ marginTop: 12 }} onClick={() => setStep('kind')}>
          {t('back')}
        </button>
      </>
    )
  }

  const link = group ? inviteLink(group.inviteCode) : ''

  return (
    <>
      <div className="hero">
        <span className="hero-mark" style={{ background: group?.color }}>
          {group?.emoji}
        </span>
        <h1 className="hero-title">{group?.name}</h1>
        <p className="hero-sub">{t('inviteSub')}</p>
      </div>

      <div className="card">
        <div className="field-label">{t('inviteByLink')}</div>
        <div className="invite-code">{group?.inviteCode}</div>
        <button
          type="button"
          className="btn btn-block"
          style={{ marginTop: 10 }}
          onClick={async () => {
            try {
              if (navigator.share) await navigator.share({ title: 'Trip Duty', url: link })
              else await navigator.clipboard.writeText(link)
              setCopied(true)
            } catch {
              setCopied(false)
            }
          }}
        >
          🔗 {copied ? t('linkCopied') : t('shareLink')}
        </button>

        <div className="field-label" style={{ marginTop: 20 }}>
          {t('inviteByEmail')}{' '}
          <span style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 12 }}>· {t('comingSoon')}</span>
        </div>
        <p className="hint" style={{ marginTop: 0 }}>
          {t('inviteByEmailHelp')}
        </p>
        <div className="row" style={{ gap: 8 }}>
          <input
            className="input"
            type="email"
            disabled
            inputMode="email"
            value={invite}
            placeholder="prenom@exemple.fr"
            onChange={(e) => {
              setInvite(e.target.value)
              setError('')
            }}
          />
          <button type="button" className="btn" onClick={submitInvite} disabled>
            {t('add')}
          </button>
        </div>
        {error && <p className="form-error">{error}</p>}

        {invited.length > 0 && (
          <div className="stack" style={{ marginTop: 12 }}>
            {invited.map((mail) => {
              const person = data.accounts.find((a) => a.email === mail)
              return (
                <div key={mail} className="rank-row">
                  <span className="task-emoji" style={{ background: person?.color, color: '#fff' }}>
                    {(person?.firstName ?? mail).slice(0, 1).toUpperCase()}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="rank-name">{person ? `${person.firstName} ${person.lastName}` : mail}</span>
                    <span className="rank-sub">{mail}</span>
                  </span>
                  <span className="pill pill-good">{t('invited')}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        className="btn btn-primary btn-block"
        style={{ marginTop: 18 }}
        onClick={() => {
          if (group) selectGroup(group.id)
          onDone()
        }}
      >
        {t('goToGroup')}
      </button>
    </>
  )
}
