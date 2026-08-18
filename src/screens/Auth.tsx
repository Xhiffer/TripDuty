import { useState } from 'react'
import { useApp } from '../state'
import { isEmail } from '../lib/identity'
import { Segmented } from '../components/ui'

export function Auth() {
  const { t, signIn, signUp } = useApp()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setError('')
    if (!isEmail(email)) return setError(t('errBadEmail'))
    if (password.length < 6) return setError(t('errPasswordShort'))
    setBusy(true)
    const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password)
    setBusy(false)
    if (!result.ok) {
      const messages: Record<string, string> = {
        emailTaken: t('errEmailTaken'),
        passwordShort: t('errPasswordShort'),
        unknownAccount: t('errUnknownAccount'),
        wrongPassword: t('errWrongPassword'),
      }
      setError(messages[result.error] ?? result.error)
    }
  }

  return (
    <div className="app app-centered">
      <div className="hero">
        <span className="hero-mark">⛰️</span>
        <h1 className="hero-title">Trip Duty</h1>
        <p className="hero-sub">{t('authTagline')}</p>
      </div>

      <div className="card">
        <div style={{ marginBottom: 18 }}>
          <Segmented
            value={mode}
            onChange={(m) => {
              setMode(m)
              setError('')
            }}
            options={[
              { value: 'signin', label: t('signIn') },
              { value: 'signup', label: t('signUp') },
            ]}
          />
        </div>

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
              setError('')
            }}
          />
        </label>

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
              setError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit()
            }}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={() => void submit()}>
          {mode === 'signin' ? t('signIn') : t('createAccount')}
        </button>

        <p className="hint">{t('authLocalNote')}</p>
      </div>
    </div>
  )
}
