import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './home.css'
const API = 'http://localhost:8000/api'

const STATUS_COLOUR = {
  'Open':        { bg: '#fef9c3', text: '#854d0e', label: 'Open' },
  'In_Progress': { bg: '#dbeafe', text: '#1e40af', label: 'In Progress' },
  'On_Site':     { bg: '#e0f2fe', text: '#0369a1', label: 'On Site' },
  'Resolved':    { bg: '#dcfce7', text: '#166534', label: 'Resolved' },
  'Escalated':   { bg: '#fee2e2', text: '#991b1b', label: 'Escalated — SOS' },
  'Unresolved':  { bg: '#f3f4f6', text: '#374151', label: 'Unresolved' },
}

function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000)
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return `${Math.round(hrs / 24)} day ago`
}

export default function Home() {
  const { user, isLoggedIn, accessToken, loading: authLoading } = useAuth()
  const [myCases, setMyCases]   = useState([])
  const [loading, setLoading]   = useState(false)

  if (authLoading) return null
  if (isLoggedIn && user?.role === 'NGO_Admin')  return <Navigate to="/ngo/dashboard" replace />
  if (isLoggedIn && user?.role === 'Volunteer')  return <Navigate to="/volunteer/dashboard" replace />

  useEffect(() => {
    if (!isLoggedIn || !accessToken) return
    setLoading(true)
    fetch(`${API}/cases/my/`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(r => r.json())
      .then(data => setMyCases(data.results ?? data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isLoggedIn, accessToken])

  return (
    <div className="pm-home">
      <Navbar variant="dark" />

      {/* HERO */}
      <section className="pm-hero">
        <div className="container-pm pm-hero__inner">
          <p className="eyebrow pm-hero__eyebrow">
            <span className="pm-hero__dash" />
            {isLoggedIn
              ? `Welcome back, ${user.full_name.split(' ')[0]}`
              : 'Community-driven rescue · Bengaluru, India'}
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

      {/* MY REPORTS — only shown when logged in as Reporter */}
      {isLoggedIn && user?.role === 'Reporter' && (
        <section className="pm-why" style={{ background: '#fff' }}>
          <div className="container-pm">
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111', marginBottom: 20 }}>
              Your reports
            </h2>
            {loading && (
              <p style={{ color: '#6b7280', fontSize: 14 }}>Loading your cases...</p>
            )}
            {!loading && myCases.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f9fafb', borderRadius: 10, border: '1px dashed #e5e7eb' }}>
                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
                  You haven't reported any strays yet.
                </p>
                <Link to="/report" className="btn-pm btn-pm--orange">
                  Report your first stray
                </Link>
              </div>
            )}
            {!loading && myCases.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {myCases.map(c => {
                  const s = STATUS_COLOUR[c.status] || STATUS_COLOUR['Open']
                  return (
                    <div key={c.case_id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 20px', background: '#fafafa',
                      border: '1px solid #e5e7eb', borderRadius: 10, gap: 16, flexWrap: 'wrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        {c.photo ? (
                          <img src={c.photo} alt={c.species}
                            style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8 }}
                            onError={e => e.target.style.display = 'none'}/>
                        ) : (
                          <div style={{ width: 52, height: 52, borderRadius: 8, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                            🐾
                          </div>
                        )}
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 14, color: '#111', marginBottom: 2 }}>
                            {c.species} · {c.case_id}
                          </p>
                          <p style={{ fontSize: 12, color: '#6b7280' }}>
                            📍 {c.ward || `${c.latitude}, ${c.longitude}`} · {timeAgo(c.created_at)}
                          </p>
                          {c.volunteer_name && (
                            <p style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>
                              Volunteer: {c.volunteer_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <span style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: s.bg, color: s.text
                      }}>
                        {s.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      )}

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