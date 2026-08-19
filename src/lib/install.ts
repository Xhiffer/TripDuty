import type { Lang } from '../types'

/**
 * Comment ajouter l'application a l'ecran d'accueil.
 *
 * Le geste n'est pas le meme d'un appareil a l'autre ni d'un navigateur a
 * l'autre, et une consigne fausse est pire qu'aucune consigne : on regarde
 * donc ce que la personne utilise vraiment avant de lui dire quoi faire.
 */

export type Platform = 'ios' | 'android' | 'desktop'
export type Browser = 'safari' | 'chrome' | 'edge' | 'firefox' | 'samsung' | 'other'

export interface InstallGuide {
  /** Le nom du navigateur, tel qu'on le montre a la personne. */
  browser: string
  steps: string[]
  /** Precision quand le navigateur ne sait pas installer. */
  warning?: string
}

export function detectPlatform(): Platform {
  const ua = navigator.userAgent
  // Un iPad recent se presente comme un Mac : seul l'ecran tactile le trahit.
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
  if (/iPhone|iPad|iPod/.test(ua) || iPadOS) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}

export function detectBrowser(): Browser {
  const ua = navigator.userAgent
  if (/CriOS|EdgiOS|FxiOS/.test(ua)) {
    if (/CriOS/.test(ua)) return 'chrome'
    if (/EdgiOS/.test(ua)) return 'edge'
    return 'firefox'
  }
  if (/SamsungBrowser/.test(ua)) return 'samsung'
  if (/Edg\//.test(ua)) return 'edge'
  if (/Firefox\//.test(ua)) return 'firefox'
  if (/Chrome\//.test(ua)) return 'chrome'
  if (/Safari\//.test(ua)) return 'safari'
  return 'other'
}

const NAMES: Record<Browser, string> = {
  safari: 'Safari',
  chrome: 'Chrome',
  edge: 'Edge',
  firefox: 'Firefox',
  samsung: 'Samsung Internet',
  other: '',
}

const FR = {
  iosSafari: [
    'Appuie sur le bouton Partager, en bas de l’écran, au milieu.',
    'Fais défiler la liste vers le bas.',
    'Choisis « Sur l’écran d’accueil ».',
    'Appuie sur « Ajouter », en haut à droite.',
  ],
  iosOther: [
    'Appuie sur le bouton Partager, dans la barre d’adresse en haut.',
    'Fais défiler la liste vers le bas.',
    'Choisis « Sur l’écran d’accueil ».',
    'Appuie sur « Ajouter », en haut à droite.',
  ],
  androidChrome: [
    'Appuie sur les trois points, en haut à droite.',
    'Choisis « Ajouter à l’écran d’accueil », ou « Installer l’application ».',
    'Confirme en appuyant sur « Installer ».',
  ],
  samsung: [
    'Appuie sur le menu, les trois traits en bas à droite.',
    'Choisis « Ajouter la page à ».',
    'Choisis « Écran d’accueil », puis confirme.',
  ],
  androidFirefox: [
    'Appuie sur les trois points, en haut à droite.',
    'Choisis « Installer », ou « Ajouter à l’écran d’accueil ».',
    'Confirme.',
  ],
  desktopChrome: [
    'Clique sur l’icône d’installation, à droite de la barre d’adresse.',
    'Ou passe par le menu du navigateur, puis « Installer Trip Duty ».',
    'Confirme en cliquant sur « Installer ».',
  ],
  macSafari: [
    'Ouvre le menu « Fichier », en haut de l’écran.',
    'Choisis « Ajouter au Dock ».',
    'Confirme en cliquant sur « Ajouter ».',
  ],
  desktopFirefox: [
    'Firefox sur ordinateur ne sait pas installer une application web.',
    'Ouvre Trip Duty dans Chrome, Edge ou Safari pour l’installer.',
    'Sur téléphone, Firefox sait le faire.',
  ],
}

const EN = {
  iosSafari: [
    'Tap the Share button, at the bottom of the screen, in the middle.',
    'Scroll the list down.',
    'Choose "Add to Home Screen".',
    'Tap "Add", at the top right.',
  ],
  iosOther: [
    'Tap the Share button, in the address bar at the top.',
    'Scroll the list down.',
    'Choose "Add to Home Screen".',
    'Tap "Add", at the top right.',
  ],
  androidChrome: [
    'Tap the three dots, at the top right.',
    'Choose "Add to Home screen", or "Install app".',
    'Confirm by tapping "Install".',
  ],
  samsung: [
    'Tap the menu, the three lines at the bottom right.',
    'Choose "Add page to".',
    'Choose "Home screen", then confirm.',
  ],
  androidFirefox: [
    'Tap the three dots, at the top right.',
    'Choose "Install", or "Add to Home screen".',
    'Confirm.',
  ],
  desktopChrome: [
    'Click the install icon, at the right of the address bar.',
    'Or open the browser menu, then "Install Trip Duty".',
    'Confirm by clicking "Install".',
  ],
  macSafari: [
    'Open the "File" menu, at the top of the screen.',
    'Choose "Add to Dock".',
    'Confirm by clicking "Add".',
  ],
  desktopFirefox: [
    'Firefox on a computer cannot install a web app.',
    'Open Trip Duty in Chrome, Edge or Safari to install it.',
    'On a phone, Firefox can do it.',
  ],
}

export function installGuide(lang: Lang): InstallGuide {
  const platform = detectPlatform()
  const browser = detectBrowser()
  const steps = lang === 'en' ? EN : FR
  const name = NAMES[browser]

  if (platform === 'ios') {
    // Depuis iOS 16.4, tous les navigateurs savent le faire, mais le bouton
    // Partager n'est pas au meme endroit : en bas dans Safari, en haut ailleurs.
    return { browser: name || 'Safari', steps: browser === 'safari' ? steps.iosSafari : steps.iosOther }
  }

  if (platform === 'android') {
    if (browser === 'samsung') return { browser: name, steps: steps.samsung }
    if (browser === 'firefox') return { browser: name, steps: steps.androidFirefox }
    return { browser: name || 'Chrome', steps: steps.androidChrome }
  }

  if (browser === 'safari') return { browser: name, steps: steps.macSafari }
  if (browser === 'firefox') return { browser: name, steps: steps.desktopFirefox }
  return { browser: name || 'Chrome', steps: steps.desktopChrome }
}
