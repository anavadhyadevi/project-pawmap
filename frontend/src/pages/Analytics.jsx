import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './analytics.css'

const API = 'http://localhost:8000/api'

export default function Analytics() {
  const [hotspotData, setHotspotData] = useState(null)
  const [casesGeo, setCasesGeo]       = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/analytics/hotspots/`).then(r => r.json()),
      fetch(`${API}/analytics/cases-geo/`).then(r => r.json()),
    ]).then(([hotspots, cases]) => {
      setHotspotData(hotspots)
      setCasesGeo(cases)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  // compute real summary from cases
  const totalCases    = casesGeo.length
  const resolved      = casesGeo.filter(c => c.status === 'Resolved').length
  const inProgress    = casesGeo.filter(c => c.status === 'In_Progress').length
  const open          = casesGeo.filter(c => c.status === 'Open').length
  const resolutionPct = totalCases > 0 ? Math.round((resolved / totalCases) * 100) : 0

  // species breakdown
  const speciesCounts = casesGeo.reduce((acc, c) => {
    acc[c.species] = (acc[c.species] || 0) + 1
    return acc
  }, {})
  const speciesList = Object.entries(speciesCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value, pct: Math.round((value / totalCases) * 100) }))

  const clusters    = hotspotData?.clusters || []
  const noiseCount  = totalCases - clusters.reduce((s, c) => s + c.case_count, 0)
  const maxStatus   = Math.max(resolved, inProgress, open, 1)

  const SUMMARY = [
    { label: 'Total cases reported', value: totalCases, delta: 'all time' },
    { label: 'Cases resolved',       value: resolved,   delta: `${resolutionPct}% resolution rate` },
    { label: 'In progress',          value: inProgress, delta: 'being handled now' },
    { label: 'Hotspots detected',    value: clusters.length, delta: 'by DBSCAN clustering' },
  ]

  return (
    <div className="pm-analytics-page">
      <Navbar variant="light" />

      <section className="pm-analytics-hero">
        <div className="container-pm">
          <p className="eyebrow pm-analytics-hero__eyebrow">Impact data</p>
          <h1 className="pm-analytics-hero__title">PawMap, by the numbers.</h1>
          <p className="pm-analytics-hero__sub">
            A live look at how the community is responding — updated as cases move
            from report to resolution.
          </p>
        </div>
      </section>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#6b7280' }}>
          Loading analytics...
        </div>
      ) : (
        <>
          {/* SUMMARY STATS */}
          <section className="pm-analytics-summary">
            <div className="container-pm pm-analytics-summary__grid">
              {SUMMARY.map((s) => (
                <div key={s.label} className="pm-stat-card">
                  <span className="pm-stat-card__value">{s.value}</span>
                  <span className="pm-stat-card__label">{s.label}</span>
                  <span className="pm-stat-card__delta">{s.delta}</span>
                </div>
              ))}
            </div>
          </section>

          {/* CHARTS */}
          <section className="pm-analytics-charts">
            <div className="container-pm pm-analytics-charts__grid">
              <div className="pm-chart-card">
                <h3>Cases by status</h3>
                <div className="pm-bar-chart">
                  {[
                    { label: 'Resolved',    value: resolved,   color: 'var(--pm-mint)' },
                    { label: 'In progress', value: inProgress, color: 'var(--pm-orange)' },
                    { label: 'Open',        value: open,       color: 'var(--pm-sage)' },
                  ].map((c) => (
                    <div key={c.label} className="pm-bar-row">
                      <span className="pm-bar-row__label">{c.label}</span>
                      <div className="pm-bar-row__track">
                        <div className="pm-bar-row__fill"
                          style={{ width: `${(c.value / maxStatus) * 100}%`, background: c.color }}/>
                      </div>
                      <span className="pm-bar-row__value">{c.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pm-chart-card">
                <h3>Cases by species</h3>
                <div className="pm-donut-legend">
                  {speciesList.map((c, i) => (
                    <div key={c.label} className="pm-donut-legend__row">
                      <span className={`pm-donut-legend__dot pm-donut-legend__dot--${i}`}/>
                      <span className="pm-donut-legend__label">{c.label}</span>
                      <span className="pm-donut-legend__value">{c.pct}% ({c.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* HOTSPOTS */}
          <section className="pm-hotspots">
            <div className="container-pm">
              <p className="eyebrow pm-hotspots__eyebrow">Geospatial intelligence</p>
              <h2 className="pm-hotspots__title">Where strays are being reported most.</h2>
              <p className="pm-hotspots__sub">
                Clusters identified via DBSCAN over reported case coordinates — dense pockets
                of activity flagged automatically.
                {hotspotData && (
                  <span style={{ display: 'block', marginTop: 6, fontSize: 12, color: '#9ca3af' }}>
                    Last run: {hotspotData.run_date} · {hotspotData.total_cases_processed} cases processed ·
                    eps = {hotspotData.eps_m}m · min_samples = {hotspotData.min_samples}
                  </span>
                )}
              </p>

              {clusters.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f9fafb', borderRadius: 10, border: '1px dashed #e5e7eb' }}>
                  <p style={{ color: '#6b7280', fontSize: 14 }}>
                    No hotspots detected yet. Run DBSCAN analysis to generate clusters.
                  </p>
                </div>
              ) : (
                <div className="pm-hotspots__grid">
                  {clusters.map((h, i) => (
                    <div key={h.cluster_label} className="pm-hotspot-card">
                      <span className="pm-hotspot-card__rank">#{i + 1}</span>
                      <h3>Cluster {h.cluster_label + 1}</h3>
                      <p className="pm-hotspot-card__count">{h.case_count} cases</p>
                      <div className="pm-hotspot-card__meta">
                        <span>📍 {parseFloat(h.centroid_lat).toFixed(4)}, {parseFloat(h.centroid_lon).toFixed(4)}</span>
                        <span>Mostly {h.dominant_species}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {noiseCount > 0 && (
                <p className="pm-hotspots__noise">
                  + {noiseCount} reports were too sparse to form a cluster (DBSCAN noise points) — still tracked individually.
                </p>
              )}
            </div>
          </section>
        </>
      )}

      <Footer />
    </div>
  )
}