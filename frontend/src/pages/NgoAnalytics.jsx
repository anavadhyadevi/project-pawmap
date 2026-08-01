import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { NGO_SUMMARY, VOLUNTEER_ACTIVITY, CASES_BY_WARD } from '../data/ngoStats.js'
import { HOTSPOTS } from '../data/hotspots.js'
import './ngoAnalytics.css'
import './analytics.css'

const maxWard = Math.max(...CASES_BY_WARD.map((w) => w.count))

export default function NgoAnalytics() {
  const { user, isLoggedIn } = useAuth()

  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (user.role !== 'NGO_Admin') return <Navigate to="/analytics" replace />

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
          {NGO_SUMMARY.map((s) => (
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
                {VOLUNTEER_ACTIVITY.map((v) => (
                  <tr key={v.name}>
                    <td>{v.name}</td>
                    <td>{v.casesResolved}</td>
                    <td>{v.avgResponseMin} min</td>
                    <td>★ {v.reliability.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pm-chart-card">
            <h3>Cases by ward</h3>
            <div className="pm-bar-chart">
              {CASES_BY_WARD.map((w) => (
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
          </div>
        </div>
      </section>

      <section className="pm-hotspots">
        <div className="container-pm">
          <p className="eyebrow pm-hotspots__eyebrow">Geospatial intelligence</p>
          <h2 className="pm-hotspots__title">Hotspots in your coverage area.</h2>
          <p className="pm-hotspots__sub">
            DBSCAN clusters over your volunteers' case history — useful for deciding where to
            recruit more volunteers or focus outreach.
          </p>
          <div className="pm-hotspots__grid">
            {HOTSPOTS.map((h, i) => (
              <div key={h.id} className="pm-hotspot-card">
                <span className="pm-hotspot-card__rank">#{i + 1}</span>
                <h3>{h.ward}</h3>
                <p className="pm-hotspot-card__count">{h.caseCount} cases</p>
                <div className="pm-hotspot-card__meta">
                  <span>~{h.radiusM}m radius</span>
                  <span>Mostly {h.dominantSpecies}</span>
                  <span className={`pm-hotspot-card__severity pm-hotspot-card__severity--${h.avgSeverity.toLowerCase()}`}>
                    {h.avgSeverity} severity
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}