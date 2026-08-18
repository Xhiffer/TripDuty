import { useEffect, useState } from 'react'
import { useApp } from '../state'

/** L'icone Partager de Safari, dessinee ici pour qu'elle s'affiche partout. */
function ShareIcon() {
  return (
    <svg width="15" height="18" viewBox="0 0 15 18" fill="none" aria-hidden="true" className="share-glyph">
      <path d="M7.5 1.2v9.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4.6 4.1 7.5 1.2l2.9 2.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M3.6 7.2H2.4A1.2 1.2 0 0 0 1.2 8.4v7.2a1.2 1.2 0 0 0 1.2 1.2h10.2a1.2 1.2 0 0 0 1.2-1.2V8.4a1.2 1.2 0 0 0-1.2-1.2h-1.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** L'evenement que Chrome envoie quand l'application peut etre installee. */
interface InstallEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'tripduty:install-dismissed'

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isApple(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

/**
 * Invite a installer l'application sur l'ecran d'accueil.
 * Sur Android, le navigateur sait le faire tout seul et on lui demande.
 * Sur iPhone, aucune commande n'existe : on explique le geste.
 */
export function InstallPrompt() {
  const { t } = useApp()
  const [event, setEvent] = useState<InstallEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    if (localStorage.getItem(DISMISSED_KEY) === '1') return

    if (isApple()) {
      // Laisse le temps de voir l'application avant de proposer quoi que ce soit.
      const timer = setTimeout(() => setVisible(true), 4000)
      return () => clearTimeout(timer)
    }

    function onPrompt(e: Event) {
      e.preventDefault()
      setEvent(e as InstallEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  useEffect(() => {
    function onInstalled() {
      setVisible(false)
      localStorage.setItem(DISMISSED_KEY, '1')
    }
    window.addEventListener('appinstalled', onInstalled)
    return () => window.removeEventListener('appinstalled', onInstalled)
  }, [])

  if (!visible) return null

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  async function install() {
    if (!event) return
    await event.prompt()
    const choice = await event.userChoice
    if (choice.outcome === 'accepted') localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  return (
    <div className="install-card pop" role="dialog">
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <span className="install-mark">⛰️</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="install-title">{t('installTitle')}</span>
          <span className="install-body">{event ? t('installBodyAndroid') : t('installBodyIos')}</span>
        </span>
        <button type="button" className="install-close" onClick={dismiss} aria-label={t('later')}>
          ✕
        </button>
      </div>

      {event ? (
        <button type="button" className="btn btn-primary btn-block btn-sm" style={{ marginTop: 12 }} onClick={() => void install()}>
          {t('installNow')}
        </button>
      ) : (
        <div className="install-steps">
          <span className="install-step">
            <b>1.</b> {t('installIosStep1')} <ShareIcon />
          </span>
          <span className="install-step">
            <b>2.</b> {t('installIosStep2')}
          </span>
        </div>
      )}
    </div>
  )
}
