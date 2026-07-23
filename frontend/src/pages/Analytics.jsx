import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './analytics.css'

const SUMMARY = [
  { label: 'Total cases reported', value: '1,204', delta: '+86 this month' },
  { label: 'Cases resolved', value: '972', delta: '81% resolution rate' },
  { label: 'Active volunteers', value: '341', delta: '+12 this month' },
  { label: 'Animals adopted', value: '890', delta: '+54 this month' },
]

const CASES_BY_STATUS = [
  { label: 'Resolved', value: 972, color: 'var(--pm-mint)' },
  { label: 'In progress', value: 156, color: 'var(--pm-orange)' },
  { label: 'Reported', value: 76, color: 'var(--pm-sage)' },
]

const CASES_BY_SPECIES = [
  { label: 'Dogs', value: 62 },
  { label: 'Cats', value: 28 },
  { label: 'Cows', value: 6 },
  { label: 'Other', value: 4 },
]

const maxStatus = Math.max(...CASES_BY_STATUS.map((c) => c.value))

export default function Analytics() {
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

      <section className="pm-analytics-charts">
        <div className="container-pm pm-analytics-charts__grid">
          <div className="pm-chart-card">
            <h3>Cases by status</h3>
            <div className="pm-bar-chart">
              {CASES_BY_STATUS.map((c) => (
                <div key={c.label} className="pm-bar-row">
                  <span className="pm-bar-row__label">{c.label}</span>
                  <div className="pm-bar-row__track">
                    <div
                      className="pm-bar-row__fill"
                      style={{ width: `${(c.value / maxStatus) * 100}%`, background: c.color }}
                    />
                  </div>
                  <span className="pm-bar-row__value">{c.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pm-chart-card">
            <h3>Cases by species</h3>
            <div className="pm-donut-legend">
              {CASES_BY_SPECIES.map((c, i) => (
                <div key={c.label} className="pm-donut-legend__row">
                  <span className={`pm-donut-legend__dot pm-donut-legend__dot--${i}`} />
                  <span className="pm-donut-legend__label">{c.label}</span>
                  <span className="pm-donut-legend__value">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}