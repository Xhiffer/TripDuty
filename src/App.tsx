import { useState } from 'react'
import { useApp, useBalances } from './state'
import { Join } from './screens/Join'
import { Home } from './screens/Home'
import { Ranking } from './screens/Ranking'
import { Planning } from './screens/Planning'
import { Closing } from './screens/Closing'
import { Me } from './screens/Me'
import { Avatar } from './components/ui'
import { formatDay } from './lib/i18n'

type Tab = 'home' | 'ranking' | 'planning' | 'closing' | 'me'

export function App() {
  const { state, me, lang, t } = useApp()
  const rows = useBalances()
  const [tab, setTab] = useState<Tab>('home')

  if (!me) return <Join />

  const mine = rows.find((r) => r.member.id === me.id)
  const owes = !!mine && mine.centi < 0

  const tabs: Array<{ id: Tab; icon: string; label: string; dot?: boolean }> = [
    { id: 'home', icon: '🏠', label: t('navHome'), dot: owes },
    { id: 'ranking', icon: '🏆', label: t('navRanking') },
    { id: 'planning', icon: '📅', label: t('navPlanning') },
    { id: 'closing', icon: '🏁', label: t('navClosing'), dot: state.trip.closingOpen },
    { id: 'me', icon: '👤', label: t('navMe') },
  ]

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark">⛰️</span>
          <span>
            {state.trip.name}
            <div className="trip-meta">
              {formatDay(state.trip.startDate, lang)} {t('to')} {formatDay(state.trip.endDate, lang)}
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
    </div>
  )
}
