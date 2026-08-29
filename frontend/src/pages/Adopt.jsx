import { useMemo, useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './adopt.css'

const API = 'http://localhost:8000/api'
const SPECIES_FILTERS = ['All', 'Dog', 'Cat', 'Cow', 'Other']

// adapt Django animal to expected shape
function adaptAnimal(a, listingId = null) {
  // prefer the animal's own photo, then fall back to the photo from the
  // original case report (case_photo), and finally a generic placeholder
  const PLACEHOLDER = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop'
  const photo = a.photo || a.case_photo || PLACEHOLDER
  return {
    id:         a.animal_id,
    name:       a.breed !== 'Unknown' ? `${a.species} · ${a.breed}` : a.species,
    species:    a.species,
    tag:        a.ownership_status || 'Stray',
    age:        a.estimated_age || 'Unknown age',
    location:   'Bengaluru',
    rating:     a.temperament_score ? parseFloat(a.temperament_score) : null,
    photo,
    features:   a.distinguishing_features || '',
    listing_id: listingId,
  }
}
export default function Adopt() {
  const { user, isLoggedIn } = useAuth()
  if (isLoggedIn && user.role === 'NGO_Admin') {
    return <Navigate to="/ngo/dashboard" replace />
  }
  
  const [animals, setAnimals]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [species, setSpecies]   = useState('All')
  const [search, setSearch]     = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`${API}/animals/?adoption_status=Available`).then(r => r.json()),
      fetch(`${API}/adoption/`).then(r => r.json()),
    ]).then(([animalsData, listingsData]) => {
      const listings = listingsData.results ?? listingsData
      const animalsList = (animalsData.results ?? animalsData).map(a => {
        // find the listing for this animal
        const listing = listings.find(l => l.animal.animal_id === a.animal_id)
        return adaptAnimal(a, listing?.listing_id || null)
      })
      setAnimals(animalsList)
    })
    .catch(() => setError('Could not load animals.'))
    .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return animals.filter((a) => {
      const matchesSpecies = species === 'All' || a.species === species
      const matchesSearch  = a.name.toLowerCase().includes(search.trim().toLowerCase())
      return matchesSpecies && matchesSearch
    })
  }, [animals, species, search])

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

          {error && (
            <div style={{ marginBottom: 20, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8 }}>
              <p style={{ color: '#dc2626', fontSize: 14 }}>{error}</p>
            </div>
          )}

          <div className="pm-adopt-filters">
            <input type="text" className="pm-adopt-search"
              placeholder="Search by species or breed…"
              value={search} onChange={(e) => setSearch(e.target.value)}/>
            <div className="pm-chip-row">
              {SPECIES_FILTERS.map((s) => (
                <button key={s} type="button"
                  className={`pm-chip ${species === s ? 'pm-chip--active' : ''}`}
                  onClick={() => setSpecies(s)}>{s}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '60px 0' }}>
              Loading animals...
            </p>
          )}

          {!loading && filtered.length === 0 && (
            <div className="pm-adopt-empty">
              <p>
                {animals.length === 0
                  ? 'No animals are available for adoption right now. Check back soon!'
                  : `No animals match your search — try a different filter.`}
              </p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="pm-animal-grid">
              {filtered.map((a) => (
                <div key={a.id} className="pm-animal-card">
                  <div className="pm-animal-card__photo">
                    <img src={a.photo} alt={a.name} loading="lazy"
                      onError={e => {
                        e.target.src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop'
                      }}/>
                    <span className="pm-animal-card__id">{a.id}</span>
                    <span className="pm-animal-card__dot" title="Available"/>
                  </div>
                  <div className="pm-animal-card__body">
                    <div className="pm-animal-card__row">
                      <h3><Link to={`/adopt/${a.id}`}>{a.name}</Link></h3>
                      <span className="pm-animal-card__tag">{a.tag}</span>
                    </div>
                    <p className="pm-animal-card__meta">{a.age}</p>
                    {a.features && (
                      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{a.features}</p>
                    )}
                    {a.rating && (
                      <div className="pm-animal-card__rating">
                        ★★★★★ <span>{a.rating.toFixed(1)} / 5.0</span>
                      </div>
                    )}
                    <Link to={`/adopt/${a.id}`} className="btn-pm btn-pm--outline-light btn-pm--full pm-adopt-cta" style={{ marginBottom: 8 }}>
                      View details
                    </Link>
                    <Link
                      to={`/adopt/${a.id}`}
                      className="btn-pm btn-pm--outline-light btn-pm--full pm-adopt-cta"
                    >
                      Ask about {a.name}
                    </Link>
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
