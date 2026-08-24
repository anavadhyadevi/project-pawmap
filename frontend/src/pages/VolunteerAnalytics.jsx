import { useEffect, useState, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE_URL } from '../lib/api.js'
import './volunteerAnalytics.css'
import './analytics.css'
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet'
import { MapPin } from 'lucide-react'

export default function VolunteerAnalytics() {
  const { user, accessToken, isLoggedIn, loading: authLoading } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hotspots, setHotspots] = useState([])
  const [hotspotMeta, setHotspotMeta] = useState(null)

  const fetchStats = useCallback(async () => {
    if (!accessToken) return
    try {
      const [vrsRes, casesRes, hotspotsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/volunteers/vrs/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).then(r => r.json()),
        fetch(`${API_BASE_URL}/cases/my-volunteer-cases/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/hotspots/`).then(r => r.json()),
      ])

      const casesList = casesRes.results ?? casesRes ?? []
      const resolvedCount = casesList.filter(c => c.status === 'Resolved').length
      const claimedCount = casesList.length

      const vrsScoreVal = vrsRes.vrs_score ? parseFloat(vrsRes.vrs_score) : 0
      const responseRateVal = vrsRes.response_rate ? parseFloat(vrsRes.response_rate) : 0
      const completionRateVal = vrsRes.completion_rate ? parseFloat(vrsRes.completion_rate) : 0
      const avgResponseVal = vrsRes.avg_response_time_min ? parseFloat(vrsRes.avg_response_time_min) : 0
      
      const speedScore = Math.max(0, 1 - (avgResponseVal / 30))

      const summary = [
        { label: 'Cases resolved', value: resolvedCount },
        { label: 'Cases claimed', value: claimedCount },
        { label: 'Reliability score', value: vrsScoreVal.toFixed(2) },
      ]

      const reliabilityBreakdown = [
        { factor: 'Response rate', score: Math.round(responseRateVal * 100) },
        { factor: 'Completion rate', score: Math.round(completionRateVal * 100) },
        { factor: 'Response speed', score: Math.round(speedScore * 100) },
      ]

      const recentCases = casesList.slice(0, 8).map(c => ({
        id: c.case_id,
        species: c.species,
        location: c.ward_name || 'Bengaluru',
        status: c.status.replace('_', ' ')
      }))

      setStats({
        summary,
        reliabilityBreakdown,
        recentCases
      })
      setHotspots(hotspotsRes.clusters ?? [])
      setHotspotMeta(hotspotsRes)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => { fetchStats() }, [fetchStats])

  if (authLoading) return null
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (user.role !== 'Volunteer') return <Navigate to="/analytics" replace />
  
  if (loading || !stats) {
    return (
      <div className="pm-va-page">
        <Navbar variant="light" />
        <div style={{ textAlign: 'center', padding: '80px', color: '#6b7280' }}>
          Loading your analytics...
        </div>
      </div>
    )
  }

  return (
    <div className="pm-va-page">
      <Navbar variant="light" />

      <section className="pm-va-hero">
        <div className="container-pm">
          <p className="eyebrow pm-va-hero__eyebrow">Your performance</p>
          <h1 className="pm-va-hero__title">Analytics for {user.full_name}</h1>
          <p className="pm-va-hero__sub">
            Personal stats only — not the platform-wide view.
          </p>
        </div>
      </section>

      <section className="pm-va-summary">
        <div className="container-pm pm-va-summary__grid">
          {stats.summary.map((s) => (
            <div key={s.label} className="pm-stat-card">
              <span className="pm-stat-card__value">{s.value}</span>
              <span className="pm-stat-card__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="pm-va-charts">
        <div className="container-pm pm-va-charts__grid">
          <div className="pm-chart-card">
            <h3>Reliability score breakdown</h3>
            <div className="pm-bar-chart">
              {stats.reliabilityBreakdown.map((r) => (
                <div key={r.factor} className="pm-bar-row">
                  <span className="pm-bar-row__label">{r.factor}</span>
                  <div className="pm-bar-row__track">
                    <div
                      className="pm-bar-row__fill"
                      style={{ width: `${r.score}%`, background: 'var(--pm-mint)' }}
                    />
                  </div>
                  <span className="pm-bar-row__value">{r.score}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pm-chart-card">
            <h3>Recent cases</h3>
            {stats.recentCases.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: 13 }}>No cases claimed yet.</p>
            ) : (
              <table className="pm-va-table">
                <thead>
                  <tr>
                    <th>Case</th>
                    <th>Location</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentCases.map((c) => (
                    <tr key={c.id}>
                      <td>{c.species} · {c.id}</td>
                      <td>{c.location}</td>
                      <td>
                        <span className={`pm-va-status pm-va-status--${c.status.toLowerCase().replace(' ', '-')}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      <section className="pm-hotspots">
        <div className="container-pm">
          <p className="eyebrow pm-hotspots__eyebrow">Geospatial intelligence</p>
          <h2 className="pm-hotspots__title">Hotspots in your coverage area.</h2>
          <p className="pm-hotspots__sub">
            DBSCAN clusters over reported case history, helping you understand where rescue demand is concentrated.
            {hotspotMeta && <span style={{ display: 'block', marginTop: 6, fontSize: 12, color: '#9ca3af' }}>Last run: {hotspotMeta.run_date} · {hotspotMeta.total_cases_processed} cases processed</span>}
          </p>
          <div style={{ height: '380px', width: '100%', borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: '28px', zIndex: 1 }}>
            <MapContainer center={[12.9716, 77.5946]} zoom={12} maxBounds={[[12.7, 77.3], [13.2, 77.9]]} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors' />
              {hotspots.map((h) => (
                <Circle key={h.cluster_label} center={[parseFloat(h.centroid_lat), parseFloat(h.centroid_lon)]} radius={150 + h.case_count * 20} pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.35, weight: 2 }}>
                  <Popup><strong>Cluster {h.cluster_label + 1}</strong><br />Cases: {h.case_count}<br />Dominant species: {h.dominant_species}</Popup>
                </Circle>
              ))}
            </MapContainer>
          </div>
          {hotspots.length === 0 ? <p style={{ color: '#6b7280', fontSize: 13 }}>No hotspot analysis has been run yet.</p> : (
            <div className="pm-hotspots__grid">{hotspots.map((h, i) => <div key={h.cluster_label} className="pm-hotspot-card"><span className="pm-hotspot-card__rank">#{i + 1}</span><h3>Cluster {h.cluster_label + 1}</h3><p className="pm-hotspot-card__count">{h.case_count} cases</p><div className="pm-hotspot-card__meta"><span><MapPin size="1em" aria-hidden="true" /> {Number(h.centroid_lat).toFixed(4)}, {Number(h.centroid_lon).toFixed(4)}</span><span>Mostly {h.dominant_species}</span></div></div>)}</div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
