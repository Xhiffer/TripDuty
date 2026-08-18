import { useEffect, useState } from 'react'
import { useApp, useBalances } from './state'
import { Auth } from './screens/Auth'
import { ProfileSetup } from './screens/ProfileSetup'
import { Concept } from './screens/Concept'
import { Groups } from './screens/Groups'
import { Home } from './screens/Home'
import { Ranking } from './screens/Ranking'
import { Planning } from './screens/Planning'
import { Closing } from './screens/Closing'
import { Me } from './screens/Me'
import { Avatar } from './components/ui'
import { InstallPrompt } from './components/InstallPrompt'
import { formatDay } from './lib/i18n'

type Tab = 'home' | 'ranking' | 'planning' | 'closing' | 'me'

export function App() {
  const { account, view, me, conceptSeen, lang, t, joinByCode } = useApp()
  const rows = useBalances()
  const [tab, setTab] = useState<Tab>('home')

  // Lien d'invitation partage : #/join/CODE
  useEffect(() => {
    const match = window.location.hash.match(/^#\/join\/([A-Za-z0-9]+)$/)
    if (!match || !account) return
    void joinByCode(match[1]).then((result) => {
      if (result.ok) window.location.hash = ''
    })
  }, [account, joinByCode])

  // Avant d'etre dans un groupe, il n'y a pas de barre de navigation en bas :
  // l'invitation a installer se cale plus bas.
  if (!account || !account.firstName || !account.birthDate || !conceptSeen || !view || !me) {
    let screen = <Auth />
    if (!account) screen = <Auth />
    else if (!account.firstName || !account.birthDate) screen = <ProfileSetup />
    else if (!conceptSeen) screen = <Concept />
    else screen = <Groups />
    return (
      <>
        {screen}
        <div className="no-nav">
          <InstallPrompt />
        </div>
      </>
    )
  }

  const mine = rows.find((r) => r.member.id === me.id)
  const owes = !!mine && mine.centi < 0

  const tabs: Array<{ id: Tab; icon: string; label: string; dot?: boolean }> = [
    { id: 'home', icon: '🏠', label: t('navHome'), dot: owes },
    { id: 'ranking', icon: '🏆', label: t('navRanking') },
    { id: 'planning', icon: '📅', label: t('navPlanning') },
    { id: 'closing', icon: '🏁', label: t('navClosing'), dot: view.group.closingOpen },
    { id: 'me', icon: '👤', label: t('navMe') },
  ]

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark" style={{ background: view.group.color }}>
            {view.group.emoji}
          </span>
          <span>
            {view.group.name}
            <div className="trip-meta">
              {formatDay(view.group.startDate, lang)} {t('to')} {formatDay(view.group.endDate, lang)}
            </div>
          </span>
        </div>
        <button type="button" onClick={() => setTab('me')}>
          <Avatar member={me} size={38} />
        </button>
      </div>

      {tab === 'home' && <Home goRanking={() => setTab('ranking')} />}
      {tab === 'ranking' && <Ranking />}
      {tab === 'planning' && <Planning />}
      {tab === 'closing' && <Closing />}
      {tab === 'me' && <Me />}

      <nav className="nav">
        <div className="nav-inner">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? 'is-on' : ''}
              onClick={() => setTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.dot && <span className="nav-dot" />}
            </button>
          ))}
        </div>
      </nav>

      <InstallPrompt />
    </div>
  )
}
