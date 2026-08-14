import { useMemo, useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './ngoDashboard.css'

const API = 'http://localhost:8000/api'

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const hrs = Math.round(diffMs / 3600000)
  if (hrs < 24) return `${hrs} hr ago`
  return `${Math.round(hrs / 24)} day ago`
}

export default function NgoDashboard() {
  const { user, accessToken, isLoggedIn } = useAuth()

  const [cases, setCases]         = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [listings, setListings]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [verifying, setVerifying]   = useState(null)

  const fetchAll = useCallback(async () => {
    if (!accessToken) return
    try {
      const headers = { Authorization: `Bearer ${accessToken}` }
      const [casesRes, volsRes, listingsRes] = await Promise.all([
        fetch(`${API}/cases/`, { headers }).then(r => r.json()),
        fetch(`${API}/users/volunteers/`, { headers }).then(r => r.json()),
        fetch(`${API}/adoption/`, { headers }).then(r => r.json()),
      ])
      setCases(casesRes.results ?? casesRes)
      setVolunteers(volsRes.results ?? volsRes ?? [])
      setListings(listingsRes.results ?? listingsRes)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => { fetchAll() }, [fetchAll])

  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (user?.role !== 'NGO_Admin') return <Navigate to="/" replace />

  const pending  = volunteers.filter(v => !v.is_verified)
  const approved = volunteers.filter(v => v.is_verified)

  // case stats
  const totalCases    = cases.length
  const openCases     = cases.filter(c => c.status === 'Open').length
  const resolvedCases = cases.filter(c => c.status === 'Resolved').length
  const activeListings = listings.filter(l => l.status === 'Active').length

  async function approveVolunteer(userId) {
    setVerifying(userId)
    try {
      const res = await fetch(`${API}/users/${userId}/verify/`, {
        method:  'PATCH',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ is_verified: true }),
      })
      if (res.ok) {
        setVolunteers(prev =>
          prev.map(v => v.id === userId ? { ...v, is_verified: true } : v)
        )
        setExpandedId(null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setVerifying(null)
    }
  }

  if (loading) return (
    <div className="pm-ngo-page">
      <Navbar variant="light" />
      <div style={{ textAlign: 'center', padding: '80px', color: '#6b7280' }}>
        Loading dashboard...
      </div>
    </div>
  )

  return (
    <div className="pm-ngo-page">
      <Navbar variant="light" />

      <section className="pm-ngo-hero">
        <div className="container-pm">
          <p className="eyebrow pm-ngo-hero__eyebrow">NGO dashboard</p>
          <h1 className="pm-ngo-hero__title">{user?.full_name}</h1>
          <p className="pm-ngo-hero__sub">
            Review volunteer applications and monitor rescue activity in real time.
          </p>
          {!user?.is_verified && (
            <p className="pm-ngo-pending-note">
              Your NGO account is still pending approval from the PawMap team. You can
              preview this dashboard, but decisions won't be saved until you're verified.
            </p>
          )}
        </div>
      </section>

      {/* STATS */}
      <section className="pm-ngo-stats">
        <div className="container-pm pm-ngo-stats__grid">
          <div className="pm-ngo-stat">
            <span className="pm-ngo-stat__value">{pending.length}</span>
            <span className="pm-ngo-stat__label">Pending review</span>
          </div>
          <div className="pm-ngo-stat">
            <span className="pm-ngo-stat__value">{approved.length}</span>
            <span className="pm-ngo-stat__label">Approved volunteers</span>
          </div>
          <div className="pm-ngo-stat">
            <span className="pm-ngo-stat__value">{totalCases}</span>
            <span className="pm-ngo-stat__label">Total cases</span>
          </div>
          <div className="pm-ngo-stat">
            <span className="pm-ngo-stat__value">{openCases}</span>
            <span className="pm-ngo-stat__label">Open cases</span>
          </div>
          <div className="pm-ngo-stat">
            <span className="pm-ngo-stat__value">{resolvedCases}</span>
            <span className="pm-ngo-stat__label">Resolved</span>
          </div>
          <div className="pm-ngo-stat">
            <span className="pm-ngo-stat__value">{activeListings}</span>
            <span className="pm-ngo-stat__label">Active adoption listings</span>
          </div>
        </div>
      </section>

      {/* VOLUNTEER APPLICATIONS */}
      <section className="pm-ngo-list">
        <div className="container-pm">
          <h2 className="pm-ngo-section-title">Pending applications</h2>
          {pending.length === 0 ? (
            <div className="pm-ngo-empty">
              <p>No pending applications right now.</p>
            </div>
          ) : (
            <div className="pm-ngo-apps">
              {pending.map((v) => (
                <article key={v.user_id} className="pm-ngo-app">
                  <button type="button" className="pm-ngo-app__summary"
                    onClick={() => setExpandedId(expandedId === v.user_id ? null : v.user_id)}>
                    <div>
                      <h3>{v.full_name}</h3>
                      <p className="pm-ngo-app__meta">
                        {v.email} · {v.phone || 'No phone'}
                      </p>
                    </div>
                    <span className="pm-ngo-app__chevron">
                      {expandedId === v.user_id ? '−' : '+'}
                    </span>
                  </button>
                  {expandedId === v.user_id && (
                    <div className="pm-ngo-app__details">
                      <div className="pm-ngo-app__field">
                        <span>Email</span>
                        <p>{v.email}</p>
                      </div>
                      <div className="pm-ngo-app__field">
                        <span>Phone</span>
                        <p>{v.phone || 'Not provided'}</p>
                      </div>
                      <div className="pm-ngo-app__field">
                        <span>Role</span>
                        <p>{v.role}</p>
                      </div>
                      <div className="pm-ngo-app__actions">
                        <button type="button" className="btn-pm btn-pm--orange"
                          disabled={verifying === v.id}
                          onClick={() => approveVolunteer(v.id)}>
                          {verifying === v.id ? 'Approving...' : 'Approve'}
                        </button>
                        <button type="button" className="pm-ngo-reject"
                          onClick={() => setExpandedId(null)}>
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {/* APPROVED VOLUNTEERS */}
          {approved.length > 0 && (
            <>
              <h2 className="pm-ngo-section-title pm-ngo-section-title--reviewed">
                Approved volunteers
              </h2>
              <div className="pm-ngo-reviewed-list">
                {approved.map((v) => (
                  <div key={v.user_id} className="pm-ngo-reviewed-row">
                    <span>{v.full_name} · {v.email}</span>
                    <span className="pm-ngo-status pm-ngo-status--approved">approved</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* RECENT CASES */}
          <h2 className="pm-ngo-section-title pm-ngo-section-title--reviewed">
            Recent cases
          </h2>
          {cases.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: 14 }}>No cases yet.</p>
          ) : (
            <div className="pm-ngo-reviewed-list">
              {[...cases]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 8)
                .map(c => (
                  <div key={c.case_id} className="pm-ngo-reviewed-row">
                    <span>
                      {c.case_id} · {c.species}
                      {c.volunteer_name && ` → ${c.volunteer_name}`}
                    </span>
                    <span className={`pm-ngo-status pm-ngo-status--${
                      c.status === 'Resolved' ? 'approved' :
                      c.status === 'Escalated' ? 'rejected' : 'pending'
                    }`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}