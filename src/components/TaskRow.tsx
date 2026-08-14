import type { Lang, Task, TripState } from '../types'
import type { Suggestion } from '../lib/suggest'
import { CATALOG } from '../lib/catalog'
import { CLOSING_CATALOG } from '../lib/closing'
import { Avatar } from './ui'

export function taskTitle(task: Task, lang: Lang) {
  if (task.titleKey) {
    const found = CATALOG.find((c) => c.key === task.titleKey) ?? CLOSING_CATALOG.find((c) => c.key === task.titleKey)
    if (found) return lang === 'en' ? found.en : found.fr
  }
  return task.title
}

/** Etiquette qui dit d'un coup d'oeil pour qui la tache est faite. */
function ForWhom({ task, state, t }: { task: Task; state: TripState; t: (k: string) => string }) {
  if (task.beneficiaryIds === null) return null
  const count = task.beneficiaryIds.length
  if (count === 1 && task.beneficiaryIds[0] === task.assignedTo) return <span className="pill">{t('solo')}</span>
  if (count >= state.members.length) return null
  return (
    <span className="pill">
      {t('partial')} · {count}
    </span>
  )
}

export function TaskRow({
  task,
  state,
  lang,
  t,
  suggestions,
  onClick,
}: {
  task: Task
  state: TripState
  lang: Lang
  t: (k: string) => string
  suggestions?: Suggestion[]
  onClick: () => void
}) {
  const assignee = state.members.find((m) => m.id === task.assignedTo) ?? null
  const entry = state.entries.find((e) => e.taskId === task.id)
  const doers = entry ? entry.doerIds.map((id) => state.members.find((m) => m.id === id)).filter(Boolean) : []
  const suggested = suggestions?.[0] ? state.members.find((m) => m.id === suggestions[0].memberId) : null

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
            </>
          )}
          {task.status === 'todo' && !assignee && suggested && (
            <span style={{ opacity: 0.75 }}>
              {t('suggested')} : {suggested.name}
            </span>
          )}
          {task.status === 'todo' && !assignee && !suggested && <span className="pill">{t('free')}</span>}
          <ForWhom task={task} state={state} t={t} />
          {task.needsLicense && <span className="pill">🔑</span>}
        </span>
      </span>
      <span className="task-points">
        {task.status === 'missed' ? `-${state.trip.penalty}` : `+${task.points}`}
      </span>
    </button>
  )
}
