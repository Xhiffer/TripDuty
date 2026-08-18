import { useState } from 'react'
import { useApp } from '../state'

/** Explication du principe, montree une fois apres la creation du compte. */
export function Concept() {
  const { t, markConceptSeen } = useApp()
  const [step, setStep] = useState(0)

  const steps = [
    { emoji: '🧹', title: t('concept1Title'), body: t('concept1Body') },
    { emoji: '⚖️', title: t('concept2Title'), body: t('concept2Body') },
    { emoji: '🙋', title: t('concept3Title'), body: t('concept3Body') },
    { emoji: '🏁', title: t('concept4Title'), body: t('concept4Body') },
  ]

  const current = steps[step]
  const last = step === steps.length - 1

  return (
    <div className="app app-centered">
      <div className="card concept pop" key={step}>
        <span className="concept-emoji">{current.emoji}</span>
        <h1 className="concept-title">{current.title}</h1>
        <p className="concept-body">{current.body}</p>
      </div>

      <div className="dots">
        {steps.map((_, i) => (
          <span key={i} className={`dot-nav ${i === step ? 'is-on' : ''}`} />
        ))}
      </div>

      <div className="stack" style={{ marginTop: 18 }}>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => (last ? markConceptSeen() : setStep(step + 1))}
        >
          {last ? t('conceptStart') : t('next')}
        </button>
        {!last && (
          <button type="button" className="btn btn-block" onClick={markConceptSeen}>
            {t('skip')}
          </button>
        )}
      </div>
    </div>
  )
}
