import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './navbar.css'

const NAV_LINKS = [
  { label: 'Report', to: '/report' },
  { label: 'Volunteer', to: '/volunteer' },
  { label: 'Adopt', to: '/adopt' },
  { label: 'Analytics', to: '/analytics' },
  { label: 'About', to: '/about' },
]

/**
 * variant: "dark"  -> transparent bar with light text, sits over the forest-green hero
 *          "light" -> solid cream bar with dark text, used on interior pages
 */
export default function Navbar({ variant = 'light' }) {
  const isDark = variant === 'dark'
  const { user, isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className={`pm-nav ${isDark ? 'pm-nav--dark' : 'pm-nav--light'}`}>
      <div className="container-pm pm-nav__inner">
        <Link to="/" className="pm-nav__brand">
          <span className="pm-nav__brand-mark" aria-hidden="true">🐾</span>
          PawMap
        </Link>

        {isLoggedIn && (
          <nav className="pm-nav__links" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <Link key={l.label} to={l.to} className="pm-nav__link">
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="pm-nav__actions">
          {isLoggedIn ? (
            <>
              <span className="pm-nav__user">Hi, {user.name}</span>
              <button type="button" className="pm-nav__login pm-nav__logout" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" className="pm-nav__login">
              Log in
            </Link>
          )}
          <Link to="/report" className="btn-pm btn-pm--orange">
            <span aria-hidden="true">📷</span> Report a Stray
          </Link>
        </div>
      </div>
    </header>
  )
}