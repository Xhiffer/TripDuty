import { useApp, useStandings } from '../state'
import { Avatar } from '../components/ui'

const MEDALS = ['🥇', '🥈', '🥉']

export function Ranking() {
  const { me, t } = useApp()
  const rows = useStandings()
  const lastId = rows.length > 1 ? rows[rows.length - 1].member.id : null

  return (
    <>
      <div className="section-title" style={{ marginTop: 18 }}>
        {t('rankingTitle')}
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 13, margin: '-6px 0 14px' }}>{t('rankingSubtitle')}</p>

      <div className="stack">
        {rows.map((row) => {
          const isLast = row.member.id === lastId
          return (
            <div
              key={row.member.id}
              className={`rank-row ${row.member.id === me?.id ? 'is-me' : ''} ${isLast ? 'is-last' : ''}`}
            >
              <span className="rank-num">{row.rank <= 3 ? MEDALS[row.rank - 1] : row.rank}</span>
              <Avatar member={row.member} size={40} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="rank-name">
                  {row.member.name}
                  {row.member.hasLicense && <span title="permis">🔑</span>}
                </span>
                <span className="rank-sub">
                  {row.tasksDone} {t('tasksDone')}
                </span>
              </span>
              {isLast && <span className="pill pill-danger">{t('lastPlaceBadge')}</span>}
              <span className="rank-score">{row.score}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}
