import { useMemo, useState } from 'react'
import { useGroup, useBalances } from '../state'
import type { Task } from '../types'
import { formatBalance } from '../lib/ledger'
import { matchClosing } from '../lib/closing'
import { Avatar } from '../components/ui'
import { TaskRow, taskTitle } from '../components/TaskRow'
import { TaskSheet } from '../components/TaskSheet'
import { NewTask } from './NewTask'

export function Closing() {
  const { state, me, isChef, lang, t, updateGroup, deleteTask } = useGroup()
  const rows = useBalances()
  const [openTask, setOpenTask] = useState<Task | null>(null)
  const [creating, setCreating] = useState(false)

  const matches = useMemo(() => matchClosing(state, rows), [state, rows])
  const closingTasks = state.tasks.filter((task) => task.isClosing)
  const mine = rows.find((r) => r.member.id === me?.id)
  // Ceux qui ont fait plus que la moyenne : ce sont eux qui ont porte le groupe.
  const moyenne = rows.length > 0 ? rows.reduce((sum, r) => sum + r.centi, 0) / rows.length : 0
  const creditors = rows.filter((r) => r.centi > moyenne)

  if (creating) return <NewTask closing onClose={() => setCreating(false)} />

  return (
    <>
      <div className="section-title" style={{ marginTop: 18 }}>
        {t('closingTitle')}
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 13, margin: '-6px 0 14px', lineHeight: 1.45 }}>{t('closingIntro')}</p>

      {!state.group.closingOpen ? (
        <>
          <div className="section-title">{t('closingTasks')}</div>
          <p style={{ color: 'var(--muted)', fontSize: 12, margin: '-6px 0 12px', lineHeight: 1.45 }}>
            {t('closingHelp')}
          </p>
          <div className="stack">
            {closingTasks.map((task) => (
              <div key={task.id} className="rank-row">
                <span className="task-emoji">{task.emoji}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="rank-name" style={{ fontSize: 14 }}>
                    {taskTitle(task, lang)}
                  </span>
                  <span className="rank-sub">
                    +{task.points} {t('points')}
                  </span>
                </span>
                {isChef && (
                  <button type="button" className="btn btn-sm" onClick={() => deleteTask(task.id)}>
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>

          {isChef && (
            <div className="stack" style={{ marginTop: 14 }}>
              <button type="button" className="btn btn-block" onClick={() => setCreating(true)}>
                ＋ {t('addClosingTask')}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => updateGroup({ closingOpen: true })}
              >
                🏁 {t('openClosing')}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="stack">
            {matches.map(({ task, memberId, centi }) => {
              const member = state.members.find((m) => m.id === memberId) ?? null
              return (
                <div key={task.id} className="card" style={{ padding: 12 }}>
                  {member && (
                    <div className="row" style={{ marginBottom: 10 }}>
                      <Avatar member={member} size={34} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span className="rank-name" style={{ fontSize: 14 }}>
                          {member.name}
                        </span>
                        <span className="rank-sub" style={{ color: 'var(--danger)' }}>
                          {formatBalance(centi)}
                        </span>
                      </span>
                    </div>
                  )}
                  <TaskRow
                    task={task}
                    state={state}
                    lang={lang}
                    t={t}
                    onClick={() => setOpenTask(task)}
                  />
                </div>
              )
            })}
          </div>

          {creditors.length > 0 && (
            <>
              <div className="section-title">{t('carried')}</div>
              <div className="stack">
                {creditors.map((row) => (
                  <div key={row.member.id} className="rank-row">
                    <Avatar member={row.member} size={34} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="rank-name">{row.member.name}</span>
                    </span>
                    <span className="pill pill-good">{formatBalance(row.centi)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {mine && mine.centi >= moyenne && <div className="banner" style={{ marginTop: 14 }}>{t('nothingOwed')}</div>}

          {isChef && (
            <button
              type="button"
              className="btn btn-block"
              style={{ marginTop: 18 }}
              onClick={() => updateGroup({ closingOpen: false })}
            >
              {t('closeClosing')}
            </button>
          )}
        </>
      )}

      {openTask && <TaskSheet task={openTask} onClose={() => setOpenTask(null)} />}
    </>
  )
}
