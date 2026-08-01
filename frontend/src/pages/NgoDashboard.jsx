import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { VOLUNTEER_APPLICATIONS } from '../data/volunteerApplications.js'
import './ngoDashboard.css'

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const hrs = Math.round(diffMs / 3600000)
  if (hrs < 24) return `${hrs} hr ago`
  return `${Math.round(hrs / 24)} day ago`
}

export default function NgoDashboard() {
  const { user, isLoggedIn } = useAuth()
  const [applications, setApplications] = useState(VOLUNTEER_APPLICATIONS)
  const [expandedId, setExpandedId] = useState(null)

  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (user.role !== 'NGO_Admin') return <Navigate to="/" replace />

  const pending = useMemo(() => applications.filter((a) => a.status === 'pending'), [applications])
  const reviewed = useMemo(() => applications.filter((a) => a.status !== 'pending'), [applications])

  function decide(id, decision) {
    // Wire this up to PATCH /api/users/:id/ (or a dedicated
    // /api/volunteer-applications/:id/decision/ endpoint) once the
    // backend exposes it. Should set role='Volunteer', is_verified=true
    // on approve, or leave role unchanged / flag rejected on reject.
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: decision } : a))
    )
    setExpandedId(null)
  }

  return (
    <div className="pm-ngo-page">
      <Navbar variant="light" />

      <section className="pm-ngo-hero">
        <div className="container-pm">
          <p className="eyebrow pm-ngo-hero__eyebrow">NGO dashboard</p>
          <h1 className="pm-ngo-hero__title">{user.full_name}</h1>
          <p className="pm-ngo-hero__sub">
            Review volunteer applications from your area before they're able to claim cases.
          </p>
          {!user.is_verified && (
            <p className="pm-ngo-pending-note">
              Your NGO account is still pending approval from the PawMap team. You can preview
              this dashboard, but decisions won't be saved until you're verified.
            </p>
          )}
        </div>
      </section>

      <section className="pm-ngo-stats">
        <div className="container-pm pm-ngo-stats__grid">
          <div className="pm-ngo-stat">
            <span className="pm-ngo-stat__value">{pending.length}</span>
            <span className="pm-ngo-stat__label">Pending review</span>
          </div>
          <div className="pm-ngo-stat">
            <span className="pm-ngo-stat__value">
              {applications.filter((a) => a.status === 'approved').length}
            </span>
            <span className="pm-ngo-stat__label">Approved volunteers</span>
          </div>
          <div className="pm-ngo-stat">
            <span className="pm-ngo-stat__value">
              {applications.filter((a) => a.status === 'rejected').length}
            </span>
            <span className="pm-ngo-stat__label">Rejected</span>
          </div>
        </div>
      </section>

      <section className="pm-ngo-list">
        <div className="container-pm">
          <h2 className="pm-ngo-section-title">Pending applications</h2>

          {pending.length === 0 ? (
            <div className="pm-ngo-empty">
              <p>No pending applications right now.</p>
            </div>
          ) : (
            <div className="pm-ngo-apps">
              {pending.map((a) => (
                <article key={a.id} className="pm-ngo-app">
                  <button
                    type="button"
                    className="pm-ngo-app__summary"
                    onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                  >
                    <div>
                      <h3>{a.fullName}</h3>
                      <p className="pm-ngo-app__meta">{a.email} · Applied {timeAgo(a.appliedAt)}</p>
                    </div>
                    <span className="pm-ngo-app__chevron">{expandedId === a.id ? '−' : '+'}</span>
                  </button>

                  {expandedId === a.id && (
                    <div className="pm-ngo-app__details">
                      <div className="pm-ngo-app__field">
                        <span>Phone</span>
                        <p>{a.phone}</p>
                      </div>
                      <div className="pm-ngo-app__field">
                        <span>Availability</span>
                        <p>{a.availability}</p>
                      </div>
                      <div className="pm-ngo-app__field">
                        <span>Experience</span>
                        <p>{a.experience || 'Not provided'}</p>
                      </div>
                      <div className="pm-ngo-app__field">
                        <span>Why they want to volunteer</span>
                        <p>{a.reason}</p>
                      </div>

                      <div className="pm-ngo-app__actions">
                        <button
                          type="button"
                          className="btn-pm btn-pm--orange"
                          onClick={() => decide(a.id, 'approved')}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="pm-ngo-reject"
                          onClick={() => decide(a.id, 'rejected')}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {reviewed.length > 0 && (
            <>
              <h2 className="pm-ngo-section-title pm-ngo-section-title--reviewed">Recently reviewed</h2>
              <div className="pm-ngo-reviewed-list">
                {reviewed.map((a) => (
                  <div key={a.id} className="pm-ngo-reviewed-row">
                    <span>{a.fullName}</span>
                    <span className={`pm-ngo-status pm-ngo-status--${a.status}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}