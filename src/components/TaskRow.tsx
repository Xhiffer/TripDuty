import type { Lang, Task, TripState } from '../types'
import { CATALOG } from '../lib/catalog'
import { Avatar } from './ui'

export function taskTitle(task: Task, lang: Lang) {
  if (task.titleKey) {
    const found = CATALOG.find((c) => c.key === task.titleKey)
    if (found) return lang === 'en' ? found.en : found.fr
  }
  return task.title
}

export function TaskRow({
  task,
  state,
  lang,
  t,
  onClick,
}: {
  task: Task
  state: TripState
  lang: Lang
  t: (k: string) => string
  onClick: () => void
}) {
  const assignee = state.members.find((m) => m.id === task.assignedTo) ?? null
  const completion = state.completions.find((c) => c.taskId === task.id)
  const doers = completion
    ? completion.participantIds.map((id) => state.members.find((m) => m.id === id)).filter(Boolean)
    : []

  return (
    <button
      type="button"
      className={`task ${task.status === 'done' ? 'is-done' : ''} ${task.status === 'missed' ? 'is-missed' : ''}`}
      onClick={onClick}
    >
      <span className="task-emoji">{task.emoji}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="task-title">{taskTitle(task, lang)}</span>
        <span className="task-sub">
          <span>{task.time}</span>
          {task.status === 'done' && (
            <>
              <span className="pill pill-good">{t('done')}</span>
              {doers.map((m) => (
                <Avatar key={m!.id} member={m!} size={18} />
              ))}
            </>
          )}
          {task.status === 'missed' && <span className="pill pill-danger">{t('missed')}</span>}
          {task.status === 'todo' && assignee && (
            <>
              <Avatar member={assignee} size={18} />
              <span>{assignee.name}</span>
              {task.autoAssigned && <span className="dot" />}
            </>
          )}
          {task.status === 'todo' && !assignee && <span className="pill">{t('free')}</span>}
          {task.needsLicense && <span className="pill">{t('licenseNeeded')}</span>}
        </span>
      </span>
      <span className="task-points">
        {task.status === 'missed' ? `-${state.trip.penalty}` : `+${task.points}`}
      </span>
    </button>
  )
}
