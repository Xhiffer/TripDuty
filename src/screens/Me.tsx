import { useApp } from '../state'
import { formatBalance } from '../lib/ledger'
import { Avatar, Segmented } from '../components/ui'
import { taskTitle } from '../components/TaskRow'

export function Me() {
  const { state, me, isChef, lang, theme, t, setLang, setTheme, setMe, updateTrip, setRole, toggleRecurring } = useApp()
  if (!me) return null

  const recurring = state.tasks.filter((task) => task.recurring)
  const canManageRoles = me.role === 'owner'

  return (
    <>
      <div className="section-title" style={{ marginTop: 18 }}>
        {t('meTitle')}
      </div>

      <div className="card">
        <div className="row">
          <Avatar member={me} size={56} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="rank-name" style={{ fontSize: 17 }}>
              {me.name}
            </span>
            <span className="rank-sub">
              {me.role === 'owner' ? t('owner') : me.role === 'chef' ? t('chef') : t('member')}
              {me.hasLicense ? ' · 🔑' : ''}
            </span>
          </span>
        </div>
      </div>

      <div className="section-title">{t('language')}</div>
      <Segmented
        value={lang}
        onChange={setLang}
        options={[
          { value: 'fr', label: 'Français' },
          { value: 'en', label: 'English' },
        ]}
      />

      <div className="section-title">{t('theme')}</div>
      <Segmented
        value={theme}
        onChange={setTheme}
        options={[
          { value: 'dark', label: `🌙 ${t('themeDark')}` },
          { value: 'light', label: `☀️ ${t('themeLight')}` },
        ]}
      />

      {isChef && (
        <>
          <div className="section-title">{t('chefSpace')}</div>
          <div className="card">
            <p className="sheet-sub" style={{ marginTop: 0 }}>
              {t('chefSpaceHelp')}
            </p>

            <label className="field">
              <span className="field-label">{t('tripName')}</span>
              <input className="input" value={state.trip.name} onChange={(e) => updateTrip({ name: e.target.value })} />
            </label>

            <div className="row" style={{ gap: 10 }}>
              <label className="field" style={{ flex: 1 }}>
                <span className="field-label">{t('from')}</span>
                <input
                  className="input"
                  type="date"
                  value={state.trip.startDate}
                  onChange={(e) => updateTrip({ startDate: e.target.value })}
                />
              </label>
              <label className="field" style={{ flex: 1 }}>
                <span className="field-label">{t('to')}</span>
                <input
                  className="input"
                  type="date"
                  value={state.trip.endDate}
                  onChange={(e) => updateTrip({ endDate: e.target.value })}
                />
              </label>
            </div>

            <label className="field" style={{ marginBottom: 0 }}>
              <span className="field-label">
                {t('penaltyLabel')} : -{state.trip.penalty}
              </span>
              <input
                type="range"
                min={0}
                max={50}
                step={5}
                value={state.trip.penalty}
                style={{ width: '100%', accentColor: 'var(--danger)' }}
                onChange={(e) => updateTrip({ penalty: Number(e.target.value) })}
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
                  <span className="rank-sub">
                    {m.role === 'owner' ? t('owner') : m.role === 'chef' ? t('chef') : t('member')}
                  </span>
                </span>
                {canManageRoles && m.role !== 'owner' && (
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

      <button type="button" className="btn btn-block" style={{ marginTop: 20 }} onClick={() => setMe(null)}>
        {t('logout')}
      </button>
    </>
  )
}
