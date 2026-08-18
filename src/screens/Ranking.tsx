import { useMemo } from 'react'
import { useApp, useBalances } from '../state'
import { formatBalance, settlements, toPoints } from '../lib/ledger'
import { Avatar } from '../components/ui'

const MEDALS = ['🥇', '🥈', '🥉']

export function Ranking() {
  const { state, me, t } = useApp()
  const rows = useBalances()
  const transfers = useMemo(() => settlements(rows), [rows])

  return (
    <>
      <div className="section-title" style={{ marginTop: 18 }}>
        {t('rankingTitle')}
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 13, margin: '-6px 0 14px', lineHeight: 1.45 }}>{t('balanceHelp')}</p>

      <div className="stack">
        {rows.map((row) => (
          <div
            key={row.member.id}
            className={`rank-row ${row.member.id === me?.id ? 'is-me' : ''} ${row.centi < 0 ? 'is-last' : ''}`}
          >
            <span className="rank-num">{row.rank <= 3 ? MEDALS[row.rank - 1] : row.rank}</span>
            <Avatar member={row.member} size={40} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="rank-name">
                {row.member.name}
                {row.member.hasLicense && <span title="permis">🔑</span>}
              </span>
              <span className="rank-sub">
                {row.tasksDone} {row.tasksDone > 1 ? t('tasksDone') : t('taskDoneOne')} · {toPoints(row.givenCenti)}{' '}
                {t('gaveToGroup')}
              </span>
            </span>
            <span className="rank-score" style={{ color: row.centi < 0 ? 'var(--danger)' : 'var(--good)' }}>
              {formatBalance(row.centi)}
            </span>
          </div>
        ))}
      </div>

      <div className="section-title">{t('whoOwesWho')}</div>
      <div className="stack">
        {transfers.length === 0 && <div className="empty">{t('allSettled')}</div>}
        {transfers.map((transfer, i) => {
          const from = state.members.find((m) => m.id === transfer.fromId)
          const to = state.members.find((m) => m.id === transfer.toId)
          if (!from || !to) return null
          return (
            <div key={i} className="rank-row">
              <Avatar member={from} size={32} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, lineHeight: 1.35 }}>
                <b>{from.name}</b> <span style={{ color: 'var(--muted)' }}>{t('owesTo')}</span> <b>{to.name}</b>
              </span>
              <Avatar member={to} size={32} />
              <span className="pill pill-accent">{toPoints(transfer.centi)}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}
