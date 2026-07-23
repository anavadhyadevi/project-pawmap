import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './about.css'

const VALUES = [
  {
    icon: '📍',
    title: 'Every report matters',
    body: 'No case is too small to log — a scared kitten and a hit-by-vehicle dog get the same urgency of response.',
  },
  {
    icon: '🤝',
    title: 'Community first',
    body: 'Reporters, volunteers, vets, and NGOs work off the same live picture instead of scattered phone calls.',
  },
  {
    icon: '📈',
    title: 'Transparent outcomes',
    body: 'Every case is tracked from report to resolution, so nothing quietly falls through the cracks.',
  },
]

const STATS = [
  { value: '1,200+', label: 'Strays reported' },
  { value: '340+', label: 'Verified volunteers' },
  { value: '28', label: 'Partner NGOs' },
  { value: '890', label: 'Successful adoptions' },
]

export default function About() {
  return (
    <div className="pm-about-page">
      <Navbar variant="dark" />

      <section className="pm-about-hero">
        <div className="container-pm pm-about-hero__inner">
          <p className="eyebrow pm-about-hero__eyebrow">
            <span className="pm-hero__dash" /> Our mission
          </p>
          <h1 className="pm-about-hero__title">
            Built by people who couldn't <span className="pm-hero__accent">walk past</span>.
          </h1>
          <p className="pm-about-hero__sub">
            PawMap started in Bengaluru with a simple problem: strays get spotted every
            day, but reports rarely reach the people who can help in time. We built the
            platform that closes that gap.
          </p>
        </div>
      </section>

      <section className="pm-about-stats">
        <div className="container-pm pm-about-stats__grid">
          {STATS.map((s) => (
            <div key={s.label} className="pm-about-stat">
              <span className="pm-about-stat__value">{s.value}</span>
              <span className="pm-about-stat__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="pm-about-values">
        <div className="container-pm">
          <p className="eyebrow pm-about-values__eyebrow">What we stand for</p>
          <h2 className="pm-about-values__title">Three things we don't compromise on.</h2>

          <div className="pm-about-values__grid">
            {VALUES.map((v) => (
              <div key={v.title} className="pm-about-value">
                <span className="pm-about-value__icon" aria-hidden="true">{v.icon}</span>
                <h3>{v.title}</h3>
                <p>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pm-about-cta">
        <div className="container-pm pm-about-cta__inner">
          <h2>Want to be part of it?</h2>
          <p>Report a stray in your neighbourhood, or join as a volunteer.</p>
          <div className="pm-about-cta__actions">
            <Link to="/report" className="btn-pm btn-pm--orange">
              <span aria-hidden="true">📷</span> Report a Stray
            </Link>
            <Link to="/volunteer" className="btn-pm btn-pm--outline-light">
              Become a Volunteer
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}