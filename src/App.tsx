import { useEffect, useState } from 'react'
import { useApp, useBalances } from './state'
import { Auth } from './screens/Auth'
import { ProfileSetup } from './screens/ProfileSetup'
import { Concept } from './screens/Concept'
import { Groups } from './screens/Groups'
import { Account } from './screens/Account'
import { Home } from './screens/Home'
import { Ranking } from './screens/Ranking'
import { Planning } from './screens/Planning'
import { Closing } from './screens/Closing'
import { GroupSettings } from './screens/GroupSettings'
import { GroupMenu } from './components/GroupMenu'
import { ShareSheet } from './components/ShareSheet'
import { LeaveGroupSheet } from './components/LeaveGroupSheet'
import { ArrowLeft, MoreHorizontal, House, Trophy, CalendarDays, Flag, Compass, CircleUser } from 'lucide-react'
import { Splash } from './components/Splash'
import { formatDay } from './lib/i18n'

type Tab = 'home' | 'ranking' | 'planning' | 'closing'
type OuterTab = 'groups' | 'profile'

export function App() {
  const { account, view, me, conceptSeen, lang, t, joinByCode, selectGroup } = useApp()
  const rows = useBalances()
  const [tab, setTab] = useState<Tab>('home')
  const [splashDone, setSplashDone] = useState(false)
  const [outerTab, setOuterTab] = useState<OuterTab>('groups')
  const [menuOpen, setMenuOpen] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [editing, setEditing] = useState(false)
  // L'etape photo est passee une fois par appareil, une fois le compte cree.
  const [profileDone, setProfileDone] = useState(false)

  useEffect(() => {
    if (!account) return setProfileDone(false)
    setProfileDone(localStorage.getItem(`tripduty:profile-done:${account.id}`) === '1')
  }, [account])

  // Lien d'invitation partage : #/join/CODE
  useEffect(() => {
    const match = window.location.hash.match(/^#\/join\/([A-Za-z0-9]+)$/)
    if (!match || !account) return
    void joinByCode(match[1]).then((result) => {
      if (result.ok) window.location.hash = ''
    })
  }, [account, joinByCode])

  if (!splashDone) return <Splash onDone={() => setSplashDone(true)} />

  const needsProfile = !!account && (!account.firstName || !account.birthDate || !profileDone)

  function finishProfile() {
    if (account) localStorage.setItem(`tripduty:profile-done:${account.id}`, '1')
    setProfileDone(true)
  }

  // Avant d'avoir un compte complet, il n'y a pas de barre de navigation :
  // l'invitation a installer se cale plus bas.
  if (!account || needsProfile || !conceptSeen) {
    let screen = <Auth />
    if (needsProfile) screen = <ProfileSetup onDone={finishProfile} />
    else if (account && !conceptSeen) screen = <Concept />
    return (
      <>
        {screen}
      </>
    )
  }

  // Connecte mais pas encore dans un groupe : la liste et le profil du compte.
  if (!view || !me) {
    const outerTabs = [
      { id: 'groups' as OuterTab, Icon: Compass, label: t('navGroups') },
      { id: 'profile' as OuterTab, Icon: CircleUser, label: t('navProfile') },
    ]
    return (
      <div className="app">
        {outerTab === 'groups' ? <Groups /> : <Account />}

        <nav className="nav">
          <div className="nav-inner">
            {outerTabs.map((item) => (
              <button
                key={item.id}
                type="button"
                className={outerTab === item.id ? 'is-on' : ''}
                onClick={() => setOuterTab(item.id)}
              >
                <item.Icon size={21} strokeWidth={outerTab === item.id ? 2.4 : 1.9} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

      </div>
    )
  }

  const mine = rows.find((r) => r.member.id === me.id)
  const owes = !!mine && mine.centi < 0

  const tabs = [
    { id: 'home' as Tab, Icon: House, label: t('navHome'), dot: owes },
    { id: 'ranking' as Tab, Icon: Trophy, label: t('navRanking'), dot: false },
    { id: 'planning' as Tab, Icon: CalendarDays, label: t('navPlanning'), dot: false },
    { id: 'closing' as Tab, Icon: Flag, label: t('navClosing'), dot: view.group.closingOpen },
  ]

  if (editing) {
    return (
      <div className="app">
        <GroupSettings onClose={() => setEditing(false)} />
      </div>
    )
  }

  return (
    <div className="app">
      {/* Les commandes d'abord, l'identite du groupe en dessous. */}
      <div className="topbar">
        <button type="button" className="icon-button" onClick={() => selectGroup(null)} aria-label={t('backToGroups')}>
          <ArrowLeft size={20} />
        </button>
        <span />
        <button type="button" className="icon-button" onClick={() => setMenuOpen(true)} aria-label={t('groupMenu')}>
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="group-head">
        <span className="group-mark is-small" style={{ background: view.group.color }}>
          {view.group.emoji}
        </span>
        <span className="topbar-name">{view.group.name}</span>
        <span className="topbar-dates">
          {formatDay(view.group.startDate, lang)} {t('to')} {formatDay(view.group.endDate, lang)}
        </span>
      </div>

      {tab === 'home' && <Home goRanking={() => setTab('ranking')} />}
      {tab === 'ranking' && <Ranking />}
      {tab === 'planning' && <Planning />}
      {tab === 'closing' && <Closing />}

      <nav className="nav">
        <div className="nav-inner">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? 'is-on' : ''}
              onClick={() => setTab(item.id)}
            >
              <item.Icon size={21} strokeWidth={tab === item.id ? 2.4 : 1.9} />
              <span>{item.label}</span>
              {item.dot && <span className="nav-dot" />}
            </button>
          ))}
        </div>
      </nav>


      {menuOpen && (
        <GroupMenu
          onClose={() => setMenuOpen(false)}
          onEdit={() => {
            setMenuOpen(false)
            setEditing(true)
          }}
          onShare={() => {
            setMenuOpen(false)
            setSharing(true)
          }}
          onLeave={() => {
            setMenuOpen(false)
            setLeaving(true)
          }}
        />
      )}
      {sharing && <ShareSheet onClose={() => setSharing(false)} />}
      {leaving && <LeaveGroupSheet onClose={() => setLeaving(false)} />}
    </div>
  )
}
