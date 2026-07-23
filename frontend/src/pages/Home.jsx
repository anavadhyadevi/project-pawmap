import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './home.css'

export default function Home() {
  return (
    <div className="pm-home">
      <Navbar variant="dark" />

      {/* HERO */}
      <section className="pm-hero">
        <div className="container-pm pm-hero__inner">
          <p className="eyebrow pm-hero__eyebrow">
            <span className="pm-hero__dash" /> Community-driven rescue · Bengaluru, India
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
            <Link to="/signup" className="btn-pm btn-pm--outline-dark">
              Get Started <span aria-hidden="true">→</span>
            </Link>
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