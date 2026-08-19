import { useState } from 'react'
import type { Task } from '../types'
import { useGroup } from '../state'
import { beneficiariesOf, completionAmounts, formatBalance } from '../lib/ledger'
import { Avatar, Segmented, Sheet } from './ui'
import { taskTitle } from './TaskRow'
import { formatDay } from '../lib/i18n'

export function TaskSheet({ task, onClose }: { task: Task; onClose: () => void }) {
  const { state, me, isChef, lang, t, validateTask, markMissed, reopenTask, deleteTask, takeTask } = useGroup()
  const entry = state.entries.find((e) => e.taskId === task.id)
  const everyone = state.members.map((m) => m.id)

  const [doers, setDoers] = useState<string[]>(() => {
    if (entry) return entry.doerIds
    if (task.assignedTo) return [task.assignedTo]
    return me ? [me.id] : []
  })
  const [scope, setScope] = useState<'all' | 'some'>(task.beneficiaryIds === null ? 'all' : 'some')
  const [beneficiaries, setBeneficiaries] = useState<string[]>(() => beneficiariesOf(task, state.members))

  const eligible = state.members
  const finalBeneficiaries = scope === 'all' ? everyone : beneficiaries
  const preview =
    doers.length > 0 && finalBeneficiaries.length > 0
      ? completionAmounts(task.points, doers, finalBeneficiaries, state.members.length)
      : {}

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  const mine = task.assignedTo === me?.id

  return (
    <Sheet
      title={`${task.emoji}  ${taskTitle(task, lang)}`}
      subtitle={`${formatDay(task.date, lang)} · ${task.time} · ${task.points} ${t('points')}`}
      onClose={onClose}
    >
      {entry ? (
        <>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="stack">
              {Object.entries(entry.amounts)
                .filter(([, amount]) => amount !== 0)
                .sort((a, b) => b[1] - a[1])
                .map(([id, amount]) => {
                  const m = state.members.find((x) => x.id === id)
                  if (!m) return null
                  return (
                    <div key={id} className="row">
                      <Avatar member={m} size={26} />
                      <b style={{ fontSize: 14, flex: 1 }}>{m.name}</b>
                      <span className={`pill ${amount > 0 ? 'pill-good' : 'pill-danger'}`}>
                        {formatBalance(amount)}
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
          {isChef ? (
            <button type="button" className="btn btn-danger btn-block" onClick={() => { reopenTask(task.id); onClose() }}>
              {t('cancelValidation')}
            </button>
          ) : (
            <p className="sheet-sub">{t('onlyChef')}</p>
          )}
        </>
      ) : (
        <>
          <div className="field-label">{t('whoDid')}</div>
          <div className="people-grid" style={{ marginBottom: 18 }}>
            {eligible.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`person-chip ${doers.includes(m.id) ? 'is-on' : ''}`}
                onClick={() => toggle(doers, setDoers, m.id)}
              >
                <Avatar member={m} size={38} />
                <span>{m.name}</span>
              </button>
            ))}
          </div>

          <div className="field-label">{t('forWhom')}</div>
          <div style={{ marginBottom: 12 }}>
            <Segmented
              value={scope}
              onChange={setScope}
              options={[
                { value: 'all', label: t('everyone') },
                { value: 'some', label: t('choosePeople') },
              ]}
            />
          </div>

          {scope === 'some' && (
            <div className="people-grid" style={{ marginBottom: 14 }}>
              {state.members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`person-chip ${beneficiaries.includes(m.id) ? 'is-on' : ''}`}
                  onClick={() => toggle(beneficiaries, setBeneficiaries, m.id)}
                >
                  <Avatar member={m} size={38} />
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
          )}

          {Object.keys(preview).length > 0 && (
            <div className="card" style={{ marginBottom: 14, padding: 12 }}>
              <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(preview)
                  .filter(([, amount]) => amount !== 0)
                  .sort((a, b) => b[1] - a[1])
                  .map(([id, amount]) => {
                    const m = state.members.find((x) => x.id === id)
                    if (!m) return null
                    return (
                      <span key={id} className={`pill ${amount > 0 ? 'pill-good' : 'pill-danger'}`}>
                        {m.name} {formatBalance(amount)}
                      </span>
                    )
                  })}
              </div>
            </div>
          )}

          <div className="stack">
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={doers.length === 0 || finalBeneficiaries.length === 0}
              onClick={() => { validateTask(task.id, doers, finalBeneficiaries); onClose() }}
            >
              ✅ {t('validate')}
            </button>

            {me && task.status === 'todo' && (
              <button
                type="button"
                className="btn btn-block"
                onClick={() => { takeTask(task.id, mine ? null : me.id); onClose() }}
              >
                {mine ? t('release') : t('takeIt')}
              </button>
            )}

            {isChef && task.status === 'todo' && task.assignedTo && (
              <button type="button" className="btn btn-danger btn-block" onClick={() => { markMissed(task.id); onClose() }}>
                {t('markMissed')} (-{state.group.penalty})
              </button>
            )}

            {isChef && task.status === 'todo' && !task.assignedTo && (
              <p className="sheet-sub" style={{ marginBottom: 0 }}>{t('onlyAssignedMiss')}</p>
            )}

            {task.status === 'missed' && isChef && (
              <button type="button" className="btn btn-block" onClick={() => { reopenTask(task.id); onClose() }}>
                {t('cancelValidation')}
              </button>
            )}

            {isChef && (
              <button type="button" className="btn btn-block" onClick={() => { deleteTask(task.id); onClose() }}>
                🗑️
              </button>
            )}
          </div>
        </>
      )}
    </Sheet>
  )
}
