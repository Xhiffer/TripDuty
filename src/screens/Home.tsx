import { useMemo, useState } from 'react'
import { useGroup, useBalances } from '../state'
import type { Task } from '../types'
import { formatBalance } from '../lib/ledger'
import { suggestForDay } from '../lib/suggest'
import { Avatar } from '../components/ui'
import { TaskRow } from '../components/TaskRow'
import { TaskSheet } from '../components/TaskSheet'

export function Home() {
  const { state, me, lang, t, activeDate } = useGroup()
  const rows = useBalances()
  const [openTask, setOpenTask] = useState<Task | null>(null)

  const suggestions = useMemo(() => suggestForDay(state, rows, activeDate), [state, rows, activeDate])

  const mine = rows.find((r) => r.member.id === me?.id)

  const lowest = rows.length > 0 ? Math.min(...rows.map((r) => r.centi)) : 0
  const highest = rows.length > 0 ? Math.max(...rows.map((r) => r.centi)) : 0
  const spread = highest - lowest
  const position = mine && spread > 0 ? ((mine.centi - lowest) / spread) * 100 : 50

  const dayTasks = state.tasks
    .filter((task) => task.date === activeDate && !task.isClosing)
    .sort((a, b) => a.time.localeCompare(b.time))

  // Les taches ou l'app me place en tete, uniquement si je suis dans la
  // moitie basse du groupe : sinon tout le monde recevrait des suggestions.
  const forMe =
    mine && rows.length > 1 && mine.rank > rows.length / 2
      ? dayTasks.filter((task) => suggestions.get(task.id)?.[0]?.memberId === me?.id)
      : []

  return (
    <>
      {mine && (
        <>
          <div className="section-title">{t('balance')}</div>
          <div className="balance-card">
            <Avatar member={mine.member} size={44} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="rank-name">{mine.member.name}</span>
              <span className="rank-sub">
                {mine.tasksDone} {mine.tasksDone > 1 ? t('tasksDone') : t('taskDoneOne')}
              </span>
            </span>
            <span className="balance-figure">{formatBalance(mine.centi)}</span>
          </div>
          {/* Un solde seul ne dit rien : c'est en voyant ou il tombe entre le
              plus bas et le plus haut du groupe qu'il devient parlant. */}
          {spread > 0 && (
            <div className="balance-bar">
              <span className="balance-dot" style={{ left: `${position}%` }} />
            </div>
          )}
        </>
      )}


      <div className="section-title">{t('todayTasks')}</div>

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

      {openTask && <TaskSheet task={openTask} onClose={() => setOpenTask(null)} />}
    </>
  )
}
