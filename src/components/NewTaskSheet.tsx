import { useState } from 'react'
import { groupDays, useGroup } from '../state'
import { CATALOG, EMOJI_CHOICES } from '../lib/catalog'
import { CLOSING_CATALOG } from '../lib/closing'
import { Avatar, Segmented, Sheet, Toggle } from './ui'
import { formatDay } from '../lib/i18n'

export function NewTaskSheet({ closing = false, onClose }: { closing?: boolean; onClose: () => void }) {
  const { state, me, isChef, lang, t, addTask, validateTask, activeDate } = useGroup()
  const [tab, setTab] = useState<'catalog' | 'custom'>('catalog')
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('🎯')
  const [points, setPoints] = useState(15)
  const [date, setDate] = useState(closing ? (state.group.endDate ?? activeDate) : activeDate)
  const [time, setTime] = useState('19:00')
  const needsLicense = false
  const [isClosing, setIsClosing] = useState(closing)
  const [recurring, setRecurring] = useState(false)
  // On note presque toujours une tache une fois qu'elle est faite : on vient de
  // sortir les poubelles, on l'ajoute et c'est fini. Planifier pour plus tard
  // existe, mais c'est le cas rare — d'ou la position par defaut.
  const [alreadyDone, setAlreadyDone] = useState(!closing)
  const [doers, setDoers] = useState<string[]>(me ? [me.id] : [])
  const [scope, setScope] = useState<'all' | 'some'>('all')
  const [beneficiaries, setBeneficiaries] = useState<string[]>(me ? [me.id] : [])
  const days = groupDays(state.group)
  const catalog = closing ? CLOSING_CATALOG : CATALOG

  const finalBeneficiaries = scope === 'all' ? state.members.map((m) => m.id) : beneficiaries

  function toggleIn(list: string[], set: (v: string[]) => void, id: string) {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  function create(fields: { title: string; titleKey?: string; emoji: string; points: number; needsLicense: boolean }) {
    const common = {
      ...fields,
      time,
      beneficiaryIds: scope === 'all' ? null : beneficiaries,
      createdBy: me?.id ?? '',
      recurring,
      isClosing,
    }
    // Une tache recurrente est posee sur chaque jour restant : le planning
    // montre alors vraiment ce qui est prevu, plutot qu'une simple etiquette.
    const targets = recurring && !isClosing ? days.filter((d) => d >= date) : [date]
    const created = targets.map((day) => addTask({ ...common, date: day, assignedTo: null }))

    // Seule la tache du jour choisi est validee : les jours suivants d'une
    // tache recurrente n'ont pas encore eu lieu.
    if (alreadyDone && doers.length > 0 && created[0]) {
      validateTask(created[0], doers, finalBeneficiaries)
    }
    onClose()
  }

  return (
    <Sheet title={closing ? t('addClosingTask') : t('newTask')} onClose={onClose}>
      <div style={{ marginBottom: 16 }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'catalog', label: t('fromCatalog') },
            { value: 'custom', label: t('custom') },
          ]}
        />
      </div>

      <div className="field-row" style={{ marginBottom: 14 }}>
        <label className="field" style={{ flex: 1, marginBottom: 0 }}>
          <span className="field-label">{t('taskDate')}</span>
          <select className="input" value={date} onChange={(e) => setDate(e.target.value)}>
            {days.map((d) => (
              <option key={d} value={d}>
                {formatDay(d, lang)}
              </option>
            ))}
          </select>
        </label>
        <label className="field" style={{ marginBottom: 0 }}>
          <span className="field-label">{t('taskTime')}</span>
          <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>

      {alreadyDone && (
        <>
          <div className="field-label">{t('whoDid')}</div>
          <div className="people-grid" style={{ marginBottom: 16 }}>
            {state.members.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`person-chip ${doers.includes(m.id) ? 'is-on' : ''}`}
                onClick={() => toggleIn(doers, setDoers, m.id)}
              >
                <Avatar member={m} size={38} />
                <span>{m.name}</span>
              </button>
            ))}
          </div>
        </>
      )}

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
        <div className="people-grid" style={{ marginBottom: 16 }}>
          {state.members.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`person-chip ${beneficiaries.includes(m.id) ? 'is-on' : ''}`}
              onClick={() =>
                setBeneficiaries((prev) => (prev.includes(m.id) ? prev.filter((x) => x !== m.id) : [...prev, m.id]))
              }
            >
              <Avatar member={m} size={38} />
              <span>{m.name}</span>
            </button>
          ))}
        </div>
      )}

      {!closing && (
        <div style={{ marginBottom: 16 }}>
          <Toggle
            checked={recurring}
            onChange={(on) => {
              setRecurring(on)
              if (on) setAlreadyDone(false)
            }}
            label={t('recurringTask')}
          />
          <p className="hint" style={{ textAlign: 'left' }}>
            {t('recurringTaskHelp')}
          </p>
        </div>
      )}

      {me && !closing && (
        <div style={{ marginBottom: 16 }}>
          <Toggle
            checked={alreadyDone}
            onChange={(on) => {
              setAlreadyDone(on)
              if (on) setRecurring(false)
            }}
            label={t('alreadyDone')}
          />
          <p className="hint" style={{ textAlign: 'left' }}>
            {t('alreadyDoneHelp')}
          </p>
        </div>
      )}

      {isChef && !closing && (
        <div style={{ marginBottom: 16 }}>
          <Toggle checked={isClosing} onChange={setIsClosing} label={t('isClosingTask')} />
        </div>
      )}

      {tab === 'catalog' ? (
        <div className="stack">
          {catalog.map((c) => (
            <button
              key={c.key}
              type="button"
              className="task"
              // Une tache faite par personne n'a pas de sens : on empeche le
              // geste plutot que de creer une tache a moitie validee.
              disabled={alreadyDone && doers.length === 0}
              onClick={() =>
                create({
                  title: c.fr,
                  titleKey: c.key,
                  emoji: c.emoji,
                  points: c.points,
                  needsLicense: c.needsLicense,
                })
              }
            >
              <span className="task-emoji">{c.emoji}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="task-title">{lang === 'en' ? c.en : c.fr}</span>
              </span>
              <span className="task-points">+{c.points}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <label className="field">
            <span className="field-label">{t('taskName')}</span>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="…" />
          </label>

          <div className="field">
            <span className="field-label">{t('taskIcon')}</span>
            <div className="emoji-grid">
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={`emoji-btn ${emoji === e ? 'is-on' : ''}`}
                  onClick={() => setEmoji(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span className="field-label">
              {t('taskPoints')} : {points}
            </span>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={points}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
              onChange={(e) => setPoints(Number(e.target.value))}
            />
          </label>

          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={
              !title.trim() ||
              (scope === 'some' && beneficiaries.length === 0) ||
              (alreadyDone && doers.length === 0)
            }
            onClick={() => create({ title: title.trim(), emoji, points, needsLicense })}
          >
            {t('create')}
          </button>
        </>
      )}
    </Sheet>
  )
}
