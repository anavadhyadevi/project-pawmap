import { useEffect, useState, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE_URL } from '../lib/api.js'
import './ngoAnalytics.css'
import './analytics.css'

export default function NgoAnalytics() {
  const { user, accessToken, isLoggedIn, loading: authLoading } = useAuth()
  const [data, setData] = useState(null)
  const [hotspots, setHotspots] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!accessToken) return
    try {
      const [summaryRes, hotspotsRes, geoRes] = await Promise.all([
        fetch(`${API_BASE_URL}/analytics/ngo-summary/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/hotspots/`).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/cases-geo/`).then(r => r.json()),
      ])

      const wardCounts = {}
      geoRes.forEach((c) => {
        const wName = c.ward || 'Unknown'
        wardCounts[wName] = (wardCounts[wName] || 0) + 1
      })
      const casesByWard = Object.entries(wardCounts)
        .map(([ward, count]) => ({ ward, count }))
        .sort((a, b) => b.count - a.count)

      setData({
        ...summaryRes,
        cases_by_ward: casesByWard,
      })
      setHotspots(hotspotsRes.clusters ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => { fetchAll() }, [fetchAll])

  if (authLoading) return null
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (user.role !== 'NGO_Admin') return <Navigate to="/analytics" replace />
  
  if (loading || !data) {
    return (
      <div className="pm-ngoa-page">
        <Navbar variant="light" />
        <div style={{ textAlign: 'center', padding: '80px', color: '#6b7280' }}>
          Loading analytics...
        </div>
      </div>
    )
  }

  const maxWard = data.cases_by_ward.length
    ? Math.max(...data.cases_by_ward.map((w) => w.count))
    : 1

  return (
    <div className="pm-ngoa-page">
      <Navbar variant="light" />

      <section className="pm-ngoa-hero">
        <div className="container-pm">
          <p className="eyebrow pm-ngoa-hero__eyebrow">Your organization's impact</p>
          <h1 className="pm-ngoa-hero__title">Analytics for {user.full_name}</h1>
          <p className="pm-ngoa-hero__sub">
            Scoped to volunteers and cases under your NGO — not platform-wide numbers.
          </p>
        </div>
      </section>

      <section className="pm-ngoa-summary">
        <div className="container-pm pm-ngoa-summary__grid">
          {data.summary.map((s) => (
            <div key={s.label} className="pm-stat-card">
              <span className="pm-stat-card__value">{s.value}</span>
              <span className="pm-stat-card__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="pm-ngoa-charts">
        <div className="container-pm pm-ngoa-charts__grid">
          <div className="pm-chart-card">
            <h3>Volunteer activity</h3>
            {data.volunteer_activity.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: 13 }}>No volunteers under your NGO yet.</p>
            ) : (
              <table className="pm-ngoa-table">
                <thead>
                  <tr>
                    <th>Volunteer</th>
                    <th>Cases resolved</th>
                    <th>Avg. response</th>
                    <th>Reliability</th>
                  </tr>
                </thead>
                <tbody>
                  {data.volunteer_activity.map((v) => (
                    <tr key={v.name}>
                      <td>{v.name}</td>
                      <td>{v.casesResolved}</td>
                      <td>{v.avgResponseMin.toFixed(1)} min</td>
                      <td>★ {v.reliability.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="pm-chart-card">
            <h3>Cases by ward</h3>
            {data.cases_by_ward.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: 13 }}>No ward data yet.</p>
            ) : (
              <div className="pm-bar-chart">
                {data.cases_by_ward.map((w) => (
                  <div key={w.ward} className="pm-bar-row">
                    <span className="pm-bar-row__label">{w.ward}</span>
                    <div className="pm-bar-row__track">
                      <div
                        className="pm-bar-row__fill"
                        style={{ width: `${(w.count / maxWard) * 100}%`, background: 'var(--pm-orange)' }}
                      />
                    </div>
                    <span className="pm-bar-row__value">{w.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="pm-hotspots">
        <div className="container-pm">
          <p className="eyebrow pm-hotspots__eyebrow">Geospatial intelligence</p>
          <h2 className="pm-hotspots__title">Hotspots in your coverage area.</h2>
          <p className="pm-hotspots__sub">
            DBSCAN clusters over case history — useful for deciding where to
            recruit more volunteers or focus outreach.
          </p>
          {hotspots.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: 13 }}>No hotspot analysis has been run yet.</p>
          ) : (
            <div className="pm-hotspots__grid">
              {hotspots.map((h, i) => (
                <div key={h.cluster_label} className="pm-hotspot-card">
                  <span className="pm-hotspot-card__rank">#{i + 1}</span>
                  <h3>Cluster {h.cluster_label}</h3>
                  <p className="pm-hotspot-card__count">{h.case_count} cases</p>
                  <div className="pm-hotspot-card__meta">
                    <span>{Number(h.centroid_lat).toFixed(3)}, {Number(h.centroid_lon).toFixed(3)}</span>
                    <span>Mostly {h.dominant_species}</span>
                  </div>
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