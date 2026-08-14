import { useState } from 'react'
import { useApp, useStandings } from '../state'
import type { Task } from '../types'
import { Avatar, MedalAvatar } from '../components/ui'
import { TaskRow, taskTitle } from '../components/TaskRow'
import { TaskSheet } from '../components/TaskSheet'
import { formatDay } from '../lib/i18n'

export function Home({ goRanking }: { goRanking: () => void }) {
  const { state, me, lang, t, activeDate } = useApp()
  const rows = useStandings()
  const [openTask, setOpenTask] = useState<Task | null>(null)

  const top3 = rows.slice(0, 3)
  const last = rows[rows.length - 1]
  const mine = rows.find((r) => r.member.id === me?.id)
  const iAmLast = !!mine && !!last && mine.member.id === last.member.id && rows.length > 1

  const myTask = state.tasks.find((task) => task.status === 'todo' && task.assignedTo === me?.id)
  const dayTasks = state.tasks
    .filter((task) => task.date === activeDate)
    .sort((a, b) => a.time.localeCompare(b.time))

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
                  <div className="podium-score">
                    {row.score} {t('points')}
                  </div>
                </div>
                <div className="podium-block">{place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉'}</div>
              </div>
            )
          })}
        </div>
      </div>

      {mine && (
        <>
          <div className="section-title">{t('myRank')}</div>
          <div className={`rank-row is-me ${iAmLast ? 'is-last' : ''}`}>
            <span className="rank-num">{mine.rank}</span>
            <Avatar member={mine.member} size={40} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="rank-name">{mine.member.name}</span>
              <span className="rank-sub">
                {mine.tasksDone} {t('tasksDone')}
              </span>
            </span>
            <span className="rank-score">{mine.score}</span>
          </div>
        </>
      )}

      {iAmLast && myTask && (
        <div className="callout pop" style={{ marginTop: 12 }}>
          <div className="callout-title">
            <span className="dot" /> {t('lastPlaceTitle')}
          </div>
          <p className="callout-body">{t('lastPlaceBody')}</p>
          <button type="button" className="task" style={{ marginTop: 12 }} onClick={() => setOpenTask(myTask)}>
            <span className="task-emoji">{myTask.emoji}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="task-title">{taskTitle(myTask, lang)}</span>
              <span className="task-sub">
                {formatDay(myTask.date, lang)} · {myTask.time}
              </span>
            </span>
            <span className="task-points">+{myTask.points}</span>
          </button>
        </div>
      )}

      {!iAmLast && last && (
        <div className="rank-row is-last" style={{ marginTop: 12 }}>
          <span className="dot" />
          <Avatar member={last.member} size={34} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="rank-name">{last.member.name}</span>
            <span className="rank-sub">{t('someoneLast')}</span>
          </span>
          <span className="pill pill-danger">{t('lastPlaceBadge')}</span>
        </div>
      )}

      <button type="button" className="btn btn-block" style={{ marginTop: 12 }} onClick={goRanking}>
        {t('seeAll')} →
      </button>

      <div className="section-title">
        {t('todayTasks')} · {formatDay(activeDate, lang)}
      </div>
      <div className="stack">
        {dayTasks.length === 0 && <div className="empty">{t('noTaskToday')}</div>}
        {dayTasks.map((task) => (
          <TaskRow key={task.id} task={task} state={state} lang={lang} t={t} onClick={() => setOpenTask(task)} />
        ))}
      </div>

      {openTask && <TaskSheet task={openTask} onClose={() => setOpenTask(null)} />}
    </>
  )
}
