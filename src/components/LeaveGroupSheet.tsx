import { useState } from 'react'
import { useGroup } from '../state'
import { Avatar, Sheet } from './ui'

/**
 * Depart d'un groupe. Le cas interessant est celui de l'hote : un groupe a
 * toujours un hote, donc il doit designer sa suite avant de partir. Choisir a
 * sa place serait plus court mais deciderait pour lui de qui prend la main.
 */
export function LeaveGroupSheet({ onClose }: { onClose: () => void }) {
  const { state, me, isHost, t, leaveGroup } = useGroup()
  const [heir, setHeir] = useState<string | null>(null)
  const [error, setError] = useState('')
  if (!me) return null

  const others = state.members.filter((m) => m.id !== me.id)
  // L'hote seul emporte le groupe avec lui ; a deux, la suite est evidente ;
  // au-dela, c'est a lui de trancher.
  const mustChoose = isHost && others.length > 1
  const soleHeir = isHost && others.length === 1 ? others[0] : null
  const deletesGroup = isHost && others.length === 0

  const subtitle = mustChoose
    ? t('chooseNewHostHelp')
    : deletesGroup
      ? t('leaveDeletesGroup')
      : soleHeir
        ? t('leaveSoleHeir')
        : t('leaveAsMember')

  async function confirm() {
    setError('')
    const result = await leaveGroup(state.group.id, heir ?? undefined)
    if (!result.ok) {
      const messages: Record<string, string> = {
        chooseNewHost: t('errChooseNewHost'),
        newHostNotMember: t('errNewHostNotMember'),
        notMember: t('errNotMember'),
      }
      return setError(messages[result.error] ?? t('errServer'))
    }
    onClose()
  }

  return (
    <Sheet title={t('leaveGroup')} subtitle={subtitle} onClose={onClose}>
      {mustChoose && (
        <>
          <div className="field-label">{t('chooseNewHost')}</div>
          <div className="people-grid" style={{ marginBottom: 16 }}>
            {others.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`person-chip ${heir === m.id ? 'is-on' : ''}`}
                onClick={() => {
                  setHeir(m.id)
                  setError('')
                }}
              >
                <Avatar member={m} size={38} />
                <span>{m.name}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {soleHeir && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="row">
            <Avatar member={soleHeir} size={34} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="rank-name">{soleHeir.name}</span>
              <span className="rank-sub">{t('becomesHost')}</span>
            </span>
          </div>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}

      <div className="stack">
        <button type="button" className="btn btn-danger btn-block" disabled={mustChoose && !heir} onClick={confirm}>
          {deletesGroup ? t('confirmDeleteGroup') : t('confirmLeave')}
        </button>
        <button type="button" className="btn btn-block" onClick={onClose}>
          {t('cancel')}
        </button>
      </div>
    </Sheet>
  )
}
