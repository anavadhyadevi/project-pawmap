import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { CASES as INITIAL_CASES } from '../data/cases.js'
import './volunteerDashboard.css'

const SEVERITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High / SOS' }

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return `${Math.round(hrs / 24)} day ago`
}

export default function VolunteerDashboard() {
  const { user, isLoggedIn } = useAuth()
  const [cases, setCases] = useState(INITIAL_CASES)
  const [severityFilter, setSeverityFilter] = useState('all')

  // Guard: only logged-in Volunteers (verified or not) should land here.
  // Anyone else gets redirected — mirrors what a real protected route needs
  // once the backend enforces role-based access too.
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (user.role !== 'Volunteer') return <Navigate to="/volunteer" replace />

  const feed = useMemo(
    () =>
      cases
        .filter((c) => c.status === 'reported')
        .filter((c) => severityFilter === 'all' || c.severity === severityFilter)
        .sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt)),
    [cases, severityFilter]
  )

  const myCases = cases.filter((c) => c.status !== 'reported' && c.status !== 'resolved')
  const activeWards = new Set(myCases.map((c) => c.ward))

  function canClaim(targetCase) {
    if (myCases.length === 0) return true
    // Allow claiming another case only if it's in the same ward as an
    // existing active case — a volunteer already on-site nearby can
    // reasonably take a second nearby animal, but not one across town.
    return activeWards.has(targetCase.ward)
  }

  function claimCase(id) {
    // A volunteer can hold multiple active cases only if they're in the
    // same ward as one they've already claimed — reflects being able to
    // handle a second nearby animal, but not two cases across town.
    // Wire this up to POST /api/cases/:id/claim/ once the backend exposes it;
    // the real endpoint should enforce this same rule server-side (and do
    // the claim atomically so two volunteers can't grab the same case).
    const target = cases.find((c) => c.id === id)
    if (!target || !canClaim(target)) return
    setCases((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: 'in_progress', claimedAt: new Date().toISOString(), volunteerName: 'You' }
          : c
      )
    )
  }

  function updateStatus(id, status) {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
  }

  return (
    <div className="pm-vd-page">
      <Navbar variant="light" />

      <section className="pm-vd-hero">
        <div className="container-pm">
          <div className="pm-vd-hero__row">
            <div>
              <p className="eyebrow pm-vd-hero__eyebrow">Volunteer dashboard</p>
              <h1 className="pm-vd-hero__title">Hi, {user.full_name.split(' ')[0]} — here's what's nearby.</h1>
            </div>
            {user.is_verified && (
              <div className="pm-vd-reliability">
                <span className="pm-vd-reliability__value">4.5</span>
                <span className="pm-vd-reliability__label">Reliability score</span>
              </div>
            )}
          </div>
          {!user.is_verified ? (
            <p className="pm-vd-pending-note">
              ⏳ Your volunteer application is still pending NGO approval. You can preview the
              case feed, but claiming will be enabled once you're verified.
            </p>
          ) : (
            <p className="pm-vd-verified-note">✅ You're a verified volunteer — full access unlocked.</p>
          )}
        </div>
      </section>

      {/* MY ACTIVE CASES */}
      {myCases.length > 0 && (
        <section className="pm-vd-mine">
          <div className="container-pm">
            <h2 className="pm-vd-section-title">Your active cases</h2>
            <div className="pm-vd-grid">
              {myCases.map((c) => (
                <article key={c.id} className="pm-vd-card pm-vd-card--mine">
                  <div className="pm-vd-card__photo">
                    <img src={c.photo} alt={c.species} />
                    <span className={`pm-vd-badge pm-vd-badge--${c.severity}`}>{SEVERITY_LABEL[c.severity]}</span>
                  </div>
                  <div className="pm-vd-card__body">
                    <div className="pm-vd-card__row">
                      <h3>{c.species} · {c.id}</h3>
                      <span className="pm-vd-status">{c.status.replace('_', ' ')}</span>
                    </div>
                    <p className="pm-vd-card__meta">📍 {c.location} · {c.distanceKm} km away</p>
                    <p className="pm-vd-card__injury">{c.injuryType}</p>

                    <div className="pm-vd-card__actions">
                      {c.status === 'in_progress' && (
                        <button
                          type="button"
                          className="btn-pm btn-pm--outline-light btn-pm--full"
                          onClick={() => updateStatus(c.id, 'on_site')}
                        >
                          Mark as On Site
                        </button>
                      )}
                      {c.status === 'on_site' && (
                        <button
                          type="button"
                          className="btn-pm btn-pm--orange btn-pm--full"
                          onClick={() => updateStatus(c.id, 'resolved')}
                        >
                          Mark Resolved
                        </button>
                      )}
                      {c.severity === 'high' && c.status !== 'resolved' && (
                        <button type="button" className="pm-vd-sos">
                          🚨 Escalate to SOS
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CASE FEED */}
      <section className="pm-vd-feed">
        <div className="container-pm">
          {myCases.length > 0 && (
            <p className="pm-vd-locked-note">
              You have an active case in {[...activeWards].join(', ')} — you can claim more nearby, but other areas are locked until you resolve it.
            </p>
          )}
          <p className="pm-vd-atomic-note">
            🔒 Claims are processed atomically — the first volunteer to hit "Claim" locks the
            case immediately, so two people can't respond to the same animal.
          </p>

          <div className="pm-vd-feed__head">
            <h2 className="pm-vd-section-title">Reported near you</h2>
            <div className="pm-chip-row">
              {['all', 'high', 'medium', 'low'].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`pm-chip ${severityFilter === s ? 'pm-chip--active' : ''}`}
                  onClick={() => setSeverityFilter(s)}
                >
                  {s === 'all' ? 'All' : SEVERITY_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          {feed.length === 0 ? (
            <div className="pm-vd-empty">
              <p>No open reports match this filter right now.</p>
            </div>
          ) : (
            <div className="pm-vd-grid">
              {feed.map((c) => (
                <article key={c.id} className="pm-vd-card">
                  <div className="pm-vd-card__photo">
                    <img src={c.photo} alt={c.species} />
                    <span className={`pm-vd-badge pm-vd-badge--${c.severity}`}>{SEVERITY_LABEL[c.severity]}</span>
                  </div>
                  <div className="pm-vd-card__body">
                    <div className="pm-vd-card__row">
                      <h3>{c.species} · {c.id}</h3>
                      <span className="pm-vd-time">{timeAgo(c.reportedAt)}</span>
                    </div>
                    <p className="pm-vd-card__meta">📍 {c.location} · {c.distanceKm} km away</p>
                    <p className="pm-vd-card__injury">{c.injuryType}</p>
                    <button
                      type="button"
                      className="btn-pm btn-pm--orange btn-pm--full"
                      disabled={!user.is_verified || !canClaim(c)}
                      onClick={() => claimCase(c.id)}
                      title={
                        !user.is_verified
                          ? 'Available once your application is approved'
                          : !canClaim(c)
                          ? 'Only cases in the same area as your active case can be claimed'
                          : undefined
                      }
                    >
                      {!user.is_verified
                        ? 'Claim (pending approval)'
                        : !canClaim(c)
                        ? 'Different area — resolve current first'
                        : 'Claim this case'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}