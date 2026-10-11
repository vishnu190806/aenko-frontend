import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const LINKS = [
  ['/', 'Dashboard'],
  ['/discover', 'Discover Anime'],
  ['/library', 'My Library'],
  ['/guide', 'Anime Guide'],
  ['/quests', 'Quests'],
  ['/achievements', 'Achievements'],
  ['/guilds', 'Guilds'],
  ['/profile', 'AnimeVerse Profile'],
  ['/activity', 'Activity'],
  ['/ai', 'AI Insight'],
]

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      {open && <div className="scrim" onClick={() => setOpen(false)} aria-hidden="true" />}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <div className="brand-name">AENKO</div>
            <div className="brand-tag">Your Anime Journey</div>
          </div>
        </div>
        <nav className="nav-links" aria-label="Main navigation">
          {LINKS.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <strong>{user?.username || 'Traveler'}</strong>
          <span>{user?.email || ''}</span>
          <div className="btn-row">
            <button type="button" className="btn ghost small" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </aside>
      <div className="main">
        <div className="topbar">
          <button type="button" className="btn secondary small menu-btn" onClick={() => setOpen((v) => !v)} aria-label="Toggle navigation">☰</button>
          <h1>AENKO</h1>
          <div className="spacer" />
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>{user ? `Lv. traveler · ${user.username}` : ''}</span>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
