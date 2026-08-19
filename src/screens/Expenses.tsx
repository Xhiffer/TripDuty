import { useMemo, useState } from 'react'
import { Plus, Receipt } from 'lucide-react'
import { useGroup } from '../state'
import type { Expense } from '../types'
import { expenseAmounts, formatEuros, formatSignedEuros, moneyBalances, reimbursements } from '../lib/money'
import { Avatar, Segmented, Sheet } from '../components/ui'
import { NewExpenseSheet } from '../components/NewExpenseSheet'
import { formatDay } from '../lib/i18n'

export function Expenses() {
  const { state, me, lang, t } = useGroup()
  const [tab, setTab] = useState<'list' | 'balances'>('list')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [detail, setDetail] = useState<Expense | null>(null)

  const expenses = useMemo(
    () => [...state.expenses].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [state.expenses],
  )
  const balances = useMemo(() => moneyBalances(state.members, state.expenses), [state.members, state.expenses])
  const transfers = useMemo(() => reimbursements(balances), [balances])

  const total = state.expenses.reduce((sum, e) => sum + e.amountCents, 0)
  const mine = balances.find((b) => b.member.id === me?.id)

  // Les depenses regroupees par jour, comme un relevé.
  const byDay = useMemo(() => {
    const map = new Map<string, Expense[]>()
    for (const expense of expenses) {
      const list = map.get(expense.date) ?? []
      list.push(expense)
      map.set(expense.date, list)
    }
    return [...map.entries()]
  }, [expenses])

  const person = (id: string) => state.members.find((m) => m.id === id) ?? null

  return (
    <>
      <div style={{ marginTop: 18 }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'list' as const, label: t('expenses') },
            { value: 'balances' as const, label: t('moneyBalances') },
          ]}
        />
      </div>

      <div className="totals">
        <div>
          <span className="totals-label">{t('myExpenses')}</span>
          <span className="totals-value">{formatEuros(mine?.paidCents ?? 0)}</span>
        </div>
        <div>
          <span className="totals-label">{t('totalExpenses')}</span>
          <span className="totals-value">{formatEuros(total)}</span>
        </div>
      </div>

      {tab === 'list' ? (
        <>
          <button type="button" className="btn btn-primary btn-block" onClick={() => setCreating(true)}>
            <Plus size={18} />
            {t('addExpense')}
          </button>

          {expenses.length === 0 && <div className="empty">{t('noExpense')}</div>}

          {byDay.map(([day, items]) => (
            <div key={day}>
              <div className="day-head">{formatDay(day, lang)}</div>
              <div className="stack">
                {items.map((expense) => {
                  const payer = person(expense.payerId)
                  return (
                    <button key={expense.id} type="button" className="task" onClick={() => setDetail(expense)}>
                      <span className="task-emoji">{expense.emoji}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span className="task-title">{expense.title}</span>
                        <span className="task-sub">
                          {t('paidByShort')} <b>{payer?.name ?? '?'}</b>
                          {expense.participantIds.length < state.members.length && (
                            <span className="pill">
                              {expense.participantIds.length} {t('people')}
                            </span>
                          )}
                          {expense.receipt && <Receipt size={13} />}
                        </span>
                      </span>
                      <span className="expense-amount">{formatEuros(expense.amountCents)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          <p className="hint" style={{ textAlign: 'left' }}>
            {t('moneyBalanceHelp')}
          </p>

          <div className="stack">
            {balances.map((row) => (
              <div
                key={row.member.id}
                className={`rank-row ${row.member.id === me?.id ? 'is-me' : ''} ${row.cents < 0 ? 'is-last' : ''}`}
              >
                <Avatar member={row.member} size={38} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="rank-name">{row.member.name}</span>
                  <span className="rank-sub">
                    {t('hasPaid')} {formatEuros(row.paidCents)}
                  </span>
                </span>
                <span
                  className="rank-score"
                  style={{ color: row.cents < 0 ? 'var(--danger)' : row.cents > 0 ? 'var(--good)' : 'var(--muted)' }}
                >
                  {formatSignedEuros(row.cents)}
                </span>
              </div>
            ))}
          </div>

          <div className="section-title">{t('whoRefundsWho')}</div>
          <div className="stack">
            {transfers.length === 0 && <div className="empty">{t('allSettledMoney')}</div>}
            {transfers.map((transfer, i) => {
              const from = person(transfer.fromId)
              const to = person(transfer.toId)
              if (!from || !to) return null
              return (
                <div key={i} className="rank-row">
                  <Avatar member={from} size={32} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, lineHeight: 1.35 }}>
                    <b>{from.name}</b> <span style={{ color: 'var(--muted)' }}>{t('refunds')}</span> <b>{to.name}</b>
                  </span>
                  <Avatar member={to} size={32} />
                  <span className="pill pill-accent">{formatEuros(transfer.cents)}</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {creating && <NewExpenseSheet onClose={() => setCreating(false)} />}
      {editing && <NewExpenseSheet expense={editing} onClose={() => setEditing(null)} />}

      {detail && (
        <Sheet
          title={`${detail.emoji}  ${detail.title}`}
          subtitle={`${formatDay(detail.date, lang)} · ${formatEuros(detail.amountCents)}`}
          onClose={() => setDetail(null)}
        >
          <div className="field-label">{t('paidBy')}</div>
          <div className="rank-row" style={{ marginBottom: 18 }}>
            <Avatar member={person(detail.payerId)} size={34} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="rank-name">{person(detail.payerId)?.name}</span>
            </span>
            <span className="expense-amount">{formatEuros(detail.amountCents)}</span>
          </div>

          <div className="field-label">
            {t('splitBetween')} · {detail.participantIds.length} {t('people')}
          </div>
          <div className="stack">
            {Object.entries(expenseAmounts(detail))
              .filter(([id]) => detail.participantIds.includes(id))
              .map(([id]) => {
                const member = person(id)
                const share = Math.round(detail.amountCents / detail.participantIds.length)
                return (
                  <div key={id} className="rank-row">
                    <Avatar member={member} size={30} />
                    <span style={{ flex: 1, minWidth: 0, fontWeight: 700, fontSize: 14 }}>{member?.name}</span>
                    <span className="split-share">{formatEuros(share)}</span>
                  </div>
                )
              })}
          </div>

          {detail.receipt && (
            <div className="receipt-preview" style={{ marginTop: 18 }}>
              <img src={detail.receipt} alt={t('receipt')} />
            </div>
          )}

          <button
            type="button"
            className="btn btn-block"
            style={{ marginTop: 18 }}
            onClick={() => {
              setEditing(detail)
              setDetail(null)
            }}
          >
            {t('editExpense')}
          </button>
        </Sheet>
      )}
    </>
  )
}
