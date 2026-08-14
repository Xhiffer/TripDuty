import { useRef, useState } from 'react'
import { useApp } from '../state'
import { Avatar, Toggle } from '../components/ui'
import { formatDay } from '../lib/i18n'

/** Reduit la photo pour qu'elle reste legere une fois stockee. */
async function shrinkImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const side = Math.min(bitmap.width, bitmap.height)
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size)
  return canvas.toDataURL('image/jpeg', 0.72)
}

export function Join() {
  const { state, t, lang, setMe, addMember } = useApp()
  const [mode, setMode] = useState<'pick' | 'create'>('pick')
  const [name, setName] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [hasLicense, setHasLicense] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function submit() {
    const clean = name.trim()
    if (!clean) return setError(t('nameRequired'))
    if (state.members.some((m) => m.name.toLowerCase() === clean.toLowerCase())) return setError(t('nameTaken'))
    const member = addMember(clean, photo, hasLicense)
    setMe(member.id)
  }

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark">⛰️</span>
          <span>
            {t('appName')}
            <div className="trip-meta">
              {state.trip.name} · {formatDay(state.trip.startDate, lang)} {t('to')} {formatDay(state.trip.endDate, lang)}
            </div>
          </span>
        </div>
      </div>

      <div className="card pop" style={{ marginTop: 8 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 24, letterSpacing: '-0.02em' }}>{t('joinTitle')}</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 18px', lineHeight: 1.45 }}>{t('joinSubtitle')}</p>

        {mode === 'pick' ? (
          <>
            <div className="people-grid">
              {state.members.map((m) => (
                <button key={m.id} type="button" className="person-chip" onClick={() => setMe(m.id)}>
                  <Avatar member={m} size={44} />
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => setMode('create')}>
              ＋ {t('joinNew')}
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <button type="button" onClick={() => fileRef.current?.click()} style={{ display: 'grid', placeItems: 'center', gap: 8 }}>
                <Avatar member={{ id: '', name, photo, hasLicense: false, role: 'member', joinedAt: '' }} size={88} />
                <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>
                  {photo ? t('changePhoto') : t('addPhoto')}
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) setPhoto(await shrinkImage(file))
                }}
              />
            </div>

            <label className="field">
              <span className="field-label">{t('yourName')}</span>
              <input
                className="input"
                value={name}
                placeholder={t('namePlaceholder')}
                onChange={(e) => {
                  setName(e.target.value)
                  setError('')
                }}
              />
            </label>

            <div style={{ marginBottom: 8 }}>
              <Toggle checked={hasLicense} onChange={setHasLicense} label={t('hasLicense')} />
              <p style={{ color: 'var(--muted)', fontSize: 12, margin: '8px 2px 0', lineHeight: 1.45 }}>
                {t('hasLicenseHelp')}
              </p>
            </div>

            {error && <p style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>{error}</p>}

            <div className="stack" style={{ marginTop: 16 }}>
              <button type="button" className="btn btn-primary btn-block" onClick={submit}>
                {t('enter')}
              </button>
              <button type="button" className="btn btn-block" onClick={() => setMode('pick')}>
                {t('cancel')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
