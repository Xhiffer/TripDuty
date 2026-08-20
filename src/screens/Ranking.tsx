import { useGroup, useBalances } from '../state'
import { formatBalance, toPoints } from '../lib/ledger'
import { Avatar, MedalAvatar } from '../components/ui'

const MEDALS = ['🥇', '🥈', '🥉']

export function Ranking() {
  const { me, t } = useGroup()
  const rows = useBalances()
  const top3 = rows.slice(0, 3)
  const order: Array<0 | 1 | 2> = [1, 0, 2] // argent, or, bronze

  return (
    <>
      <div className="section-title" style={{ marginTop: 18 }}>
        {t('podium')}
      </div>
      <div className="card">
        <div className="podium">
          {order.map((i) => {
            const row = top3[i]
            if (!row) return <div key={i} />
            const place = (i + 1) as 1 | 2 | 3
            return (
              <div key={row.member.id} className={`podium-slot podium-${place} pop`}>
                <MedalAvatar member={row.member} place={place} size={place === 1 ? 62 : 50} />
                <div style={{ minWidth: 0, width: '100%' }}>
                  <div className="podium-name">{row.member.name}</div>
                  <div className="podium-score">{formatBalance(row.centi)}</div>
                </div>
                <div className="podium-block">{place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉'}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="section-title">{t('rankingTitle')}</div>

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
              </span>
              <span className="rank-sub">
                {row.tasksDone} {row.tasksDone > 1 ? t('tasksDone') : t('taskDoneOne')} ·{' '}
                {toPoints(row.givenCenti)} {t('gaveToGroup')}
              </span>
            </span>
            <span className="rank-score" style={{ color: row.centi < 0 ? 'var(--danger)' : 'var(--good)' }}>
              {formatBalance(row.centi)}
            </span>
          </div>
        ))}
      </div>

    </>
  )
}
