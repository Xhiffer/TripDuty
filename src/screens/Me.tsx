import { useState } from 'react'
import { useGroup } from '../state'
import { formatBalance } from '../lib/ledger'
import { inviteLink, isEmail } from '../lib/identity'
import { Avatar, Segmented } from '../components/ui'
import { taskTitle } from '../components/TaskRow'

export function Me() {
  const {
    state,
    account,
    me,
    isChef,
    isHost,
    lang,
    theme,
    t,
    setLang,
    setTheme,
    signOut,
    selectGroup,
    updateGroup,
    setRole,
    setLicense,
    inviteByEmail,
    leaveGroup,
    toggleRecurring,
  } = useGroup()
  const [invite, setInvite] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  if (!me || !account) return null

  const recurring = state.tasks.filter((task) => task.recurring)
  const link = inviteLink(state.group.inviteCode)

  function submitInvite() {
    setError('')
    if (!isEmail(invite)) return setError(t('errBadEmail'))
    const result = inviteByEmail(invite)
    if (!result.ok) {
      const messages: Record<string, string> = {
        noAccountForEmail: t('errNoAccountForEmail'),
        alreadyMember: t('errAlreadyMember'),
      }
      return setError(messages[result.error] ?? t('errServer'))
    }
    setInvite('')
  }

  const roleLabel = (role: string) => (role === 'host' ? t('host') : role === 'chef' ? t('chef') : t('member'))

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
              {account.firstName} {account.lastName}
            </span>
            <span className="rank-sub">
              {roleLabel(me.role)}
              {me.hasLicense ? ' · 🔑' : ''}
            </span>
            <span className="rank-sub">{account.email}</span>
          </span>
        </div>
        <div style={{ marginTop: 14 }}>
          <Segmented
            value={me.hasLicense ? 'yes' : 'no'}
            onChange={(v) => setLicense(me.id, v === 'yes')}
            options={[
              { value: 'yes', label: `🔑 ${t('licenseYes')}` },
              { value: 'no', label: t('licenseNo') },
            ]}
          />
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

      <div className="section-title">{t('invitePeople')}</div>
      <div className="card">
        <div className="field-label">{t('inviteByLink')}</div>
        <div className="invite-code">{state.group.inviteCode}</div>
        <button
          type="button"
          className="btn btn-block"
          style={{ marginTop: 10 }}
          onClick={async () => {
            try {
              if (navigator.share) await navigator.share({ title: 'Trip Duty', url: link })
              else await navigator.clipboard.writeText(link)
              setCopied(true)
            } catch {
              setCopied(false)
            }
          }}
        >
          🔗 {copied ? t('linkCopied') : t('shareLink')}
        </button>

        <div className="field-label" style={{ marginTop: 20 }}>
          {t('inviteByEmail')}
        </div>
        <p className="hint" style={{ marginTop: 0 }}>
          {t('inviteByEmailHelp')}
        </p>
        <div className="row" style={{ gap: 8 }}>
          <input
            className="input"
            type="email"
            inputMode="email"
            value={invite}
            placeholder="prenom@exemple.fr"
            onChange={(e) => {
              setInvite(e.target.value)
              setError('')
            }}
          />
          <button type="button" className="btn" onClick={submitInvite}>
            {t('add')}
          </button>
        </div>
        {error && <p className="form-error">{error}</p>}
      </div>

      {isChef && (
        <>
          <div className="section-title">{t('chefSpace')}</div>
          <div className="card">
            <p className="sheet-sub" style={{ marginTop: 0 }}>
              {t('chefSpaceHelp')}
            </p>

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

      <div className="stack" style={{ marginTop: 24 }}>
        <button type="button" className="btn btn-block" onClick={() => selectGroup(null)}>
          {t('switchGroup')}
        </button>
        {!isHost && (
          <button type="button" className="btn btn-danger btn-block" onClick={() => leaveGroup(state.group.id)}>
            {t('leaveGroup')}
          </button>
        )}
        <button type="button" className="btn btn-block" onClick={signOut}>
          {t('signOut')}
        </button>
      </div>
    </>
  )
}
