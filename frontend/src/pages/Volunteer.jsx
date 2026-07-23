import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './volunteer.css'

const STEPS = [
  {
    title: 'Sign up as a volunteer',
    body: 'Create an account and choose the Volunteer role — it takes about two minutes.',
  },
  {
    title: 'Get approved',
    body: 'A partner NGO reviews your application. You\u2019ll get a notification once you\u2019re verified.',
  },
  {
    title: 'Start claiming cases',
    body: 'Reported strays near you show up in your feed. Claim one, respond, and update its status as you go.',
  },
]

const EXPECTATIONS = [
  { icon: '🕒', label: 'A few hours a week', body: 'Respond to cases whenever you\u2019re free — no fixed shifts.' },
  { icon: '📍', label: 'Cases near you', body: 'You only see reports within the radius you set.' },
  { icon: '🤝', label: 'Backed by an NGO', body: 'Every claim is visible to your partner NGO for support and follow-up.' },
]

export default function Volunteer() {
  return (
    <div className="pm-volunteer-page">
      <Navbar variant="dark" />

      <section className="pm-vol-hero">
        <div className="container-pm pm-vol-hero__inner">
          <p className="eyebrow pm-vol-hero__eyebrow">
            <span className="pm-hero__dash" /> Join the rescue network
          </p>
          <h1 className="pm-vol-hero__title">
            Be the one who <span className="pm-hero__accent">shows up</span>.
          </h1>
          <p className="pm-vol-hero__sub">
            Volunteers are the backbone of PawMap — the first responders who turn a
            report into a rescue. No experience required, just a willingness to help.
          </p>
          <div className="pm-vol-hero__actions">
            <Link to="/signup" className="btn-pm btn-pm--orange">
              Become a Volunteer <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="pm-vol-steps">
        <div className="container-pm">
          <p className="eyebrow pm-vol-steps__eyebrow">How it works</p>
          <h2 className="pm-vol-steps__title">Three steps to your first rescue.</h2>

          <div className="pm-vol-steps__grid">
            {STEPS.map((s, i) => (
              <div key={s.title} className="pm-vol-step">
                <span className="pm-vol-step__num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pm-vol-expect">
        <div className="container-pm pm-vol-expect__grid">
          {EXPECTATIONS.map((e) => (
            <div key={e.label} className="pm-vol-expect__card">
              <span className="pm-vol-expect__icon" aria-hidden="true">{e.icon}</span>
              <h3>{e.label}</h3>
              <p>{e.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pm-vol-cta">
        <div className="container-pm pm-vol-cta__inner">
          <h2>Ready when you are.</h2>
          <p>Sign up in a couple of minutes — your NGO partner takes it from there.</p>
          <Link to="/signup" className="btn-pm btn-pm--orange">
            Become a Volunteer <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}