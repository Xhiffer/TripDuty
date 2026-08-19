import { useState } from 'react'
import type { ReactNode } from 'react'
import { Plus, Ticket } from 'lucide-react'
import { useApp } from '../state'
import { CreateGroup } from './CreateGroup'
import { GroupMark, Sheet } from '../components/ui'
import { formatRange } from '../lib/i18n'

export function Groups({ header }: { header: ReactNode }) {
  const { myGroups, data, lang, t, selectGroup, joinByCode } = useApp()
  const [creating, setCreating] = useState(false)
  // La feuille du bas : d'abord le choix, puis la saisie du code si besoin.
  const [sheet, setSheet] = useState<'closed' | 'choice' | 'code'>('closed')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  if (creating) return <CreateGroup onDone={() => setCreating(false)} />

  async function join() {
    const result = await joinByCode(code)
    if (!result.ok) {
      setError(result.error === 'unknownCode' ? t('errUnknownCode') : t('errServer'))
      return
    }
    setCode('')
    setError('')
    setSheet('closed')
  }

  return (
    <>
      {header}

      <div className="stack" style={{ marginTop: 8 }}>
        {myGroups.length === 0 && <div className="empty">{t('noGroupYet')}</div>}
        {myGroups.map((group) => {
          const count = data.memberships.filter((m) => m.groupId === group.id).length
          return (
            <button key={group.id} type="button" className="group-card" onClick={() => selectGroup(group.id)}>
              <GroupMark group={group} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="group-name">{group.name}</span>
                <span className="group-meta">
                  {t(`kind_${group.kind}`)} · {count} {count > 1 ? t('people') : t('personOne')}
                </span>
                <span className="group-meta">{formatRange(group.startDate, group.endDate, lang)}</span>
              </span>
              <span className="group-arrow">→</span>
            </button>
          )
        })}
      </div>

      {/* Le geste principal reste sous le pouce, quelle que soit la longueur
          de la liste. La page lui reserve sa hauteur plus bas. */}
      <div className="bottom-action">
        <div className="bottom-action-inner">
          {__RECENT_CHANGES__[0] && (
            <span className="version-line">{__RECENT_CHANGES__[0].version}</span>
          )}
          <button type="button" className="btn btn-primary btn-block" onClick={() => setSheet('choice')}>
            <Plus size={18} />
            {t('createOrJoin')}
          </button>
        </div>
      </div>

      {sheet === 'choice' && (
        <Sheet title={t('createOrJoin')} onClose={() => setSheet('closed')}>
          <div className="stack">
            <button
              type="button"
              className="menu-row"
              onClick={() => {
                setSheet('closed')
                setCreating(true)
              }}
            >
              <Plus size={18} />
              <span style={{ flex: 1 }}>
                {t('createGroup')}
                <span className="menu-sub">{t('createGroupHelp')}</span>
              </span>
            </button>

            <button type="button" className="menu-row" onClick={() => setSheet('code')}>
              <Ticket size={18} />
              <span style={{ flex: 1 }}>
                {t('joinWithCode')}
                <span className="menu-sub">{t('joinWithCodeHelp')}</span>
              </span>
            </button>
          </div>
        </Sheet>
      )}

      {sheet === 'code' && (
        <Sheet title={t('joinWithCode')} subtitle={t('joinWithCodeHelp')} onClose={() => setSheet('closed')}>
          <input
            className="input invite-input"
            value={code}
            placeholder="ABC123"
            maxLength={8}
            autoFocus
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && code.trim().length >= 4) void join()
            }}
          />
          {error && <p className="form-error" style={{ margin: '12px 0 0' }}>{error}</p>}

          <div className="stack" style={{ marginTop: 14 }}>
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={code.trim().length < 4}
              onClick={() => void join()}
            >
              {t('join')}
            </button>
            <button type="button" className="btn btn-block" onClick={() => setSheet('choice')}>
              {t('back')}
            </button>
          </div>
        </Sheet>
      )}
    </>
  )
}
