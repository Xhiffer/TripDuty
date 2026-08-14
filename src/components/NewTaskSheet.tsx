import { useState } from 'react'
import { tripDays, useApp } from '../state'
import { CATALOG, EMOJI_CHOICES } from '../lib/catalog'
import { CLOSING_CATALOG } from '../lib/closing'
import { Avatar, Segmented, Sheet, Toggle } from './ui'
import { formatDay } from '../lib/i18n'

export function NewTaskSheet({ closing = false, onClose }: { closing?: boolean; onClose: () => void }) {
  const { state, me, isChef, lang, t, addTask, activeDate } = useApp()
  const [tab, setTab] = useState<'catalog' | 'custom'>('catalog')
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('🎯')
  const [points, setPoints] = useState(15)
  const [date, setDate] = useState(closing ? state.trip.endDate : activeDate)
  const [time, setTime] = useState('19:00')
  const [needsLicense, setNeedsLicense] = useState(false)
  const [isClosing, setIsClosing] = useState(closing)
  const [scope, setScope] = useState<'all' | 'some'>('all')
  const [beneficiaries, setBeneficiaries] = useState<string[]>(me ? [me.id] : [])
  const days = tripDays(state.trip)
  const catalog = closing ? CLOSING_CATALOG : CATALOG

  function create(fields: { title: string; titleKey?: string; emoji: string; points: number; needsLicense: boolean }) {
    addTask({
      ...fields,
      date,
      time,
      beneficiaryIds: scope === 'all' ? null : beneficiaries,
      assignedTo: null,
      createdBy: me?.id ?? '',
      recurring: false,
      isClosing,
    })
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

      <div className="row" style={{ gap: 10, marginBottom: 14 }}>
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
        <label className="field" style={{ width: 118, marginBottom: 0 }}>
          <span className="field-label">{t('taskTime')}</span>
          <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
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
                {c.needsLicense && (
                  <span className="task-sub">
                    <span className="pill">🔑 {t('licenseNeeded')}</span>
                  </span>
                )}
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

          <div style={{ marginBottom: 16 }}>
            <Toggle checked={needsLicense} onChange={setNeedsLicense} label={t('licenseNeeded')} />
          </div>

          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={!title.trim() || (scope === 'some' && beneficiaries.length === 0)}
            onClick={() => create({ title: title.trim(), emoji, points, needsLicense })}
          >
            {t('create')}
          </button>
        </>
      )}
    </Sheet>
  )
}
