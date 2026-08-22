import { useMemo, useRef, useState } from 'react'
import { groupDays, useGroup } from '../state'
import { shareOfGroup } from '../lib/ledger'
import { CATALOG, EMOJI_CHOICES } from '../lib/catalog'
import { CLOSING_CATALOG } from '../lib/closing'
import { PageHeader, Toggle } from '../components/ui'
import { formatDay } from '../lib/i18n'

/**
 * Ce que vaut une tache qu'on invente.
 *
 * C'est la mediane du bareme. Une tache hors catalogue ne doit etre ni une
 * bonne affaire ni une punition : sinon on inventerait des taches pour
 * gagner plus que ce que la liste propose.
 */
const POINTS_SUR_MESURE = 13

/** Nombre de propositions affichees sous le champ. Au-dela on ne lit plus. */
const MAX_SUGGESTIONS = 6

/**
 * L'heure qu'il est, arrondie a cinq minutes.
 *
 * On note presque toujours une tache juste apres l'avoir faite : l'heure
 * courante est la bonne reponse neuf fois sur dix, et une heure fixe obligeait
 * a la corriger a chaque fois.
 */
function heureCourante() {
  const d = new Date()
  d.setMinutes(Math.round(d.getMinutes() / 5) * 5, 0, 0)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Comparaison sans accent ni casse : « menage » trouve « ménage ». */
function fold(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Ajouter une tache occupe une page entiere.
 *
 * Un volet qui monte du bas suppose une application ; dans un navigateur il se
 * retrouve coince sous la barre d'adresse. Une page, elle, se ferme par la
 * meme fleche retour que le groupe, au meme endroit.
 */
export function NewTask({ closing = false, onClose }: { closing?: boolean; onClose: () => void }) {
  const { state, me, lang, t, addTask, validateTask, activeDate } = useGroup()
  const catalog = closing ? CLOSING_CATALOG : CATALOG

  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState(closing ? '🧳' : '🍽️')
  const [pickingEmoji, setPickingEmoji] = useState(false)
  // La cle de la tache toute faite choisie, vide quand la tache est inventee.
  const [catalogKey, setCatalogKey] = useState('')
  const [focus, setFocus] = useState(false)
  const champNom = useRef<HTMLInputElement>(null)
  const [date, setDate] = useState(closing ? (state.group.endDate ?? activeDate) : activeDate)
  const [time, setTime] = useState(heureCourante)
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

  // Ce que ce groupe note le plus souvent. Au bout de deux jours, ses habitudes
  // remontent d'elles-memes : c'est ce qui fait passer l'ajout sous les dix
  // secondes, plus surement qu'un classement general.
  const usage = useMemo(() => {
    const compte = new Map<string, number>()
    for (const task of state.tasks) {
      if (task.titleKey) compte.set(task.titleKey, (compte.get(task.titleKey) ?? 0) + 1)
    }
    return compte
  }, [state.tasks])

  const habituelles = useMemo(
    () => [...catalog].sort((a, b) => (usage.get(b.key) ?? 0) - (usage.get(a.key) ?? 0)).slice(0, MAX_SUGGESTIONS),
    [catalog, usage],
  )

  const suggestions = useMemo(() => {
    const cherche = fold(title.trim())
    if (!cherche) return habituelles
    // Un debut de mot passe devant un morceau de mot, et le nom le plus court
    // devant le plus long : taper « pou » doit proposer les poubelles avant
    // « cuisiner pour une grande tablee », ou « pour » n'est qu'un mot de
    // liaison.
    const trouves = catalog
      .map((c) => {
        const nom = fold(lang === 'en' ? c.en : c.fr)
        const ou = nom.indexOf(cherche)
        const debutDeMot = ou === 0 || (ou > 0 && !/[a-z0-9]/.test(nom[ou - 1]))
        return { c, ou, rang: debutDeMot ? 0 : 1 }
      })
      .filter((r) => r.ou >= 0)
      .sort(
        (a, b) =>
          a.rang - b.rang ||
          (usage.get(b.c.key) ?? 0) - (usage.get(a.c.key) ?? 0) ||
          a.c.fr.length - b.c.fr.length ||
          b.c.points - a.c.points,
      )
    return trouves.slice(0, MAX_SUGGESTIONS).map((r) => r.c)
  }, [title, catalog, habituelles, usage, lang])
  const finalPoints = chosen ? chosen.points : POINTS_SUR_MESURE

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
    const name = title.trim()
    if (!name) return setError(t('errTaskName'))
    if (beneficiaries.length === 0) return setError(t('errNoBeneficiary'))
    if (alreadyDone && doers.length === 0) return setError(t('errNoDoer'))

    const common = {
      title: name,
      titleKey: chosen?.key,
      emoji,
      points: finalPoints,
      needsLicense: chosen?.needsLicense ?? false,
      time,
      beneficiaryIds: beneficiaries.length === groupSize ? null : beneficiaries,
      createdBy: me?.id ?? '',
      recurring,
      isClosing: closing,
    }
    // Une tache recurrente est posee sur chaque jour restant : le planning
    // montre alors vraiment ce qui est prevu, plutot qu'une simple etiquette.
    const targets = recurring && !closing ? days.filter((d) => d >= date) : [date]
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

      <div className="field combo">
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
            ref={champNom}
            className="input"
            value={title}
            placeholder={t('taskNamePlaceholder')}
            autoFocus
            autoComplete="off"
            onFocus={() => setFocus(true)}
            onBlur={() =>
              // Le clic sur une proposition doit passer avant la fermeture, et
              // un champ qui reprend le focus entre-temps ne doit pas la subir.
              window.setTimeout(() => {
                if (document.activeElement !== champNom.current) setFocus(false)
              }, 150)
            }
            onChange={(e) => {
              setTitle(e.target.value)
              // Ecrire, c'est chercher : les propositions reviennent meme si
              // on vient d'en choisir une.
              setFocus(true)
              // Et des que le texte bouge, la tache n'est plus celle du
              // catalogue : elle reprend sa valeur de tache inventee.
              setCatalogKey('')
              setError('')
            }}
          />
        </div>

        {/* Ce qu'on a sous la main plutot qu'une liste de cent cinquante lignes :
            trois lettres suffisent a retrouver une tache et son bareme. */}
        {focus && suggestions.length > 0 && !chosen && (
          <ul className="suggestions">
            {suggestions.map((c) => (
              <li key={c.key}>
                <button
                  type="button"
                  className="suggestion"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setCatalogKey(c.key)
                    setTitle(lang === 'en' ? c.en : c.fr)
                    setEmoji(c.emoji)
                    setPickingEmoji(false)
                    setFocus(false)
                    setError('')
                    // Le clavier se referme : le bouton « Créer » revient sous
                    // le pouce sans avoir a faire defiler.
                    champNom.current?.blur()
                  }}
                >
                  <span className="suggestion-emoji">{c.emoji}</span>
                  <span className="suggestion-name">{lang === 'en' ? c.en : c.fr}</span>
                  <span className="suggestion-points">{c.points}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
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
      </div>

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
