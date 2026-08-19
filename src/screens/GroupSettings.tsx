import { ArrowLeft } from 'lucide-react'
import { useGroup } from '../state'
import { formatBalance } from '../lib/ledger'
import { Avatar } from '../components/ui'
import { taskTitle } from '../components/TaskRow'

/**
 * Les reglages du groupe, ouverts depuis les trois points.
 * Ce qui concerne la personne est ailleurs : le profil se modifie depuis
 * la liste des groupes, pas depuis l'interieur d'un groupe.
 */
export function GroupSettings({ onClose }: { onClose: () => void }) {
  const { state, me, isChef, isHost, lang, t, updateGroup, setRole, toggleRecurring } = useGroup()
  if (!me) return null

  const recurring = state.tasks.filter((task) => task.recurring)
  const roleLabel = (role: string) => (role === 'host' ? t('host') : role === 'chef' ? t('chef') : t('member'))

  return (
    <>
      <div className="topbar">
        <button type="button" className="icon-button" onClick={onClose} aria-label={t('back')}>
          <ArrowLeft size={20} />
        </button>
        <div className="topbar-title">
          <span className="topbar-name">{t('editGroup')}</span>
        </div>
        <span className="icon-button is-ghost" />
      </div>

      {isChef ? (
        <>
          <div className="card">
            <label className="field">
              <span className="field-label">{t('groupName')}</span>
              <input className="input" value={state.group.name} onChange={(e) => updateGroup({ name: e.target.value })} />
            </label>

            <div className="row" style={{ gap: 10 }}>
              <label className="field" style={{ flex: 1 }}>
                <span className="field-label">{t('from')}</span>
                <input
                  className="input"
                  type="date"
                  value={state.group.startDate}
                  onChange={(e) => updateGroup({ startDate: e.target.value })}
                />
              </label>
              <label className="field" style={{ flex: 1 }}>
                <span className="field-label">{t('to')}</span>
                <input
                  className="input"
                  type="date"
                  value={state.group.endDate}
                  onChange={(e) => updateGroup({ endDate: e.target.value })}
                />
              </label>
            </div>

            <label className="field" style={{ marginBottom: 0 }}>
              <span className="field-label">
                {t('penaltyLabel')} : -{state.group.penalty}
              </span>
              <input
                type="range"
                min={0}
                max={50}
                step={5}
                value={state.group.penalty}
                style={{ width: '100%', accentColor: 'var(--danger)' }}
                onChange={(e) => updateGroup({ penalty: Number(e.target.value) })}
              />
            </label>
          </div>

          <div className="section-title">{t('manageChefs')}</div>
          <div className="stack">
            {state.members.map((m) => (
              <div key={m.id} className="rank-row">
                <Avatar member={m} size={34} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="rank-name">{m.name}</span>
                  <span className="rank-sub">{roleLabel(m.role)}</span>
                </span>
                {isHost && m.role !== 'host' && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setRole(m.id, m.role === 'chef' ? 'member' : 'chef')}
                  >
                    {m.role === 'chef' ? t('removeChef') : t('makeChef')}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="section-title">{t('recurringTasks')}</div>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '-6px 0 12px', lineHeight: 1.45 }}>
            {t('recurringHelp')}
          </p>
          <div className="stack">
            {recurring.length === 0 && <div className="empty">{t('noHistory')}</div>}
            {recurring.map((task) => (
              <div key={task.id} className="rank-row">
                <span className="task-emoji">{task.emoji}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="rank-name">{taskTitle(task, lang)}</span>
                  <span className="rank-sub">
                    {task.time} · +{task.points}
                  </span>
                </span>
                <button type="button" className="btn btn-sm" onClick={() => toggleRecurring(task.id)}>
                  {t('cancel')}
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="empty">{t('onlyChef')}</div>
      )}

      <div className="section-title">{t('history')}</div>
      <div className="stack">
        {state.entries.length === 0 && <div className="empty">{t('noHistory')}</div>}
        {[...state.entries]
          .sort((a, b) => b.at.localeCompare(a.at))
          .slice(0, 15)
          .map((entry) => {
            const task = state.tasks.find((x) => x.id === entry.taskId)
            const amount = entry.amounts[me.id] ?? 0
            const who =
              entry.kind === 'penalty'
                ? state.members.find((m) => (entry.amounts[m.id] ?? 0) < 0)?.name
                : entry.doerIds
                    .map((id) => state.members.find((m) => m.id === id)?.name)
                    .filter(Boolean)
                    .join(', ')
            return (
              <div key={entry.id} className="rank-row">
                <span className="task-emoji">{entry.kind === 'penalty' ? '⚠️' : (task?.emoji ?? '✅')}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="rank-name" style={{ fontSize: 14 }}>
                    {who}
                  </span>
                  <span className="rank-sub">{task ? taskTitle(task, lang) : ''}</span>
                </span>
                {amount !== 0 && (
                  <span className={`pill ${amount > 0 ? 'pill-good' : 'pill-danger'}`}>{formatBalance(amount)}</span>
                )}
              </div>
            )
          })}
      </div>
    </>
  )
}
