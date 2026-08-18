import { useRef, useState } from 'react'
import { useApp } from '../state'
import { AVATAR_COLORS, initialsOf } from '../lib/identity'

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

export function ProfileSetup() {
  const { account, t, updateProfile } = useApp()
  const [firstName, setFirstName] = useState(account?.firstName ?? '')
  const [lastName, setLastName] = useState(account?.lastName ?? '')
  const [birthDate, setBirthDate] = useState(account?.birthDate ?? '')
  const [photo, setPhoto] = useState<string | null>(account?.photo ?? null)
  const [color, setColor] = useState(account?.color ?? AVATAR_COLORS[0])
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const initials = initialsOf(firstName, lastName)

  function submit() {
    if (!firstName.trim()) return setError(t('errFirstNameRequired'))
    if (!lastName.trim()) return setError(t('errLastNameRequired'))
    if (!birthDate) return setError(t('errBirthDateRequired'))
    updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), birthDate, photo, color })
  }

  return (
    <div className="app app-centered">
      <div className="hero">
        <h1 className="hero-title">{t('profileTitle')}</h1>
        <p className="hero-sub">{t('profileSub')}</p>
      </div>

      <div className="card">
        <div style={{ display: 'grid', placeItems: 'center', gap: 10, marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="avatar avatar-xl"
            style={{ background: photo ? undefined : color, borderColor: 'transparent' }}
          >
            {photo ? <img src={photo} alt="" width={96} height={96} style={{ objectFit: 'cover' }} /> : initials}
          </button>
          <div className="row" style={{ gap: 8 }}>
            <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
              {photo ? t('changePhoto') : t('addPhoto')}
            </button>
            {photo && (
              <button type="button" className="btn btn-sm" onClick={() => setPhoto(null)}>
                {t('removePhoto')}
              </button>
            )}
          </div>
          <p className="hint" style={{ margin: 0 }}>
            {t('photoOptional')}
          </p>
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

        {!photo && (
          <div className="field">
            <span className="field-label">{t('yourColor')}</span>
            <div className="color-grid">
              {AVATAR_COLORS.map((c) => (
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
        )}

        <div className="row" style={{ gap: 10 }}>
          <label className="field" style={{ flex: 1 }}>
            <span className="field-label">{t('firstName')}</span>
            <input
              className="input"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value)
                setError('')
              }}
            />
          </label>
          <label className="field" style={{ flex: 1 }}>
            <span className="field-label">{t('lastName')}</span>
            <input
              className="input"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value)
                setError('')
              }}
            />
          </label>
        </div>

        <label className="field">
          <span className="field-label">{t('birthDate')}</span>
          <input
            className="input"
            type="date"
            value={birthDate}
            onChange={(e) => {
              setBirthDate(e.target.value)
              setError('')
            }}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="button" className="btn btn-primary btn-block" onClick={submit}>
          {t('continue')}
        </button>
      </div>
    </div>
  )
}
