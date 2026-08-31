import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, PawPrint, Phone, X } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './lostFound.css'

const API = 'http://localhost:8000/api'

export default function LostFound() {
  const [tab, setTab] = useState('lost')
  const [lostPets, setLostPets] = useState([])
  const [foundPets, setFoundPets] = useState([])
  const [loading, setLoading]   = useState(true)
  const [contactItem, setContactItem] = useState(null) // item whose contact info is open

  useEffect(() => {
    Promise.all([
      fetch(`${API}/cases/lost/`).then(r => r.json()),
      fetch(`${API}/cases/found/`).then(r => r.json()),
    ])
      .then(([lost, found]) => {
        setLostPets(lost.results ?? lost)
        setFoundPets(found.results ?? found)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const items = tab === 'lost' ? lostPets : foundPets

  // Toggle: clicking the same item's button closes it; clicking a different item opens it
  function toggleContact(item) {
    const itemId = item.lost_report_id || item.found_report_id
    const openId = contactItem?.lost_report_id || contactItem?.found_report_id
    setContactItem(itemId === openId ? null : item)
  }

  return (
    <div className="pm-lf-page">
      <Navbar variant="light" />

      <section className="pm-lf-hero">
        <div className="container-pm">
          <p className="eyebrow pm-lf-hero__eyebrow">Lost &amp; Found</p>
          <h1 className="pm-lf-hero__title">Help reunite a pet with their family.</h1>
          <p className="pm-lf-hero__sub">
            Browse recent lost and found reports, or file one of your own —
            matching happens automatically off details like microchip ID and location.
          </p>

          <Link to="/lost-found/report" className="btn-pm btn-pm--orange">
            Report a lost or found pet
          </Link>
        </div>
      </section>

      <section className="pm-lf-list">
        <div className="container-pm">
          <div className="pm-lf-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'lost'}
              className={`pm-lf-tab ${tab === 'lost' ? 'pm-lf-tab--active' : ''}`}
              onClick={() => setTab('lost')}
            >
              Lost pets ({lostPets.length})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={tab === 'found'}
              className={`pm-lf-tab ${tab === 'found' ? 'pm-lf-tab--active' : ''}`}
              onClick={() => setTab('found')}
            >
              Found animals ({foundPets.length})
            </button>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '60px 0' }}>
              Loading...
            </p>
          ) : items.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: '#f9fafb',
                borderRadius: 10,
                border: '1px dashed #e5e7eb',
                marginTop: 24
              }}
            >
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
                {tab === 'lost'
                  ? 'No lost pet reports right now.'
                  : 'No found animal reports right now.'}
              </p>

              <Link to="/lost-found/report" className="btn-pm btn-pm--orange">
                File a report
              </Link>
            </div>
          ) : (
            <div className="pm-lf-grid">
              {items.map((item) => {
                const itemId = item.lost_report_id || item.found_report_id
                const openId = contactItem?.lost_report_id || contactItem?.found_report_id
                const isContactOpen = itemId === openId

                return (
                  <article key={itemId} className="pm-lf-card">
                    <div className="pm-lf-card__photo">
                      {item.photo ? (
                        <img src={item.photo} alt={item.pet_name || item.species} loading="lazy"/>
                      ) : (
                        <div style={{ width: '100%', height: 180, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                          <PawPrint size={40} aria-hidden="true" />
                        </div>
                      )}
                      <span className="pm-lf-card__id">
                        {itemId}
                      </span>
                      <span className={`pm-lf-card__status pm-lf-card__status--${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="pm-lf-card__body">
                      <h3>{item.pet_name || `Unnamed ${item.species}`}</h3>
                      <p className="pm-lf-card__meta">
                        {item.species} · {item.breed || 'Unknown breed'}
                      </p>
                      <p className="pm-lf-card__meta">
                        <MapPin size="1em" aria-hidden="true" /> {item.last_seen_location || item.found_location} ·{' '}
                        {tab === 'lost'
                          ? `Last seen ${item.last_seen_date}`
                          : `Found ${item.found_date}`}
                      </p>
                      {item.distinguishing_features && (
                        <p className="pm-lf-card__features">{item.distinguishing_features}</p>
                      )}
                      {item.reward && (
                        <p style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginBottom: 8 }}>
                          Reward: {item.reward}
                        </p>
                      )}

                      {/* Contact button */}
                      <button
                        type="button"
                        className="btn-pm btn-pm--outline-light btn-pm--full"
                        onClick={() => toggleContact(item)}
                      >
                        {tab === 'found'
                          ? 'Found Pet Details'
                          : `Contact ${item.owner_name?.split(' ')[0] || 'Owner'}`}
                      </button>

                      {/* Contact details panel — expands inline when button clicked */}
                      {isContactOpen && (
                        <div style={{
                          marginTop: 10, padding: '12px 14px',
                          background: '#f0fdf4', border: '1px solid #bbf7d0',
                          borderRadius: 8, fontSize: 13, position: 'relative'
                        }}>
                          <button
                            type="button"
                            onClick={() => setContactItem(null)}
                            style={{ position: 'absolute', top: 8, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                            aria-label="Close contact info"
                          >
                            <X size={14} />
                          </button>

                          {tab === 'found' ? (
                            <p style={{ color: '#166534', margin: 0 }}>
                              This pet was reported as found. If you believe
                              this is your pet, please contact the platform
                              to coordinate verification and reunification.
                            </p>
                          ) : (
                            <>
                              <p style={{ fontWeight: 700, marginBottom: 4, color: '#166534' }}>
                                {item.owner_name || 'Unknown'}
                              </p>
                              {item.owner_phone ? (
                                <a
                                  href={`tel:${item.owner_phone}`}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#15803d', fontWeight: 600, textDecoration: 'none' }}
                                >
                                  <Phone size={14} /> {item.owner_phone}
                                </a>
                              ) : (
                                <p style={{ color: '#166534', margin: 0 }}>
                                  Contact info not available — reach out via the platform.
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}