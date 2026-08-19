import { useState } from 'react'
import { useApp } from '../state'
import { isEmail } from '../lib/identity'
import { Segmented } from '../components/ui'

type Mode = 'signin' | 'signup' | 'forgot'

export function Auth() {
  const { t, signIn, signUp, resetPassword, shared } = useApp()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  function clear() {
    setError('')
    setNotice('')
  }

  const messages: Record<string, string> = {
    emailTaken: t('errEmailTaken'),
    passwordShort: t('errPasswordShort'),
    unknownAccount: t('errUnknownAccount'),
    wrongPassword: t('errWrongPassword'),
    onlyOnline: t('errOnlyOnline'),
  }

  async function submit() {
    clear()
    if (!isEmail(email)) return setError(t('errBadEmail'))

    if (mode === 'forgot') {
      setBusy(true)
      const result = await resetPassword(email)
      setBusy(false)
      if (!result.ok) return setError(messages[result.error] ?? t('errServer'))
      return setNotice(t('resetSent'))
    }

    if (password.length < 6) return setError(t('errPasswordShort'))

    if (mode === 'signin') {
      setBusy(true)
      const result = await signIn(email, password)
      setBusy(false)
      if (!result.ok) setError(messages[result.error] ?? t('errServer'))
      return
    }

    // Creation de compte : rien d'autre que l'adresse et le mot de passe.
    // Le nom et la date de naissance sont demandes a l'ecran suivant.
    if (password !== confirm) return setError(t('errPasswordMismatch'))

    setBusy(true)
    const result = await signUp(email, password)
    setBusy(false)
    if (!result.ok) setError(messages[result.error] ?? t('errServer'))
  }

  return (
    <div className="app app-centered">
      <div className="hero">
        <span className="hero-mark">⛰️</span>
        <h1 className="hero-title">Trip Duty</h1>
        <p className="hero-sub">{t('authTagline')}</p>
      </div>

      <div className="card">
        {mode === 'forgot' ? (
          <div className="field-label" style={{ marginBottom: 12, fontSize: 15, color: 'var(--text)' }}>
            {t('forgotTitle')}
          </div>
        ) : (
          <div style={{ marginBottom: 18 }}>
            <Segmented
              value={mode}
              onChange={(m) => {
                setMode(m)
                clear()
              }}
              options={[
                { value: 'signin' as Mode, label: t('signIn') },
                { value: 'signup' as Mode, label: t('signUp') },
              ]}
            />
          </div>
        )}

        <label className="field">
          <span className="field-label">{t('email')}</span>
          <input
            className="input"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            placeholder="prenom@exemple.fr"
            onChange={(e) => {
              setEmail(e.target.value)
              clear()
            }}
          />
        </label>

        {mode !== 'forgot' && (
          <label className="field">
            <span className="field-label">{t('password')}</span>
            <input
              className="input"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              placeholder="••••••"
              onChange={(e) => {
                setPassword(e.target.value)
                clear()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && mode === 'signin') void submit()
              }}
            />
          </label>
        )}

        {mode === 'signup' && (
          <label className="field">
            <span className="field-label">{t('passwordAgain')}</span>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={confirm}
              placeholder="••••••"
              onChange={(e) => {
                setConfirm(e.target.value)
                clear()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submit()
              }}
            />
          </label>
        )}

        {error && <p className="form-error">{error}</p>}
        {notice && <p className="form-notice">{notice}</p>}

        <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={() => void submit()}>
          {mode === 'signin' ? t('signIn') : mode === 'signup' ? t('createAccount') : t('sendResetLink')}
        </button>

        {mode === 'signin' && (
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setMode('forgot')
              clear()
            }}
          >
            {t('forgotPassword')}
          </button>
        )}

        {mode === 'forgot' && (
          <>
            <p className="hint" style={{ textAlign: 'left' }}>
              {t('forgotHelp')}
            </p>
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setMode('signin')
                clear()
              }}
            >
              {t('back')}
            </button>
          </>
        )}

        {mode !== 'forgot' && <p className="hint">{shared ? t('authSharedNote') : t('authLocalNote')}</p>}
      </div>
    </div>
  )
}
