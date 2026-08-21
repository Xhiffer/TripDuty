import { useMemo, useState } from 'react'
import { groupDays, useGroup, useBalances } from '../state'
import type { Task } from '../types'
import { suggestForDay, type Suggestion } from '../lib/suggest'
import { TaskRow } from '../components/TaskRow'
import { TaskSheet } from '../components/TaskSheet'
import { formatDay } from '../lib/i18n'

export function Planning() {
  const { state, lang, t, activeDate } = useGroup()
  const rows = useBalances()
  const [openTask, setOpenTask] = useState<Task | null>(null)

  const days = groupDays(state.group)
  const suggestions = useMemo(() => {
    const map = new Map<string, Suggestion[]>()
    for (const day of days) {
      for (const [taskId, list] of suggestForDay(state, rows, day)) map.set(taskId, list)
    }
    return map
  }, [state, rows, days])

  return (
    <>
      <div className="section-title" style={{ marginTop: 18 }}>
        {t('planningTitle')}
      </div>


      {days.map((day) => {
        const dayTasks = state.tasks
          .filter((task) => task.date === day && !task.isClosing)
          .sort((a, b) => a.time.localeCompare(b.time))
        const isToday = day === activeDate
        return (
          <div key={day}>
            {/* Le jour courant ne s'annonce pas, il se voit : sa date passe en
                gras et prend la couleur de l'application. */}
            <div className={`day-head ${isToday ? 'is-today' : ''}`}>{formatDay(day, lang)}</div>
            <div className="stack">
              {dayTasks.length === 0 && <div className="empty">{t('noTaskDay')}</div>}
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
          </div>
        )
      })}

      {openTask && <TaskSheet task={openTask} onClose={() => setOpenTask(null)} />}
    </>
  )
}
