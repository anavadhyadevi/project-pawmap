import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './adopt.css'

const API = 'http://localhost:8000/api'
const SPECIES_FILTERS = ['All', 'Dog', 'Cat', 'Cow', 'Other']

// adapt Django animal to sreya's expected shape
function adaptAnimal(a, listingId = null) {
  return {
    id:         a.animal_id,
    name:       a.breed !== 'Unknown' ? `${a.species} · ${a.breed}` : a.species,
    species:    a.species,
    tag:        a.ownership_status || 'Stray',
    age:        a.estimated_age || 'Unknown age',
    location:   'Bengaluru',
    rating:     a.temperament_score ? parseFloat(a.temperament_score) : null,
    photo:      a.photo || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop',
    features:   a.distinguishing_features || '',
    listing_id: listingId,
  }
}

export default function Adopt() {
  const { accessToken, isLoggedIn } = useAuth()
  const [animals, setAnimals]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [species, setSpecies]       = useState('All')
  const [search, setSearch]         = useState('')
  const [expressing, setExpressing] = useState(null)
  const [success, setSuccess]       = useState('')

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

  async function expressInterest(listingId, animalName) {
    if (!isLoggedIn) {
      alert('Please log in to express interest in adopting.')
      return
    }
    if (!listingId) {
      alert('This animal does not have an active adoption listing yet.')
      return
    }
    setExpressing(listingId)
    try {
      const res = await fetch(`${API}/adoption/${listingId}/interest/`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(`Your interest in ${animalName} has been noted! The NGO will be in touch.`)
        setTimeout(() => setSuccess(''), 5000)
      } else {
        alert(data.error || 'Could not express interest.')
      }
    } catch {
      alert('Could not connect to server.')
    } finally {
      setExpressing(null)
    }
  }

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

          {success && (
            <div style={{ marginBottom: 20, padding: '12px 16px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8 }}>
              <p style={{ color: '#166534', fontSize: 14 }}>{success}</p>
            </div>
          )}

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
                      <h3>{a.name}</h3>
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
                    <button
                      type="button"
                      className="btn-pm btn-pm--outline-light btn-pm--full pm-adopt-cta"
                      onClick={() => expressInterest(a.listing_id, a.name)}
                      disabled={expressing === a.listing_id}>
                      {expressing === a.listing_id ? 'Submitting...' : `Ask about ${a.name}`}
                    </button>
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