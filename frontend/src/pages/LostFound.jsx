import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { LOST_PETS, FOUND_ANIMALS } from '../data/lostFound.js'
import './lostFound.css'

export default function LostFound() {
  const [tab, setTab] = useState('lost')
  const items = tab === 'lost' ? LOST_PETS : FOUND_ANIMALS

  return (
    <div className="pm-lf-page">
      <Navbar variant="light" />

      <section className="pm-lf-hero">
        <div className="container-pm">
          <p className="eyebrow pm-lf-hero__eyebrow">Lost & Found</p>
          <h1 className="pm-lf-hero__title">Help reunite a pet with their family.</h1>
          <p className="pm-lf-hero__sub">
            Browse recent lost and found reports, or file one of your own —
            matching happens automatically off details like microchip ID and location.
          </p>
          <Link to="/lost-found/report" className="btn-pm btn-pm--orange">
            <span aria-hidden="true">📋</span> Report a lost or found pet
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
              Lost pets ({LOST_PETS.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'found'}
              className={`pm-lf-tab ${tab === 'found' ? 'pm-lf-tab--active' : ''}`}
              onClick={() => setTab('found')}
            >
              Found animals ({FOUND_ANIMALS.length})
            </button>
          </div>

          <div className="pm-lf-grid">
            {items.map((item) => (
              <article key={item.id} className="pm-lf-card">
                <div className="pm-lf-card__photo">
                  <img src={item.photo} alt={item.petName || item.species} loading="lazy" />
                  <span className="pm-lf-card__id">{item.id}</span>
                  <span
                    className={`pm-lf-card__status pm-lf-card__status--${item.matchStatus.toLowerCase()}`}
                  >
                    {item.matchStatus}
                  </span>
                </div>
                <div className="pm-lf-card__body">
                  <h3>{item.petName || `Unnamed ${item.species}`}</h3>
                  <p className="pm-lf-card__meta">
                    {item.species} · {item.breed}
                  </p>
                  <p className="pm-lf-card__meta">
                    📍 {item.location} · {tab === 'lost' ? `Last seen ${item.lastSeenDate}` : `Found ${item.foundDate}`}
                  </p>
                  {item.features && <p className="pm-lf-card__features">{item.features}</p>}
                  <button type="button" className="btn-pm btn-pm--outline-light btn-pm--full">
                    Contact {item.contactName.split(' ')[0]}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}