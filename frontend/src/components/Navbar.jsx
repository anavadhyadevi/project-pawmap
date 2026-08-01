import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './navbar.css'

// Reporter (regular user) — the full public-facing nav.
const REPORTER_LINKS = [
  { label: 'Report', to: '/report' },
  { label: 'Volunteer', to: '/volunteer' },
  { label: 'Adopt', to: '/adopt' },
  { label: 'Lost & Found', to: '/lost-found' },
  { label: 'Analytics', to: '/analytics' },
  { label: 'About', to: '/about' },
]

// Volunteer — duty-focused. No "Report" (their job is responding to
// reports, not filing them) and no standalone "Volunteer" page (that page
// was the signup pitch / status card, which now lives on the Dashboard).
const VOLUNTEER_LINKS = [
  { label: 'Dashboard', to: '/volunteer/dashboard' },
  { label: 'Medical Records', to: '/medical' },
  { label: 'Adopt', to: '/adopt' },
  { label: 'Lost & Found', to: '/lost-found' },
  { label: 'Analytics', to: '/volunteer/analytics' },
  { label: 'About', to: '/about' },
]

// NGO — admin-only, no public-facing actions at all.
const NGO_LINKS = [
  { label: 'Dashboard', to: '/ngo/dashboard' },
  { label: 'Medical Records', to: '/medical' },
  { label: 'Analytics', to: '/ngo/analytics' },
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

  const isNgo = isLoggedIn && user.role === 'NGO_Admin'
  const isVolunteer = isLoggedIn && user.role === 'Volunteer'

  const links = isNgo ? NGO_LINKS : isVolunteer ? VOLUNTEER_LINKS : REPORTER_LINKS

  // Neither NGOs nor Volunteers file public reports from the nav CTA —
  // Volunteers respond to cases via their dashboard instead.
  const showReportCta = isLoggedIn ? !isNgo && !isVolunteer : true

  const pendingApproval =
    isLoggedIn && ['Volunteer', 'NGO_Admin'].includes(user.role) && !user.is_verified

  const brandHref = isNgo ? '/ngo/dashboard' : isVolunteer ? '/volunteer/dashboard' : '/'

  return (
    <header className={`pm-nav ${isDark ? 'pm-nav--dark' : 'pm-nav--light'}`}>
      <div className="container-pm pm-nav__inner">
        <Link to={brandHref} className="pm-nav__brand">
          <span className="pm-nav__brand-mark" aria-hidden="true">🐾</span>
          PawMap
        </Link>

        {isLoggedIn && (
          <nav className="pm-nav__links" aria-label="Primary">
            {links.map((l) => (
              <Link key={l.label} to={l.to} className="pm-nav__link">
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="pm-nav__actions">
          {isLoggedIn ? (
            <>
              {pendingApproval && (
                <span className="pm-nav__pending" title="Your volunteer/NGO application is under review">
                  Pending approval
                </span>
              )}
              <span className="pm-nav__user">Hi, {user.full_name}</span>
              <button type="button" className="pm-nav__login pm-nav__logout" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" className="pm-nav__login">
              Log in
            </Link>
          )}
          {showReportCta && (
            <Link to="/report" className="btn-pm btn-pm--orange">
              <span aria-hidden="true">📷</span> Report a Stray
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}