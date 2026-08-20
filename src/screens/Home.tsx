import { useMemo, useState } from 'react'
import { useGroup, useBalances } from '../state'
import type { Task } from '../types'
import { formatBalance } from '../lib/ledger'
import { suggestForDay } from '../lib/suggest'
import { Avatar } from '../components/ui'
import { TaskRow } from '../components/TaskRow'
import { TaskSheet } from '../components/TaskSheet'
import { NewTaskSheet } from '../components/NewTaskSheet'
import { Plus } from 'lucide-react'
import { formatDay } from '../lib/i18n'

export function Home() {
  const { state, me, lang, t, activeDate } = useGroup()
  const rows = useBalances()
  const [openTask, setOpenTask] = useState<Task | null>(null)
  const [creating, setCreating] = useState(false)

  const suggestions = useMemo(() => suggestForDay(state, rows, activeDate), [state, rows, activeDate])

  const mine = rows.find((r) => r.member.id === me?.id)

  const dayTasks = state.tasks
    .filter((task) => task.date === activeDate && !task.isClosing)
    .sort((a, b) => a.time.localeCompare(b.time))

  // Les taches ou l'app me place en tete, uniquement si je suis en negatif.
  const forMe =
    mine && mine.centi < 0
      ? dayTasks.filter((task) => suggestions.get(task.id)?.[0]?.memberId === me?.id)
      : []

  return (
    <>
      {mine && (
        <>
          <div className="section-title">{t('balance')}</div>
          <div className="rank-row is-quiet">
            <Avatar member={mine.member} size={40} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="rank-name">{mine.member.name}</span>
              <span className="rank-sub">
                {mine.tasksDone} {mine.tasksDone > 1 ? t('tasksDone') : t('taskDoneOne')}
              </span>
            </span>
            <span className="rank-score">{formatBalance(mine.centi)}</span>
          </div>
        </>
      )}


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

      <div className="bottom-action above-nav">
        <div className="bottom-action-inner is-inline">
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
            <Plus size={18} />
            {t('addTask')}
          </button>
        </div>
      </div>

      {openTask && <TaskSheet task={openTask} onClose={() => setOpenTask(null)} />}
      {creating && <NewTaskSheet onClose={() => setCreating(false)} />}
    </>
  )
}
