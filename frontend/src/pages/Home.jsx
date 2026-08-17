import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { Camera, Home as HomeIcon, MapPin, PawPrint, Siren } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { reverseGeocode } from '../lib/geocode.js'
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

function createStatusIcon(status) {
  let color = '#9ca3af' // Grey
  if (status === 'Open') color = '#f97316' // Orange
  else if (status === 'In_Progress' || status === 'On_Site') color = '#2563eb' // Blue
  else if (status === 'Resolved') color = '#10b981' // Green
  else if (status === 'Escalated') color = '#dc2626' // SOS Red

  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
    className: 'custom-status-marker',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  })
}

function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000)
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return `${Math.round(hrs / 24)} day ago`
}

function CaseLocation({ lat, lon, ward, index }) {
  const [address, setAddress] = useState(ward || '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (ward) return
    if (!lat || !lon) return
    
    // Only auto-geocode the first 5 items to respect API rate limits
    if (index < 5) {
      setLoading(true)
      const timer = setTimeout(() => {
        reverseGeocode(parseFloat(lat), parseFloat(lon))
          .then((addr) => {
            setAddress(addr)
            setLoading(false)
          })
          .catch(() => setLoading(false))
      }, index * 1500)
      return () => clearTimeout(timer)
    }
  }, [lat, lon, ward, index])

  if (address) {
    return <span><MapPin size="1em" aria-hidden="true" /> {address}</span>
  }

  return (
    <span>
      <MapPin size="1em" aria-hidden="true" /> {parseFloat(lat).toFixed(4)}, {parseFloat(lon).toFixed(4)}
      {loading ? (
        <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '6px' }}>(loading...)</span>
      ) : (
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            reverseGeocode(parseFloat(lat), parseFloat(lon))
              .then((addr) => {
                setAddress(addr)
                setLoading(false)
              })
              .catch(() => setLoading(false))
          }}
          style={{
            background: 'none', border: 'none', padding: '0',
            color: 'var(--pm-orange, #f97316)', textDecoration: 'underline',
            fontSize: '11px', marginLeft: '6px', cursor: 'pointer'
          }}
        >
          Show address
        </button>
      )}
    </span>
  )
}

export default function Home() {
  const { user, isLoggedIn, accessToken, loading: authLoading } = useAuth()
  const [myCases, setMyCases]   = useState([])
  const [loading, setLoading]   = useState(false)

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

  if (authLoading) return null
  if (isLoggedIn && user?.role === 'NGO_Admin')  return <Navigate to="/ngo/dashboard" replace />
  if (isLoggedIn && user?.role === 'Volunteer')  return <Navigate to="/volunteer/dashboard" replace />

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
              <Camera size="1em" aria-hidden="true" /> Report a Stray
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
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {myCases.map((c, i) => {
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
                              <PawPrint size={22} aria-hidden="true" />
                            </div>
                          )}
                          <div>
                            <p style={{ fontWeight: 600, fontSize: 14, color: '#111', marginBottom: 2 }}>
                              {c.species} · {c.case_id}
                            </p>
                            <p style={{ fontSize: 12, color: '#6b7280' }}>
                              <CaseLocation lat={c.latitude} lon={c.longitude} ward={c.ward_name || c.ward} index={i} /> · {timeAgo(c.created_at)}
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

                <div style={{ height: '350px', width: '100%', borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb', zIndex: 1 }}>
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
                    {myCases
                      .filter(c => c.latitude && c.longitude)
                      .map(c => (
                        <Marker
                          key={c.case_id}
                          position={[parseFloat(c.latitude), parseFloat(c.longitude)]}
                          icon={createStatusIcon(c.status)}
                        >
                          <Popup>
                            <div style={{ fontSize: '13px' }}>
                              <strong>{c.case_id}</strong><br />
                              <strong>Species:</strong> {c.species}<br />
                              <strong>Status:</strong> {c.status.replace('_', ' ')}<br />
                              {c.ward_name && <><strong>Ward:</strong> {c.ward_name}</>}
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                  </MapContainer>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* WHY PAWMAP */}
      <section className="pm-why">
        <div className="container-pm pm-why__grid">
          <div className="pm-why__card">
            <span className="pm-why__icon" aria-hidden="true"><MapPin size="1em" /></span>
            <h3>Spot it, report it</h3>
            <p>Drop a pin, add a photo, and a note on severity — dispatch starts in seconds.</p>
          </div>
          <div className="pm-why__card">
            <span className="pm-why__icon" aria-hidden="true"><Siren size="1em" /></span>
            <h3>Nearest volunteer, notified</h3>
            <p>PawMap routes every case to the closest verified volunteer, ranked by reliability.</p>
          </div>
          <div className="pm-why__card">
            <span className="pm-why__icon" aria-hidden="true"><HomeIcon size="1em" /></span>
            <h3>From rescue to rehome</h3>
            <p>Medical history, temperament, and adoption status stay linked to every animal.</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
