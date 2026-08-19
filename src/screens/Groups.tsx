import { useState } from 'react'
import { useApp } from '../state'
import { CreateGroup } from './CreateGroup'
import { InstallButton } from '../components/InstallButton'
import { formatDay } from '../lib/i18n'

export function Groups() {
  const { myGroups, data, lang, t, selectGroup, joinByCode } = useApp()
  const [creating, setCreating] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  if (creating) return <CreateGroup onDone={() => setCreating(false)} />

  async function join() {
    const result = await joinByCode(code)
    if (!result.ok) {
      setError(result.error === 'unknownCode' ? t('errUnknownCode') : t('errServer'))
    } else {
      setCode('')
      setError('')
    }
  }

  return (
    <>
      <div className="app-header">
        <span className="app-wordmark">Trip Duty</span>
      </div>

      <div className="stack" style={{ marginTop: 8 }}>
        {myGroups.length === 0 && <div className="empty">{t('noGroupYet')}</div>}
        {myGroups.map((group) => {
          const count = data.memberships.filter((m) => m.groupId === group.id).length
          return (
            <button key={group.id} type="button" className="group-card" onClick={() => selectGroup(group.id)}>
              <span className="group-mark" style={{ background: group.color }}>
                {group.emoji}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="group-name">{group.name}</span>
                <span className="group-meta">
                  {t(`kind_${group.kind}`)} · {count} {t('people')}
                </span>
                <span className="group-meta">
                  {formatDay(group.startDate, lang)} {t('to')} {formatDay(group.endDate, lang)}
                </span>
              </span>
              <span className="group-arrow">→</span>
            </button>
          )
        })}
      </div>

      <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 18 }} onClick={() => setCreating(true)}>
        ＋ {t('createGroup')}
      </button>

      <InstallButton />

      <div className="section-title">{t('joinWithCode')}</div>
      <div className="card">
        <p className="sheet-sub" style={{ marginTop: 0 }}>
          {t('joinWithCodeHelp')}
        </p>
        <div className="row" style={{ gap: 8 }}>
          <input
            className="input invite-input"
            value={code}
            placeholder="ABC123"
            maxLength={8}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && code.trim().length >= 4) void join()
            }}
          />
          <button
            type="button"
            className={`btn ${code.trim().length >= 4 ? 'btn-primary' : ''}`}
            disabled={code.trim().length < 4}
            onClick={() => void join()}
          >
            {t('join')}
          </button>
        </div>
        {error && <p className="form-error" style={{ margin: '12px 0 0' }}>{error}</p>}
      </div>
    </>
  )
}
