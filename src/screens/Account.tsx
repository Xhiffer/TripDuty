import { useRef, useState } from 'react'
import { useApp } from '../state'
import { AVATAR_COLORS, initialsOf } from '../lib/identity'
import { Segmented, Sheet } from '../components/ui'
import { Bell, Info, HelpCircle, LogOut, Trash2, ChevronRight, History } from 'lucide-react'
import { Faq } from './Faq'
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

/**
 * Le profil du compte, en dehors de tout groupe.
 * L'ecran « Moi » d'un groupe garde ce qui concerne le groupe ; ici on ne
 * touche qu'a ce qui suit la personne partout.
 */
export function Account() {
  const { account, lang, theme, t, setLang, setTheme, updateProfile, signOut, shared, deactivateAccount } = useApp()
  const [deactivating, setDeactivating] = useState(false)
  const [error, setError] = useState('')
  const [sheet, setSheet] = useState<'about' | 'changes' | null>(null)
  const [showFaq, setShowFaq] = useState(false)
  const [confirmWord, setConfirmWord] = useState('')

  // Les noms des comptes qui poussent le code, tels qu'on les reconnait.
  const AUTHORS: Record<string, string> = { ismoou: 'Ismaël' }
  const who = (name: string) => AUTHORS[name] ?? name

  const changes = __RECENT_CHANGES__
  const last = changes[0]
  const fileRef = useRef<HTMLInputElement>(null)
  if (!account) return null

  const initials = initialsOf(account.firstName, account.lastName)

  if (showFaq) return <Faq onClose={() => setShowFaq(false)} />

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

        <div className="row" style={{ gap: 10, marginTop: 18 }}>
          <label className="field" style={{ flex: 1, marginBottom: 0 }}>
            <span className="field-label">{t('firstName')}</span>
            <input
              className="input"
              value={account.firstName}
              onChange={(e) => updateProfile({ firstName: e.target.value })}
            />
          </label>
          <label className="field" style={{ flex: 1, marginBottom: 0 }}>
            <span className="field-label">{t('lastName')}</span>
            <input
              className="input"
              value={account.lastName}
              onChange={(e) => updateProfile({ lastName: e.target.value })}
            />
          </label>
        </div>

        <label className="field" style={{ marginTop: 14, marginBottom: 0 }}>
          <span className="field-label">{t('nickname')}</span>
          <input
            className="input"
            value={account.nickname}
            maxLength={24}
            placeholder={account.firstName}
            onChange={(e) => updateProfile({ nickname: e.target.value })}
          />
          <span className="hint" style={{ textAlign: 'left', display: 'block' }}>
            {t('nicknameHelp')}
          </span>
        </label>

        <label className="field" style={{ marginTop: 14, marginBottom: 0 }}>
          <span className="field-label">{t('email')}</span>
          <input className="input" value={account.email} readOnly disabled />
        </label>

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

      <div className="section-title">{t('notifications')}</div>
      <div className="menu-row is-quiet">
        <Bell size={18} />
        <span style={{ flex: 1 }}>{t('notifications')}</span>
        <span className="pill">{t('comingSoon')}</span>
      </div>
      <p className="hint" style={{ textAlign: 'left' }}>
        {t('notificationsHelp')}
      </p>

      <div className="section-title">{t('about')}</div>
      <div className="stack">
        <button type="button" className="menu-row" onClick={() => setSheet('about')}>
          <Info size={18} />
          <span style={{ flex: 1 }}>{t('about')}</span>
          <ChevronRight size={17} />
        </button>
        <button type="button" className="menu-row" onClick={() => setShowFaq(true)}>
          <HelpCircle size={18} />
          <span style={{ flex: 1 }}>{t('faq')}</span>
          <ChevronRight size={17} />
        </button>

        {last && (
          <button type="button" className="menu-row" onClick={() => setSheet('changes')}>
            <History size={18} />
            <span style={{ flex: 1 }}>
              {t('lastUpdate')}
              <span className="menu-sub">
                {who(last.author)} · {formatDay(last.date, lang)}
              </span>
            </span>
            <ChevronRight size={17} />
          </button>
        )}
      </div>

      <button type="button" className="menu-row" style={{ marginTop: 24 }} onClick={signOut}>
        <LogOut size={18} />
        <span style={{ flex: 1 }}>{t('signOut')}</span>
      </button>

      {shared && (
        <>
          <div className="section-title">{t('deleteAccount')}</div>
          <div className="card">
            <p className="sheet-sub" style={{ marginTop: 0 }}>
              {t('deleteAccountWarning')}
            </p>
            {error && <p className="form-error">{error}</p>}
            {deactivating ? (
              <div className="stack">
                <label className="field" style={{ marginBottom: 0 }}>
                  <span className="field-label">{t('deleteAccountType')}</span>
                  <input
                    className="input"
                    value={confirmWord}
                    placeholder={t('deleteAccountWord')}
                    onChange={(e) => setConfirmWord(e.target.value.toUpperCase())}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-danger btn-block"
                  disabled={confirmWord.trim() !== t('deleteAccountWord')}
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
                <button
                  type="button"
                  className="btn btn-block"
                  onClick={() => {
                    setDeactivating(false)
                    setConfirmWord('')
                  }}
                >
                  {t('cancel')}
                </button>
              </div>
            ) : (
              <button type="button" className="menu-row is-danger" onClick={() => setDeactivating(true)}>
                <Trash2 size={18} />
                <span style={{ flex: 1 }}>{t('deleteAccount')}</span>
              </button>
            )}
          </div>
        </>
      )}

      {sheet === 'changes' && (
        <Sheet title={t('changesTitle')} onClose={() => setSheet(null)}>
          <div className="stack">
            {changes.map((change, i) => (
              <div key={i} className="rank-row">
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="rank-name" style={{ fontSize: 14 }}>
                    {change.subject}
                  </span>
                  <span className="rank-sub">
                    {who(change.author)} · {formatDay(change.date, lang)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Sheet>
      )}

      {sheet === 'about' && (
        <Sheet title={t('about')} onClose={() => setSheet(null)}>
          <p className="sheet-body">{t('aboutBody')}</p>
          <p className="sheet-body">{t('aboutVersion')}</p>
        </Sheet>
      )}

    </>
  )
}
