import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { ANIMALS } from '../data/animals.js'
import './adopt.css'

const SPECIES_FILTERS = ['All', 'Dog', 'Cat']

export default function Adopt() {
  const [species, setSpecies] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return ANIMALS.filter((a) => {
      const matchesSpecies = species === 'All' || a.species === species
      const matchesSearch = a.name.toLowerCase().includes(search.trim().toLowerCase())
      return matchesSpecies && matchesSearch
    })
  }, [species, search])

  return (
    <div className="pm-adopt-page">
      <Navbar variant="light" />

      <section className="pm-adopt-hero">
        <div className="container-pm">
          <p className="eyebrow pm-adopt-hero__eyebrow">Available for adoption</p>
          <h1 className="pm-adopt-hero__title">Find your companion.</h1>
          <p className="pm-adopt-hero__sub">
            Every animal here has been assessed by a volunteer or vet and is ready for a home.
          </p>
        </div>
      </section>

      <section className="pm-adopt-list">
        <div className="container-pm">
          <div className="pm-adopt-filters">
            <input
              type="text"
              className="pm-adopt-search"
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="pm-chip-row">
              {SPECIES_FILTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`pm-chip ${species === s ? 'pm-chip--active' : ''}`}
                  onClick={() => setSpecies(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="pm-adopt-empty">
              <p>No animals match "{search}" right now — try a different search or filter.</p>
            </div>
          ) : (
            <div className="pm-animal-grid">
              {filtered.map((a) => (
                <Link key={a.id} to={`/adopt/${a.id}`} className="pm-animal-card pm-animal-card--link">
                  <div className="pm-animal-card__photo">
                    <img src={a.photo} alt={a.name} loading="lazy" />
                    <span className="pm-animal-card__id">{a.id}</span>
                    <span className="pm-animal-card__dot" title="Available" />
                  </div>
                  <div className="pm-animal-card__body">
                    <div className="pm-animal-card__row">
                      <h3>{a.name}</h3>
                      <span className="pm-animal-card__tag">{a.tag}</span>
                    </div>
                    <p className="pm-animal-card__meta">{a.age} · {a.location}</p>
                    <div className="pm-animal-card__rating">
                      ★★★★★ <span>{a.rating.toFixed(1)} / 5.0</span>
                    </div>
                    <span className="btn-pm btn-pm--outline-light btn-pm--full pm-adopt-cta">
                      Ask about {a.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}