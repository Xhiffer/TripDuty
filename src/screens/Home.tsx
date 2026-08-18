import { useMemo, useState } from 'react'
import { useApp, useBalances } from '../state'
import type { Task } from '../types'
import { formatBalance } from '../lib/ledger'
import { suggestForDay } from '../lib/suggest'
import { Avatar, MedalAvatar } from '../components/ui'
import { TaskRow } from '../components/TaskRow'
import { TaskSheet } from '../components/TaskSheet'
import { formatDay } from '../lib/i18n'

export function Home({ goRanking }: { goRanking: () => void }) {
  const { state, me, lang, t, activeDate } = useApp()
  const rows = useBalances()
  const [openTask, setOpenTask] = useState<Task | null>(null)

  const suggestions = useMemo(() => suggestForDay(state, rows, activeDate), [state, rows, activeDate])

  const top3 = rows.slice(0, 3)
  const mine = rows.find((r) => r.member.id === me?.id)

  const dayTasks = state.tasks
    .filter((task) => task.date === activeDate && !task.isClosing)
    .sort((a, b) => a.time.localeCompare(b.time))

  // Les taches ou l'app me place en tete, uniquement si je suis en negatif.
  const forMe =
    mine && mine.centi < 0 ? dayTasks.filter((task) => suggestions.get(task.id)?.[0]?.memberId === me?.id) : []

  const order: Array<0 | 1 | 2> = [1, 0, 2] // argent, or, bronze

  return (
    <>
      <div className="banner">{t('demoBanner')}</div>

      <div className="section-title">{t('podium')}</div>
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

      {mine && (
        <>
          <div className="section-title">{t('balance')}</div>
          <div className={`rank-row is-me ${mine.centi < 0 ? 'is-last' : ''}`}>
            <span className="rank-num">{mine.rank}</span>
            <Avatar member={mine.member} size={40} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="rank-name">{mine.member.name}</span>
              <span className="rank-sub">
                {mine.tasksDone} {mine.tasksDone > 1 ? t('tasksDone') : t('taskDoneOne')}
              </span>
            </span>
            <span className="rank-score" style={{ color: mine.centi < 0 ? 'var(--danger)' : 'var(--good)' }}>
              {formatBalance(mine.centi)}
            </span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 12, margin: '8px 2px 0', lineHeight: 1.45 }}>
            {t('balanceHelp')}
          </p>
        </>
      )}

      {forMe.length > 0 && (
        <>
          <div className="section-title">{t('suggestionsTitle')}</div>
          <div className="stack">
            {forMe.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                state={state}
                lang={lang}
                t={t}
                suggestions={suggestions.get(task.id)}
                onClick={() => setOpenTask(task)}
              />
            ))}
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 12, margin: '8px 2px 0', lineHeight: 1.45 }}>
            {t('suggestionHelp')}
          </p>
        </>
      )}

      <button type="button" className="btn btn-block" style={{ marginTop: 16 }} onClick={goRanking}>
        {t('seeAll')} →
      </button>

      <div className="section-title">
        {t('todayTasks')} · {formatDay(activeDate, lang)}
      </div>
      <div className="stack">
        {dayTasks.length === 0 && <div className="empty">{t('noTaskToday')}</div>}
        {dayTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            state={state}
            lang={lang}
            t={t}
            suggestions={suggestions.get(task.id)}
            onClick={() => setOpenTask(task)}
          />
        ))}
      </div>

      {openTask && <TaskSheet task={openTask} onClose={() => setOpenTask(null)} />}
    </>
  )
}
