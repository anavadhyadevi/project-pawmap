import { Link, Navigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './home.css'

export default function Home() {
  const { user, isLoggedIn } = useAuth()

  // The homepage is the public marketing/reporting entry point — staff
  // roles land on their own dashboards instead, even if they navigate
  // to "/" directly rather than clicking the brand logo.
  if (isLoggedIn && user.role === 'NGO_Admin') return <Navigate to="/ngo/dashboard" replace />
  if (isLoggedIn && user.role === 'Volunteer') return <Navigate to="/volunteer/dashboard" replace />

  return (
    <div className="pm-home">
      <Navbar variant="dark" />

      {/* HERO */}
      <section className="pm-hero">
        <div className="container-pm pm-hero__inner">
          <p className="eyebrow pm-hero__eyebrow">
            <span className="pm-hero__dash" /> {isLoggedIn ? `Welcome back, ${user.full_name.split(' ')[0]}` : 'Community-driven rescue · Bengaluru, India'}
          </p>
          <h1 className="pm-hero__title">
            Every stray deserves a<br />
            <span className="pm-hero__accent">second</span> chance.
          </h1>
          <p className="pm-hero__sub">
            PawMap connects community reporters, trained volunteers, vets, and NGOs
            into one real-time platform — so no injured stray goes unnoticed.
          </p>
          <div className="pm-hero__actions">
            <Link to="/report" className="btn-pm btn-pm--orange">
              <span aria-hidden="true">📷</span> Report a Stray
            </Link>
            {!isLoggedIn && (
              <Link to="/signup" className="btn-pm btn-pm--outline-dark">
                Get Started <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* WHY PAWMAP */}
      <section className="pm-why">
        <div className="container-pm pm-why__grid">
          <div className="pm-why__card">
            <span className="pm-why__icon" aria-hidden="true">📍</span>
            <h3>Spot it, report it</h3>
            <p>Drop a pin, add a photo, and a note on severity — dispatch starts in seconds.</p>
          </div>
          <div className="pm-why__card">
            <span className="pm-why__icon" aria-hidden="true">🚑</span>
            <h3>Nearest volunteer, notified</h3>
            <p>PawMap routes every case to the closest verified volunteer, ranked by reliability.</p>
          </div>
          <div className="pm-why__card">
            <span className="pm-why__icon" aria-hidden="true">🏠</span>
            <h3>From rescue to rehome</h3>
            <p>Medical history, temperament, and adoption status stay linked to every animal.</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}