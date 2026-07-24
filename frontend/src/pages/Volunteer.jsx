import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './volunteer.css'

const STEPS = [
  {
    title: 'Apply from your account',
    body: 'Already a PawMap user? Apply right from here \u2014 no need to create a new account.',
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
  const { user, isLoggedIn } = useAuth()
  const [form, setForm] = useState({ availability: '', experience: '', reason: '' })
  const [submitting, setSubmitting] = useState(false)
  const [applied, setApplied] = useState(false)

  function update(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function handleApply(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      // Wire this up to POST /api/users/volunteer-application/ (or similar)
      // once the backend exposes an in-account application endpoint —
      // it doesn't exist yet, this only updates local UI state for now.
      // await apiRequest('/users/volunteer-application/', {
      //   method: 'POST',
      //   token: accessToken,
      //   body: form,
      // })
      await new Promise((r) => setTimeout(r, 600))
      setApplied(true)
    } finally {
      setSubmitting(false)
    }
  }

  const alreadyVolunteer = isLoggedIn && user.role === 'Volunteer'
  const pendingReview = isLoggedIn && user.role === 'Volunteer' && !user.is_verified

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

          {!isLoggedIn && (
            <div className="pm-vol-hero__actions">
              <Link to="/signup" className="btn-pm btn-pm--orange">
                Become a Volunteer <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* LOGGED-IN APPLICATION AREA */}
      {isLoggedIn && (
        <section className="pm-vol-apply">
          <div className="container-pm">
            {alreadyVolunteer ? (
              <div className="pm-vol-apply__card pm-vol-apply__card--status">
                <span aria-hidden="true">{pendingReview ? '⏳' : '✅'}</span>
                <h3>{pendingReview ? 'Your application is under review' : "You're a verified volunteer"}</h3>
                <p>
                  {pendingReview
                    ? "We've got your application. An NGO partner will review it and you'll get a notification once approved."
                    : 'You have full volunteer access — head to your dashboard to start claiming cases.'}
                </p>
              </div>
            ) : applied ? (
              <div className="pm-vol-apply__card pm-vol-apply__card--status">
                <span aria-hidden="true">⏳</span>
                <h3>Application submitted</h3>
                <p>
                  Thanks, {user.full_name.split(' ')[0]} — we've logged your interest in volunteering.
                  An NGO partner will review it and you'll be notified once approved.
                </p>
              </div>
            ) : (
              <form className="pm-vol-apply__card" onSubmit={handleApply}>
                <h3>Apply to volunteer</h3>
                <p className="pm-vol-apply__sub">
                  You're signed in as <strong>{user.full_name}</strong> — this applies your
                  existing account for volunteer access, no new signup needed.
                </p>

                <div className="pm-field">
                  <label htmlFor="availability">Availability</label>
                  <input
                    id="availability"
                    value={form.availability}
                    onChange={(e) => update('availability', e.target.value)}
                    placeholder="e.g. weekday evenings, weekends"
                  />
                </div>

                <div className="pm-field">
                  <label htmlFor="experience">Relevant experience (optional)</label>
                  <input
                    id="experience"
                    value={form.experience}
                    onChange={(e) => update('experience', e.target.value)}
                    placeholder="e.g. fostered before, veterinary background"
                  />
                </div>

                <div className="pm-field">
                  <label htmlFor="reason">Why do you want to volunteer?</label>
                  <textarea
                    id="reason"
                    rows={3}
                    value={form.reason}
                    onChange={(e) => update('reason', e.target.value)}
                    placeholder="Tell your NGO reviewer a bit about yourself"
                  />
                </div>

                <button type="submit" className="btn-pm btn-pm--orange btn-pm--full" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit application'}
                </button>
              </form>
            )}
          </div>
        </section>
      )}

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

      {!isLoggedIn && (
        <section className="pm-vol-cta">
          <div className="container-pm pm-vol-cta__inner">
            <h2>Ready when you are.</h2>
            <p>Sign up in a couple of minutes — your NGO partner takes it from there.</p>
            <Link to="/signup" className="btn-pm btn-pm--orange">
              Become a Volunteer <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}