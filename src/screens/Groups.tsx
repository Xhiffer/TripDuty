import { useState } from 'react'
import { useApp } from '../state'
import { CreateGroup } from './CreateGroup'
import { formatDay } from '../lib/i18n'

export function Groups() {
  const { account, myGroups, lang, t, selectGroup, joinByCode, signOut } = useApp()
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
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark">⛰️</span>
          <span>
            {t('myGroups')}
            <div className="trip-meta">{account?.firstName}</div>
          </span>
        </div>
        <button type="button" className="btn btn-sm" onClick={signOut}>
          {t('signOut')}
        </button>
      </div>

      <div className="stack" style={{ marginTop: 8 }}>
        {myGroups.length === 0 && <div className="empty">{t('noGroupYet')}</div>}
        {myGroups.map((group) => {
          const count = group.memberCount
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

      <div className="section-title">{t('joinWithCode')}</div>
      <div className="row" style={{ gap: 8 }}>
        <input
          className="input"
          value={code}
          placeholder="ABC123"
          style={{ textTransform: 'uppercase' }}
          onChange={(e) => {
            setCode(e.target.value)
            setError('')
          }}
        />
        <button type="button" className="btn" disabled={code.trim().length < 4} onClick={() => void join()}>
          {t('join')}
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}
