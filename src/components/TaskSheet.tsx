import { useState } from 'react'
import type { Task } from '../types'
import { useApp } from '../state'
import { pointsEachFor } from '../lib/scoring'
import { Avatar, Sheet } from './ui'
import { taskTitle } from './TaskRow'
import { formatDay } from '../lib/i18n'

export function TaskSheet({ task, onClose }: { task: Task; onClose: () => void }) {
  const { state, me, isChef, lang, t, validateTask, markMissed, cancelCompletion, deleteTask, assignTask } = useApp()
  const completion = state.completions.find((c) => c.taskId === task.id)
  const [selected, setSelected] = useState<string[]>(() => {
    if (completion) return completion.participantIds
    if (task.assignedTo) return [task.assignedTo]
    return me ? [me.id] : []
  })

  const eligible = state.members.filter((m) => !task.needsLicense || m.hasLicense)
  const each = pointsEachFor(task.points, selected.length)
  const validator = completion ? state.members.find((m) => m.id === completion.validatedBy) : null

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <Sheet
      title={`${task.emoji}  ${taskTitle(task, lang)}`}
      subtitle={`${formatDay(task.date, lang)} · ${task.time} · +${task.points} ${t('points')}`}
      onClose={onClose}
    >
      {task.status === 'done' && completion ? (
        <>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
              {completion.participantIds.map((id) => {
                const m = state.members.find((x) => x.id === id)
                if (!m) return null
                return (
                  <span key={id} className="row" style={{ gap: 6 }}>
                    <Avatar member={m} size={26} />
                    <b style={{ fontSize: 14 }}>{m.name}</b>
                    <span className="pill pill-good">+{completion.pointsEach}</span>
                  </span>
                )
              })}
            </div>
            {validator && (
              <div className="rank-sub" style={{ marginTop: 10 }}>
                {t('validatedBy')} {validator.name}
              </div>
            )}
          </div>
          {isChef ? (
            <button type="button" className="btn btn-danger btn-block" onClick={() => { cancelCompletion(task.id); onClose() }}>
              {t('cancelValidation')}
            </button>
          ) : (
            <p className="sheet-sub">{t('onlyChef')}</p>
          )}
        </>
      ) : (
        <>
          <p className="sheet-sub" style={{ marginTop: -6 }}>
            {t('validateTitle')} {t('validateHelp')}
          </p>
          <div className="people-grid" style={{ marginBottom: 16 }}>
            {eligible.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`person-chip ${selected.includes(m.id) ? 'is-on' : ''}`}
                onClick={() => toggle(m.id)}
              >
                <Avatar member={m} size={38} />
                <span>{m.name}</span>
              </button>
            ))}
          </div>

          {selected.length > 0 && (
            <div className="banner" style={{ marginBottom: 14 }}>
              {t('eachGets')} <b>+{each}</b> {t('points')}
            </div>
          )}

          <div className="stack">
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={selected.length === 0}
              onClick={() => { validateTask(task.id, selected); onClose() }}
            >
              ✅ {t('validate')}
            </button>

            {task.assignedTo !== (me?.id ?? null) && task.status === 'todo' && me && (
              <button type="button" className="btn btn-block" onClick={() => { assignTask(task.id, me.id); onClose() }}>
                {t('takeIt')}
              </button>
            )}

            {isChef && task.status === 'todo' && (
              <button type="button" className="btn btn-danger btn-block" onClick={() => { markMissed(task.id); onClose() }}>
                {t('markMissed')} ({t('missedWarning')} {state.trip.penalty} {t('missedWarning2')})
              </button>
            )}

            {task.status === 'missed' && isChef && (
              <button type="button" className="btn btn-block" onClick={() => { cancelCompletion(task.id); onClose() }}>
                {t('cancelValidation')}
              </button>
            )}

            {isChef && (
              <button type="button" className="btn btn-block" onClick={() => { deleteTask(task.id); onClose() }}>
                🗑️ {t('cancel')}
              </button>
            )}
          </div>
        </>
      )}
    </Sheet>
  )
}
