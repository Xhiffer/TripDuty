import { useEffect, useState } from 'react'
import { Share, Smartphone } from 'lucide-react'
import { useApp } from '../state'
import { Sheet } from './ui'

/** L'evenement que Chrome envoie quand l'application peut etre installee. */
interface InstallEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

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
 * Ajouter l'application a l'ecran d'accueil.
 * Sur Android le navigateur sait le faire et on lui demande. Sur iPhone
 * aucune commande n'existe : on montre le geste.
 */
export function InstallButton({ variant = 'block' }: { variant?: 'block' | 'icon' }) {
  const { t } = useApp()
  const [event, setEvent] = useState<InstallEvent | null>(null)
  const [installed, setInstalled] = useState(() => isStandalone())
  const [steps, setSteps] = useState(false)

  useEffect(() => {
    function onPrompt(e: Event) {
      e.preventDefault()
      setEvent(e as InstallEvent)
    }
    function onInstalled() {
      setInstalled(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  // Une fois installee, il n'y a plus rien a proposer.
  if (installed) return null

  async function install() {
    if (!event) return setSteps(true)
    await event.prompt()
    const choice = await event.userChoice
    if (choice.outcome === 'accepted') setInstalled(true)
    setEvent(null)
  }

  return (
    <>
      {variant === 'icon' ? (
        <button type="button" className="icon-button" onClick={() => void install()} aria-label={t('installTitle')}>
          <Smartphone size={19} />
        </button>
      ) : (
        <button type="button" className="btn btn-block" style={{ marginTop: 10 }} onClick={() => void install()}>
          <Smartphone size={17} />
          {t('installTitle')}
        </button>
      )}

      {steps && (
        <Sheet title={t('installTitle')} subtitle={t('installBodyIos')} onClose={() => setSteps(false)}>
          <div className="install-steps">
            {isApple() ? (
              <>
                <span className="install-step">
                  <b>1.</b> {t('installIosStep1')} <Share size={15} className="share-glyph" />
                </span>
                <span className="install-step">
                  <b>2.</b> {t('installIosStep2')}
                </span>
              </>
            ) : (
              <>
                <span className="install-step">
                  <b>1.</b> {t('installOtherStep1')}
                </span>
                <span className="install-step">
                  <b>2.</b> {t('installIosStep2')}
                </span>
              </>
            )}
          </div>
        </Sheet>
      )}
    </>
  )
}
