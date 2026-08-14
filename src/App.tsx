import { useState } from 'react'
import { useApp, useStandings } from './state'
import { Join } from './screens/Join'
import { Home } from './screens/Home'
import { Ranking } from './screens/Ranking'
import { Planning } from './screens/Planning'
import { Me } from './screens/Me'
import { Avatar } from './components/ui'
import { formatDay } from './lib/i18n'

type Tab = 'home' | 'ranking' | 'planning' | 'me'

export function App() {
  const { state, me, lang, t } = useApp()
  const rows = useStandings()
  const [tab, setTab] = useState<Tab>('home')

  if (!me) return <Join />

  const last = rows.length > 1 ? rows[rows.length - 1] : null
  const iAmLast = last?.member.id === me.id

  const tabs: Array<{ id: Tab; icon: string; label: string; dot?: boolean }> = [
    { id: 'home', icon: '🏠', label: t('navHome'), dot: iAmLast },
    { id: 'ranking', icon: '🏆', label: t('navRanking') },
    { id: 'planning', icon: '📅', label: t('navPlanning') },
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
