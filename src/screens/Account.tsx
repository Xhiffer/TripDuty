import { useRef, useState } from 'react'
import { useApp } from '../state'
import { AVATAR_COLORS, initialsOf } from '../lib/identity'
import { Segmented } from '../components/ui'

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

/**
 * Le profil du compte, en dehors de tout groupe.
 * L'ecran « Moi » d'un groupe garde ce qui concerne le groupe ; ici on ne
 * touche qu'a ce qui suit la personne partout.
 */
export function Account() {
  const { account, lang, theme, t, setLang, setTheme, updateProfile, signOut, shared, deactivateAccount } = useApp()
  const [deactivating, setDeactivating] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  if (!account) return null

  const initials = initialsOf(account.firstName, account.lastName)

  return (
    <>
      <div className="section-title" style={{ marginTop: 18 }}>
        {t('meTitle')}
      </div>

      <div className="card">
        <div style={{ display: 'grid', placeItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="avatar avatar-xl"
            style={{ background: account.photo ? undefined : account.color, borderColor: 'transparent' }}
          >
            {account.photo ? (
              <img src={account.photo} alt="" width={96} height={96} style={{ objectFit: 'cover' }} />
            ) : (
              initials
            )}
          </button>
          <span className="rank-name" style={{ fontSize: 18 }}>
            {account.firstName} {account.lastName}
          </span>
          <span className="rank-sub">{account.email}</span>
          <div className="row" style={{ gap: 8, marginTop: 4 }}>
            <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
              {account.photo ? t('changePhoto') : t('addPhoto')}
            </button>
            {account.photo && (
              <button type="button" className="btn btn-sm" onClick={() => updateProfile({ photo: null })}>
                {t('removePhoto')}
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (file) updateProfile({ photo: await shrinkImage(file) })
            }}
          />
        </div>

        {!account.photo && (
          <div className="field" style={{ marginTop: 18, marginBottom: 0 }}>
            <span className="field-label">{t('yourColor')}</span>
            <div className="color-grid">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-dot ${account.color === c ? 'is-on' : ''}`}
                  style={{ background: c }}
                  onClick={() => updateProfile({ color: c })}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="section-title">{t('language')}</div>
      <Segmented
        value={lang}
        onChange={setLang}
        options={[
          { value: 'fr', label: 'Français' },
          { value: 'en', label: 'English' },
        ]}
      />

      <div className="section-title">{t('theme')}</div>
      <Segmented
        value={theme}
        onChange={setTheme}
        options={[
          { value: 'dark', label: `🌙 ${t('themeDark')}` },
          { value: 'light', label: `☀️ ${t('themeLight')}` },
        ]}
      />

      <button type="button" className="btn btn-block" style={{ marginTop: 24 }} onClick={signOut}>
        {t('signOut')}
      </button>

      {shared && (
        <>
          <div className="section-title">{t('deactivateAccount')}</div>
          <div className="card">
            <p className="sheet-sub" style={{ marginTop: 0 }}>
              {t('deactivateHelp')}
            </p>
            {error && <p className="form-error">{error}</p>}
            {deactivating ? (
              <div className="stack">
                <button
                  type="button"
                  className="btn btn-danger btn-block"
                  onClick={async () => {
                    setError('')
                    const result = await deactivateAccount()
                    if (!result.ok) {
                      const messages: Record<string, string> = {
                        stillHost: t('errStillHost'),
                        onlyOnline: t('errOnlyOnline'),
                      }
                      setDeactivating(false)
                      setError(messages[result.error] ?? t('errServer'))
                    }
                  }}
                >
                  {t('deactivateConfirm')}
                </button>
                <button type="button" className="btn btn-block" onClick={() => setDeactivating(false)}>
                  {t('cancel')}
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-block" onClick={() => setDeactivating(true)}>
                {t('deactivateAccount')}
              </button>
            )}
          </div>
        </>
      )}
    </>
  )
}
