import { useState } from 'react'
import { groupDays, useGroup } from '../state'
import { shareOfGroup } from '../lib/ledger'
import { CATALOG, EMOJI_CHOICES } from '../lib/catalog'
import { CLOSING_CATALOG } from '../lib/closing'
import { PageHeader, Toggle } from '../components/ui'
import { formatDay } from '../lib/i18n'

/**
 * Ajouter une tache occupe une page entiere.
 *
 * Un volet qui monte du bas suppose une application ; dans un navigateur il se
 * retrouve coince sous la barre d'adresse. Une page, elle, se ferme par la
 * meme fleche retour que le groupe, au meme endroit.
 */
export function NewTask({ closing = false, onClose }: { closing?: boolean; onClose: () => void }) {
  const { state, me, isChef, lang, t, addTask, validateTask, activeDate } = useGroup()
  const catalog = closing ? CLOSING_CATALOG : CATALOG

  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState(closing ? '🧳' : '🍽️')
  const [pickingEmoji, setPickingEmoji] = useState(false)
  // La cle de la tache toute faite choisie, vide quand la tache est inventee.
  const [catalogKey, setCatalogKey] = useState('')
  const [points, setPoints] = useState(15)
  const [date, setDate] = useState(closing ? (state.group.endDate ?? activeDate) : activeDate)
  const [time, setTime] = useState('19:00')
  const [isClosing, setIsClosing] = useState(closing)
  const [recurring, setRecurring] = useState(false)
  // On note presque toujours une tache une fois qu'elle est faite : on vient de
  // sortir les poubelles, on l'ajoute et c'est fini.
  const [alreadyDone, setAlreadyDone] = useState(!closing)
  const [doers, setDoers] = useState<string[]>(me ? [me.id] : [])
  // Une tache profite a tout le monde jusqu'a preuve du contraire : on decoche
  // ceux qu'elle ne concerne pas plutot que de cocher les huit autres.
  const [beneficiaries, setBeneficiaries] = useState<string[]>(state.members.map((m) => m.id))
  const [error, setError] = useState('')

  const days = groupDays(state.group)
  const chosen = catalog.find((c) => c.key === catalogKey)
  const finalPoints = chosen ? chosen.points : points

  // Ce que la tache rapportera vraiment, une fois le nombre de servis et le
  // nombre de personnes qui la font pris en compte.
  const groupSize = state.members.length
  const earned =
    beneficiaries.length > 0
      ? (finalPoints * shareOfGroup(beneficiaries.length, groupSize)) / Math.max(1, doers.length)
      : 0

  function toggleIn(list: string[], set: (v: string[]) => void, id: string) {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  function submit() {
    const name = chosen ? (lang === 'en' ? chosen.en : chosen.fr) : title.trim()
    if (!name) return setError(t('errTaskName'))
    if (beneficiaries.length === 0) return setError(t('errNoBeneficiary'))
    if (alreadyDone && doers.length === 0) return setError(t('errNoDoer'))

    const common = {
      title: name,
      titleKey: chosen?.key,
      emoji: chosen ? chosen.emoji : emoji,
      points: finalPoints,
      needsLicense: chosen?.needsLicense ?? false,
      time,
      beneficiaryIds: beneficiaries.length === groupSize ? null : beneficiaries,
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
      validateTask(created[0], doers, beneficiaries)
    }
    onClose()
  }

  return (
    <>
      <PageHeader title={closing ? t('addClosingTask') : t('newTask')} onBack={onClose} backLabel={t('back')} />

      <div className="field">
        <span className="field-label">{t('taskName')}</span>
        <div className="row" style={{ gap: 10 }}>
          <button
            type="button"
            className="emoji-field"
            aria-label={t('taskIcon')}
            onClick={() => setPickingEmoji((open) => !open)}
          >
            {chosen ? chosen.emoji : emoji}
          </button>
          <input
            className="input"
            value={chosen ? (lang === 'en' ? chosen.en : chosen.fr) : title}
            placeholder="…"
            disabled={!!chosen}
            onChange={(e) => {
              setTitle(e.target.value)
              setError('')
            }}
          />
        </div>
      </div>

      {pickingEmoji && !chosen && (
        <div className="emoji-grid" style={{ marginBottom: 14 }}>
          {EMOJI_CHOICES.map((e) => (
            <button
              key={e}
              type="button"
              className={`emoji-btn ${emoji === e ? 'is-on' : ''}`}
              onClick={() => {
                setEmoji(e)
                setPickingEmoji(false)
              }}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      <div className="field-row">
        <label className="field">
          <span className="field-label">{t('taskDate')}</span>
          <select className="input" value={date} onChange={(e) => setDate(e.target.value)}>
            {days.map((d) => (
              <option key={d} value={d}>
                {formatDay(d, lang)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">{t('taskTime')}</span>
          <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>

      {/* La liste toute faite evite d'ecrire « vaisselle » chaque soir, et fixe
          le bareme : une tache choisie ici vaut ce qu'elle vaut pour tous. */}
      <label className="field">
        <select
          className="input"
          value={catalogKey}
          onChange={(e) => {
            setCatalogKey(e.target.value)
            setError('')
          }}
        >
          <option value="">{t('chooseFromList')}</option>
          {catalog.map((c) => (
            <option key={c.key} value={c.key}>
              {c.emoji} {lang === 'en' ? c.en : c.fr} · {c.points}
            </option>
          ))}
        </select>
      </label>

      {alreadyDone && (
        <>
          <div className="field-label">{t('whoDid')}</div>
          <div className="chip-row">
            {state.members.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`chip ${doers.includes(m.id) ? 'is-on' : ''}`}
                onClick={() => {
                  toggleIn(doers, setDoers, m.id)
                  setError('')
                }}
              >
                {m.name}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="field-label">{t('forWhom')}</div>
      <div className="chip-row">
        {state.members.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`chip ${beneficiaries.includes(m.id) ? 'is-on' : ''}`}
            onClick={() => {
              toggleIn(beneficiaries, setBeneficiaries, m.id)
              setError('')
            }}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div className="stack" style={{ marginBottom: 16 }}>
        {!closing && (
          <Toggle
            checked={alreadyDone}
            onChange={(on) => {
              setAlreadyDone(on)
              if (on) setRecurring(false)
            }}
            label={t('alreadyDone')}
          />
        )}
        {!closing && (
          <Toggle
            checked={recurring}
            onChange={(on) => {
              setRecurring(on)
              if (on) setAlreadyDone(false)
            }}
            label={t('recurringTask')}
          />
        )}
        {isChef && !closing && <Toggle checked={isClosing} onChange={setIsClosing} label={t('isClosingTask')} />}
      </div>

      {/* Le curseur n'a de sens que pour une tache inventee : celles de la
          liste ont deja leur valeur, la meme pour tout le groupe. */}
      {!chosen && (
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
      )}

      {beneficiaries.length > 0 && (
        <p className="earn-preview">
          {doers.length > 1 ? t('eachEarns') : t('youEarn')} +{Math.round(earned)}
          {beneficiaries.length < groupSize && ` · ${t('servedCount')} ${beneficiaries.length}/${groupSize}`}
        </p>
      )}

      {error && <p className="form-error">{error}</p>}

      <button type="button" className="btn btn-primary btn-block" onClick={submit}>
        {t('create')}
      </button>
    </>
  )
}
