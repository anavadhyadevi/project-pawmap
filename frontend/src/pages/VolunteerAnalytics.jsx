import { useEffect, useState, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE_URL } from '../lib/api.js'
import './volunteerAnalytics.css'

export default function VolunteerAnalytics() {
  const { user, accessToken, isLoggedIn, loading: authLoading } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    if (!accessToken) return
    try {
      const [vrsRes, casesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/volunteers/vrs/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).then(r => r.json()),
        fetch(`${API_BASE_URL}/cases/my-volunteer-cases/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).then(r => r.json()),
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

      <Footer />
    </div>
  )
}