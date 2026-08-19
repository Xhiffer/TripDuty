import { useRef, useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { groupDays, useGroup } from '../state'
import type { Expense } from '../types'
import { EXPENSE_CATEGORIES, formatEuros, splitCents } from '../lib/money'
import { Avatar, Sheet } from './ui'
import { formatDay } from '../lib/i18n'

/** Reduit la photo du ticket pour qu'elle reste legere. */
async function shrinkPhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const max = 900
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.7)
}

/** Transforme « 12,50 » ou « 12.5 » en centimes. */
function toCents(text: string): number {
  const clean = text.replace(',', '.').replace(/[^0-9.]/g, '')
  const value = Number.parseFloat(clean)
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.round(value * 100)
}

export function NewExpenseSheet({ expense, onClose }: { expense?: Expense; onClose: () => void }) {
  const { state, me, lang, t, activeDate, addExpense, updateExpense, deleteExpense } = useGroup()
  const editing = !!expense

  const [title, setTitle] = useState(expense?.title ?? '')
  const [emoji, setEmoji] = useState(expense?.emoji ?? '🧾')
  const [amount, setAmount] = useState(expense ? String(expense.amountCents / 100).replace('.', ',') : '')
  const [payerId, setPayerId] = useState(expense?.payerId ?? me?.id ?? '')
  const [date, setDate] = useState(expense?.date ?? activeDate)
  const [participants, setParticipants] = useState<string[]>(
    expense?.participantIds ?? state.members.map((m) => m.id),
  )
  const [receipt, setReceipt] = useState<string | null>(expense?.receipt ?? null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const cents = toCents(amount)
  const shares = participants.length > 0 ? splitCents(cents, participants.length) : []
  const days = groupDays(state.group)

  function toggle(id: string) {
    setParticipants((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function submit() {
    if (!title.trim()) return setError(t('errExpenseTitle'))
    if (cents <= 0) return setError(t('errExpenseAmount'))
    if (participants.length === 0) return setError(t('errExpenseParticipants'))

    if (editing && expense) {
      updateExpense(expense.id, {
        title: title.trim(),
        emoji,
        amountCents: cents,
        payerId,
        participantIds: participants,
        date,
        receipt,
      })
    } else {
      addExpense({ title: title.trim(), emoji, amountCents: cents, payerId, participantIds: participants, date, receipt })
    }
    onClose()
  }

  return (
    <Sheet title={editing ? t('editExpense') : t('newExpense')} onClose={onClose}>
      <label className="field">
        <span className="field-label">{t('expenseTitle')}</span>
        <input
          className="input"
          value={title}
          placeholder={t('expenseTitlePlaceholder')}
          onChange={(e) => {
            setTitle(e.target.value)
            setError('')
          }}
        />
      </label>

      <div className="field">
        <span className="field-label">{t('category')}</span>
        <div className="emoji-grid">
          {EXPENSE_CATEGORIES.map((c) => (
            <button
              key={c.emoji}
              type="button"
              className={`emoji-btn ${emoji === c.emoji ? 'is-on' : ''}`}
              title={lang === 'en' ? c.en : c.fr}
              onClick={() => {
                setEmoji(c.emoji)
                if (!title.trim()) setTitle(lang === 'en' ? c.en : c.fr)
              }}
            >
              {c.emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="row" style={{ gap: 10 }}>
        <label className="field" style={{ flex: 1 }}>
          <span className="field-label">{t('amount')}</span>
          <input
            className="input"
            inputMode="decimal"
            value={amount}
            placeholder="0,00"
            onChange={(e) => {
              setAmount(e.target.value)
              setError('')
            }}
          />
        </label>
        <label className="field" style={{ flex: 1 }}>
          <span className="field-label">{t('when')}</span>
          <select className="input" value={date} onChange={(e) => setDate(e.target.value)}>
            {days.map((d) => (
              <option key={d} value={d}>
                {formatDay(d, lang)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="field-label">{t('paidBy')}</div>
      <div className="people-grid" style={{ marginBottom: 18 }}>
        {state.members.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`person-chip ${payerId === m.id ? 'is-on' : ''}`}
            onClick={() => setPayerId(m.id)}
          >
            <Avatar member={m} size={38} />
            <span>{m.name}</span>
          </button>
        ))}
      </div>

      <div className="field-label">
        {t('splitBetween')} · {t('equally')}
      </div>
      <div className="stack" style={{ marginBottom: 14 }}>
        {state.members.map((m) => {
          const index = participants.indexOf(m.id)
          return (
            <button
              key={m.id}
              type="button"
              className={`split-row ${index >= 0 ? 'is-on' : ''}`}
              onClick={() => toggle(m.id)}
            >
              <span className="toggle-box">{index >= 0 ? '✓' : ''}</span>
              <Avatar member={m} size={30} />
              <span style={{ flex: 1, minWidth: 0, fontWeight: 700, fontSize: 14 }}>{m.name}</span>
              <span className="split-share">{index >= 0 ? formatEuros(shares[index] ?? 0) : '—'}</span>
            </button>
          )
        })}
      </div>

      <div className="field">
        <span className="field-label">{t('receipt')}</span>
        {receipt ? (
          <div className="receipt-preview">
            <img src={receipt} alt="" />
            <button type="button" className="btn btn-sm" onClick={() => setReceipt(null)}>
              <Trash2 size={15} />
              {t('removePhoto')}
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-block" onClick={() => fileRef.current?.click()}>
            <Camera size={17} />
            {t('addReceipt')}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (file) setReceipt(await shrinkPhoto(file))
          }}
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="stack">
        <button type="button" className="btn btn-primary btn-block" onClick={submit}>
          {editing ? t('save') : t('addExpense')}
        </button>
        {editing && expense && (
          <button
            type="button"
            className="btn btn-danger btn-block"
            onClick={() => {
              deleteExpense(expense.id)
              onClose()
            }}
          >
            <Trash2 size={17} />
            {t('deleteExpense')}
          </button>
        )}
      </div>
    </Sheet>
  )
}
