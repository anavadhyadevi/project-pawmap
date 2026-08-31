import { useMemo, useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { LockKeyhole, MapPin, Siren } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { reverseGeocode } from '../lib/geocode.js'
import './volunteerDashboard.css'

// Fix leaflet icon loading issue in Vite
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

const API = 'http://localhost:8000/api'

const SEVERITY_LABEL = { 1: 'Low', 2: 'Low', 3: 'Medium', 4: 'High / SOS', 5: 'High / SOS' }
const SEVERITY_CLASS  = { 1: 'low', 2: 'low', 3: 'medium', 4: 'high', 5: 'high' }

// map your Django status to sreya's CSS status
const STATUS_MAP = {
  'Open':        'reported',
  'In_Progress': 'in_progress',
  'On_Site':     'on_site',
  'Resolved':    'resolved',
  'Escalated':   'escalated',
  'Unresolved':  'unresolved',
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(diffMs / 3600000)
  if (hrs < 24) return `${hrs} hr ago`
  return `${Math.round(hrs / 24)} day ago`
}

// convert Django case to the shape sreya's UI expects
function adaptCase(c) {
  return {
    id:             c.case_id,
    species:        c.species,
    severity:       c.severity,
    severityLabel:  SEVERITY_LABEL[c.severity] || 'Medium',
    severityClass:  SEVERITY_CLASS[c.severity] || 'medium',
    injuryType:     c.injury_type || 'No injury details provided',
    aggressionLevel: c.aggression_level,
    location:       c.ward || `${c.latitude}, ${c.longitude}`,
    ward:           c.ward || 'Unknown',
    latitude:       parseFloat(c.latitude),
    longitude:      parseFloat(c.longitude),
    distanceKm:     '—',   // calculate later with real geolocation
    reportedAt:     c.created_at,
    status:         STATUS_MAP[c.status] || 'reported',
    photo:          c.photo
                      ? c.photo
                      : 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop',
    volunteerId:    c.volunteer,
    volunteerName:  c.volunteer_name,
  }
}

function CasePopup({ c }) {
  const [address, setAddress] = useState(c.ward && c.ward !== 'Unknown' ? c.ward : 'Loading location...')

  useEffect(() => {
    if (c.ward && c.ward !== 'Unknown') return
    if (!c.latitude || !c.longitude) return
    reverseGeocode(c.latitude, c.longitude).then(setAddress)
  }, [c])

  return (
    <div style={{ fontSize: '13px' }}>
      <strong>{c.id}</strong><br />
      <strong>Species:</strong> {c.species}<br />
      <strong>Severity:</strong> {c.severityLabel}<br />
      <strong>Location:</strong> {address}
    </div>
  )
}

export default function VolunteerDashboard() {
  const { user, accessToken, isLoggedIn, loading: authLoading } = useAuth()
  const [cases, setCases]     = useState([])
  const [vrsScore, setVrsScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [claiming, setClaiming] = useState(null)
  const [claimedCases, setClaimedCases] = useState([])

  const fetchCases = useCallback(async () => {
    try {
      const res = await fetch(`${API}/cases/`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      })
      const data = await res.json()
      // DRF pagination wraps results in { count, results }
      const results = data.results ?? data
      setCases(results.map(adaptCase))
    } catch (err) {
      setError('Could not load cases. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  const fetchVrsScore = useCallback(async () => {
    if (!accessToken) return
    try {
      const res = await fetch(`${API}/volunteers/vrs/`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setVrsScore(data.vrs_score ? parseFloat(data.vrs_score) : null)
      }
    } catch {
      // Ignore score loading failure
    }
  }, [accessToken])

  const fetchClaimedCases = useCallback(async () => {
    if (!accessToken) return
    try {
      const res = await fetch(`${API}/cases/my-volunteer-cases/`, { headers: { Authorization: `Bearer ${accessToken}` } })
      if (!res.ok) throw new Error('Could not load claimed cases.')
      const data = await res.json()
      setClaimedCases((data.results ?? data).map(adaptCase))
    } catch (err) {
      setError(err.message)
    }
  }, [accessToken])

  useEffect(() => {
    fetchCases()
    fetchVrsScore()
    fetchClaimedCases()
    // poll every 30 seconds for new cases
    const interval = setInterval(fetchCases, 30000)
    return () => clearInterval(interval)
  }, [fetchCases, fetchVrsScore, fetchClaimedCases])

  // Hooks must run in the same order on every render. Authentication is
  // restored asynchronously after a refresh, so this needs to be above the
  // auth/loading returns below.
  const feed = useMemo(
    () =>
      cases
        .filter((c) => c.status === 'reported')
        .filter((c) => {
          if (severityFilter === 'all') return true
          if (severityFilter === 'high')   return c.severity >= 4
          if (severityFilter === 'medium') return c.severity === 3
          if (severityFilter === 'low')    return c.severity <= 2
          return true
        })
        .sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt)),
    [cases, severityFilter]
  )

  if (authLoading) return null
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (user?.role !== 'Volunteer') return <Navigate to="/volunteer" replace />

  const myCases    = cases.filter((c) => ['in_progress', 'on_site'].includes(c.status) && c.volunteerId === user?.id)
  const activeWards = new Set(myCases.map((c) => c.ward))

  function canClaim(targetCase) {
    if (myCases.length === 0) return true
    return activeWards.has(targetCase.ward)
  }

  async function claimCase(caseId) {
    const target = cases.find((c) => c.id === caseId)
    if (!target || !canClaim(target)) return
    setClaiming(caseId)
    try {
      const res = await fetch(`${API}/cases/${caseId}/claim/`, {
        method:  'PATCH',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ note: 'On my way!' }),
      })
      if (res.ok) {
        await Promise.all([fetchCases(), fetchClaimedCases()])
      } else {
        const data = await res.json()
        alert(data.error || 'Could not claim case.')
      }
    } catch {
      alert('Could not connect to server.')
    } finally {
      setClaiming(null)
    }
  }

  async function updateStatus(caseId, newStatus) {
    // map sreya's status back to Django status
    const djangoStatus = {
      'on_site':  'On_Site',
      'resolved': 'Resolved',
      'escalated': 'Escalated',
    }[newStatus]

    if (!djangoStatus) return

    try {
      const res = await fetch(`${API}/cases/${caseId}/status/`, {
        method:  'PATCH',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: djangoStatus }),
      })
      if (res.ok) {
        await Promise.all([fetchCases(), fetchClaimedCases()])
      } else {
        const data = await res.json()
        alert(data.error || 'Could not update status.')
      }
    } catch {
      alert('Could not connect to server.')
    }
  }

  if (loading) return (
    <div className="pm-vd-page">
      <Navbar variant="light" />
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#6b7280' }}>
        Loading cases...
      </div>
    </div>
  )

  return (
    <div className="pm-vd-page">
      <Navbar variant="light" />

      <section className="pm-vd-hero">
        <div className="container-pm">
          <div className="pm-vd-hero__row">
            <div>
              <p className="eyebrow pm-vd-hero__eyebrow">Volunteer dashboard</p>
              <h1 className="pm-vd-hero__title">
                Hi, {user?.full_name?.split(' ')[0]} — here's what's nearby.
              </h1>
            </div>
            {user?.is_verified && (
              <div className="pm-vd-reliability">
                <span className="pm-vd-reliability__value">
                  {vrsScore !== null ? `${(vrsScore * 100).toFixed(0)}%` : '—'}
                </span>
                <span className="pm-vd-reliability__label">Reliability score</span>
              </div>
            )}
          </div>
          {!user?.is_verified ? (
            <p className="pm-vd-pending-note">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{marginRight: 6, verticalAlign: 'middle'}}>
                <circle cx="8" cy="8" r="8" fill="#f59e0b"/>
                <path d="M8 4.5V8.5M8 10.5V11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Your volunteer application is pending NGO approval. You can preview cases but claiming is locked.
            </p>
          ) : (
            <p className="pm-vd-verified-note">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{marginRight: 6, verticalAlign: 'middle'}}>
                <circle cx="8" cy="8" r="8" fill="#16a34a"/>
                <path d="M4.5 8L7 10.5L11.5 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              You're a verified volunteer — full access unlocked.
            </p>
          )}
          {error && <p style={{ color: '#dc2626', marginTop: 8 }}>{error}</p>}
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
                    <span className={`pm-vd-badge pm-vd-badge--${c.severityClass}`}>
                      {c.severityLabel}
                    </span>
                  </div>
                  <div className="pm-vd-card__body">
                    <div className="pm-vd-card__row">
                      <h3>{c.species} · {c.id}</h3>
                      <span className="pm-vd-status">{c.status.replace('_', ' ')}</span>
                    </div>
                    <p className="pm-vd-card__meta"><MapPin size="1em" aria-hidden="true" /> {c.location}</p>
                    <p className="pm-vd-card__injury">{c.injuryType}</p>
                    <div className="pm-vd-card__actions">
                      {c.status === 'in_progress' && (
                        <button type="button"
                          className="btn-pm btn-pm--outline-light btn-pm--full"
                          onClick={() => updateStatus(c.id, 'on_site')}>
                          Mark as On Site
                        </button>
                      )}
                      {c.status === 'on_site' && (
                        <button type="button"
                          className="btn-pm btn-pm--orange btn-pm--full"
                          onClick={() => updateStatus(c.id, 'resolved')}>
                          Mark Resolved
                        </button>
                      )}
                      {c.severity >= 4 && c.status !== 'resolved' && (
                        <button type="button"
                          className="pm-vd-sos"
                          onClick={() => updateStatus(c.id, 'escalated')}>
                          <Siren size="1em" aria-hidden="true" /> Escalate to SOS
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

      {claimedCases.length > 0 && (
        <section className="pm-vd-mine">
          <div className="container-pm">
            <h2 className="pm-vd-section-title">Your claimed cases</h2>
            <div className="pm-vd-grid">
              {claimedCases.map((c) => (
                <article key={c.id} className="pm-vd-card pm-vd-card--mine">
                  <div className="pm-vd-card__body">
                    <div className="pm-vd-card__row"><h3>{c.species} · {c.id}</h3><span className="pm-vd-status">{c.status.replace('_', ' ')}</span></div>
                    <p className="pm-vd-card__meta"><MapPin size="1em" aria-hidden="true" /> {c.location}</p>
                    <p className="pm-vd-card__injury">{c.injuryType}</p>
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
          <p className="pm-vd-atomic-note">
            <LockKeyhole size="1em" aria-hidden="true" /> Claims are atomic — the first volunteer to hit "Claim" locks the case immediately.
          </p>

          {/* Interactive Map */}
          {feed.length > 0 && (
            <div style={{ height: '300px', width: '100%', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: '24px', zIndex: 1 }}>
              <MapContainer
                center={[12.9716, 77.5946]}
                zoom={12}
                maxBounds={[[12.7, 77.3], [13.2, 77.9]]}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                />
                {feed
                  .filter(c => c.latitude && c.longitude)
                  .map((c) => (
                    <Marker key={c.id} position={[c.latitude, c.longitude]}>
                      <Popup>
                        <CasePopup c={c} />
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>
            </div>
          )}

          <div className="pm-vd-feed__head">
            <h2 className="pm-vd-section-title">
              Reported near you ({feed.length} open)
            </h2>
            <div className="pm-chip-row">
              {['all', 'high', 'medium', 'low'].map((s) => (
                <button key={s} type="button"
                  className={`pm-chip ${severityFilter === s ? 'pm-chip--active' : ''}`}
                  onClick={() => setSeverityFilter(s)}>
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
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
                    <img src={c.photo} alt={c.species}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop'
                      }}/>
                    <span className={`pm-vd-badge pm-vd-badge--${c.severityClass}`}>
                      {c.severityLabel}
                    </span>
                  </div>
                  <div className="pm-vd-card__body">
                    <div className="pm-vd-card__row">
                      <h3>{c.species} · {c.id}</h3>
                      <span className="pm-vd-time">{timeAgo(c.reportedAt)}</span>
                    </div>
                    <p className="pm-vd-card__meta"><MapPin size="1em" aria-hidden="true" /> {c.location}</p>
                    <p className="pm-vd-card__injury">{c.injuryType}</p>
                    <button type="button"
                      className="btn-pm btn-pm--orange btn-pm--full"
                      disabled={!user?.is_verified || !canClaim(c) || claiming === c.id}
                      onClick={() => claimCase(c.id)}>
                      {claiming === c.id
                        ? 'Claiming...'
                        : !user?.is_verified
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
