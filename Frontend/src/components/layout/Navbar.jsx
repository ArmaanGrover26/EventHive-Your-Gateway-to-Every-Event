import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { Flame, ChevronDown, LayoutDashboard, Calendar, Settings, LogOut, Users } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [scrolled,     setScrolled]     = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [menuOpen,     setMenuOpen]     = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
    navigate('/')
  }

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-inner">
          {/* Brand */}
          <Link to="/" className="nav-brand" onClick={() => setMenuOpen(false)}>
            <Flame size={22} color="var(--orange)" className="nav-brand-icon" />
            <span className="nav-brand-text">EventHive</span>
          </Link>

          {/* Desktop Nav */}
          <div className="nav-links">
            <NavLink to="/"       className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>Home</NavLink>
            <NavLink to="/events" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Events</NavLink>
            {user?.role === 'organizer' && (
              <NavLink to="/organizer" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>My Events</NavLink>
            )}
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Admin</NavLink>
            )}
          </div>

          {/* Desktop CTA */}
          <div className="nav-cta">
            {user ? (
              <div className="user-menu">
                <button className="user-avatar-btn" onClick={() => setDropdownOpen(v => !v)}>
                  <div className="user-avatar">{initials}</div>
                  <span className="user-name">{user.name.split(' ')[0]}</span>
                  <ChevronDown size={14} color="var(--text-subtle)" />
                </button>
                {dropdownOpen && (
                  <div className="user-dropdown">
                    <Link to="/dashboard" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                    <Link to="/dashboard" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <Calendar size={15} /> My Bookings
                    </Link>
                    {(user.role === 'organizer' || user.role === 'admin') && (
                      <Link to="/organizer" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <Settings size={15} /> Organizer Panel
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link to="/admin" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <Users size={15} /> Admin Panel
                      </Link>
                    )}
                    <div className="dropdown-divider" />
                    <button className="dropdown-item danger" onClick={handleLogout}>
                      <LogOut size={15} /> Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login"    className="btn btn-ghost btn-sm">Log in</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button
            className={`hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <Link to="/"       className="mobile-nav-link" onClick={() => setMenuOpen(false)}>🏠 Home</Link>
        <Link to="/events" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>🎟️ Events</Link>
        {user && (
          <Link to="/dashboard" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>📋 Dashboard</Link>
        )}
        {user?.role === 'organizer' && (
          <Link to="/organizer" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>🛠️ Organizer Panel</Link>
        )}
        {user?.role === 'admin' && (
          <Link to="/admin" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>⚙️ Admin Panel</Link>
        )}
        <div className="mobile-menu-cta">
          {user ? (
            <button className="btn btn-outline btn-full" onClick={() => { handleLogout(); setMenuOpen(false) }}>
              <LogOut size={16} /> Log out
            </button>
          ) : (
            <>
              <Link to="/login"    className="btn btn-ghost btn-full"   onClick={() => setMenuOpen(false)}>Log in</Link>
              <Link to="/register" className="btn btn-primary btn-full" onClick={() => setMenuOpen(false)}>Sign up free</Link>
            </>
          )}
        </div>
      </div>
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setMenuOpen(false)} />
      )}
    </>
  )
}
