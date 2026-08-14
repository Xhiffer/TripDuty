import { useState } from 'react'
import { tripDays, useApp } from '../state'
import type { Task } from '../types'
import { TaskRow } from '../components/TaskRow'
import { TaskSheet } from '../components/TaskSheet'
import { NewTaskSheet } from '../components/NewTaskSheet'
import { formatDay } from '../lib/i18n'

export function Planning() {
  const { state, lang, t, activeDate } = useApp()
  const [openTask, setOpenTask] = useState<Task | null>(null)
  const [creating, setCreating] = useState(false)

  const days = tripDays(state.trip)

  return (
    <>
      <div className="section-title" style={{ marginTop: 18 }}>
        {t('planningTitle')}
      </div>

      <button type="button" className="btn btn-primary btn-block" onClick={() => setCreating(true)}>
        ＋ {t('addTask')}
      </button>

      {days.map((day) => {
        const dayTasks = state.tasks
          .filter((task) => task.date === day)
          .sort((a, b) => a.time.localeCompare(b.time))
        return (
          <div key={day}>
            <div className="day-head">
              {formatDay(day, lang)}
              {day === activeDate && <span className="pill pill-accent">{t('today')}</span>}
            </div>
            <div className="stack">
              {dayTasks.length === 0 && <div className="empty">{t('noTaskToday')}</div>}
              {dayTasks.map((task) => (
                <TaskRow key={task.id} task={task} state={state} lang={lang} t={t} onClick={() => setOpenTask(task)} />
              ))}
            </div>
          </div>
        )
      })}

      {openTask && <TaskSheet task={openTask} onClose={() => setOpenTask(null)} />}
      {creating && <NewTaskSheet onClose={() => setCreating(false)} />}
    </>
  )
}
