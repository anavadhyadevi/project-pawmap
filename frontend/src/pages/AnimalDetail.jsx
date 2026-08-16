import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE_URL } from '../lib/api.js'
import './animalDetail.css'

function adaptDetailedAnimal(a) {
  return {
    id: a.animal_id,
    name: a.name || (a.breed !== 'Unknown' ? `${a.species} · ${a.breed}` : a.species),
    species: a.species,
    size: 'Medium',
    gender: 'Unknown',
    age: a.estimated_age || 'Adult',
    location: 'Bengaluru',
    tag: a.ownership_status || 'Stray',
    rating: a.temperament_score ? parseFloat(a.temperament_score) : 5.0,
    photo: a.photo || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=900&auto=format&fit=crop',
    story: a.distinguishing_features || 'No details available.',
    vaccinated: false,
    neutered: false,
    listing_id: a.listing_id,
    temperamentObservations: (a.temperament_ratings || []).map(r => ({
      date: new Date(r.timestamp).toISOString().split('T')[0],
      score: parseFloat(r.score),
      note: `Observed score: ${r.score}`,
      observedBy: r.volunteer_name || 'Volunteer'
    }))
  }
}

export default function AnimalDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, accessToken, isLoggedIn } = useAuth()

  const [animal, setAnimal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [newRating, setNewRating] = useState(5)
  const [submittingRating, setSubmittingRating] = useState(false)
  const [ratingError, setRatingError] = useState('')

  const fetchAnimal = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/animals/${id}/`)
      if (!res.ok) throw new Error('Animal not found')
      const data = await res.json()
      setAnimal(adaptDetailedAnimal(data))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchAnimal()
  }, [fetchAnimal])

  const temperamentScore = animal ? animal.rating : null

  async function submitRating() {
    if (!isLoggedIn) return
    setSubmittingRating(true)
    setRatingError('')
    try {
      const res = await fetch(`${API_BASE_URL}/animals/${id}/rate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ score: newRating }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to submit rating.')
      }
      await fetchAnimal()
    } catch (err) {
      setRatingError(err.message)
    } finally {
      setSubmittingRating(false)
    }
  }

  function update(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
  }

  function validate() {
    const next = {}
    if (!form.name.trim()) next.name = 'Enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.'
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) next.phone = 'Enter a 10-digit phone number.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    if (!animal?.listing_id) {
      alert('This animal does not have an active adoption listing yet.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/adoption/${animal.listing_id}/interest/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Could not express interest.')
      }
      setSubmitted(true)
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="pm-animal-detail-page">
        <Navbar variant="light" />
        <div style={{ textAlign: 'center', padding: '120px 20px', color: '#6b7280' }}>
          <h3>Loading animal details...</h3>
        </div>
        <Footer />
      </div>
    )
  }

  if (!animal) {
    return (
      <div>
        <Navbar variant="light" />
        <div className="pm-animal-notfound">
          <h1>We couldn't find that animal.</h1>
          <p>It may have already been adopted, or the link might be out of date.</p>
          <Link to="/adopt" className="btn-pm btn-pm--orange">Back to all animals</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pm-animal-detail-page">
      <Navbar variant="light" />

      <div className="container-pm pm-animal-detail">
        <Link to="/adopt" className="pm-animal-detail__back">← Back to all animals</Link>

        <div className="pm-animal-detail__grid">
          {/* LEFT: photo + info */}
          <div className="pm-animal-detail__main">
            <div className="pm-animal-detail__photo">
              <img src={animal.photo} alt={animal.name} />
              <span className="pm-animal-card__id">{animal.id}</span>
              <span className="pm-animal-card__dot" title="Available" />
            </div>

            <div className="pm-animal-detail__head">
              <h1>{animal.name}</h1>
              <span className="pm-animal-card__tag">{animal.tag}</span>
            </div>
            <p className="pm-animal-detail__meta">{animal.age} · {animal.location}</p>
            <div className="pm-animal-card__rating pm-animal-detail__rating">
              ★★★★★ <span>{animal.rating.toFixed(1)} / 5.0</span>
            </div>

            <div className="pm-animal-detail__tags">
              <span className="pm-info-pill">{animal.species}</span>
              <span className="pm-info-pill">{animal.gender}</span>
              <span className="pm-info-pill">{animal.size}</span>
              {animal.vaccinated && <span className="pm-info-pill pm-info-pill--good">Vaccinated</span>}
              {animal.neutered && <span className="pm-info-pill pm-info-pill--good">Neutered / Spayed</span>}
            </div>

            <h2 className="pm-animal-detail__subhead">About {animal.name}</h2>
            <p className="pm-animal-detail__story">{animal.story}</p>

            {temperamentScore !== null ? (
              <div className="pm-temperament">
                <div className="pm-temperament__head">
                  <h2 className="pm-animal-detail__subhead">Temperament</h2>
                  <span className="pm-temperament__score">{temperamentScore.toFixed(1)} / 5.0</span>
                </div>
                <p className="pm-temperament__note">
                  Weighted toward more recent observations — {animal.name}'s behavior in the
                  last few weeks counts more than how they acted right after rescue.
                </p>
                <ul className="pm-temperament__timeline">
                  {animal.temperamentObservations.map((obs, i) => (
                    <li key={i} className="pm-temperament__item">
                      <span className="pm-temperament__item-score">{obs.score.toFixed(1)}</span>
                      <div>
                        <p className="pm-temperament__item-note">{obs.note}</p>
                        <p className="pm-temperament__item-meta">{obs.date} · {obs.observedBy}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                {isLoggedIn && ['Volunteer', 'NGO_Admin'].includes(user?.role) && (
                  <div className="pm-mr-add" style={{ marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                    <h4>Submit a new rating</h4>
                    <div className="pm-mr-add__row">
                      <select
                        value={newRating}
                        onChange={(e) => setNewRating(Number(e.target.value))}
                      >
                        <option value={5}>5 - Excellent / Very Friendly</option>
                        <option value={4}>4 - Friendly / Calm</option>
                        <option value={3}>3 - Neutral / Observant</option>
                        <option value={2}>2 - Skittish / Nervous</option>
                        <option value={1}>1 - Aggressive / High Alert</option>
                      </select>
                      <button
                        type="button"
                        className="btn-pm btn-pm--orange"
                        disabled={submittingRating}
                        onClick={submitRating}
                      >
                        {submittingRating ? 'Submitting…' : 'Submit'}
                      </button>
                    </div>
                    {ratingError && <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{ratingError}</p>}
                  </div>
                )}
              </div>
            ) : (
              isLoggedIn && ['Volunteer', 'NGO_Admin'].includes(user?.role) && (
                <div className="pm-temperament">
                  <div className="pm-temperament__head">
                    <h2 className="pm-animal-detail__subhead">Temperament</h2>
                    <span className="pm-temperament__score">Not rated yet</span>
                  </div>
                  <div className="pm-mr-add" style={{ marginTop: '20px' }}>
                    <h4>Submit a new rating</h4>
                    <div className="pm-mr-add__row">
                      <select
                        value={newRating}
                        onChange={(e) => setNewRating(Number(e.target.value))}
                      >
                        <option value={5}>5 - Excellent / Very Friendly</option>
                        <option value={4}>4 - Friendly / Calm</option>
                        <option value={3}>3 - Neutral / Observant</option>
                        <option value={2}>2 - Skittish / Nervous</option>
                        <option value={1}>1 - Aggressive / High Alert</option>
                      </select>
                      <button
                        type="button"
                        className="btn-pm btn-pm--orange"
                        disabled={submittingRating}
                        onClick={submitRating}
                      >
                        {submittingRating ? 'Submitting…' : 'Submit'}
                      </button>
                    </div>
                    {ratingError && <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{ratingError}</p>}
                  </div>
                </div>
              )
            )}
          </div>

          {/* RIGHT: inquiry form */}
          <div className="pm-animal-detail__side">
            {submitted ? (
              <div className="pm-animal-detail__done">
                <span aria-hidden="true">✅</span>
                <h3>Request sent</h3>
                <p>
                  We've passed your interest in {animal.name} to the team. They'll reach
                  out on the contact details you gave.
                </p>
                <Link to="/adopt" className="btn-pm btn-pm--orange btn-pm--full">
                  Browse more animals
                </Link>
              </div>
            ) : (
              <form className="pm-animal-detail__form" onSubmit={handleSubmit} noValidate>
                <h3>Ask about {animal.name}</h3>
                <p className="pm-animal-detail__form-sub">
                  Tell us a bit about yourself and we'll follow up to arrange a meet.
                </p>

                <div className={`pm-field ${errors.name ? 'pm-field--error' : ''}`}>
                  <label htmlFor="name">Your name</label>
                  <input
                    id="name"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="Anjali Rao"
                  />
                  {errors.name && <p className="pm-field__error">{errors.name}</p>}
                </div>

                <div className={`pm-field ${errors.email ? 'pm-field--error' : ''}`}>
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="you@example.com"
                  />
                  {errors.email && <p className="pm-field__error">{errors.email}</p>}
                </div>

                <div className={`pm-field ${errors.phone ? 'pm-field--error' : ''}`}>
                  <label htmlFor="phone">Phone number</label>
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="98765 43210"
                  />
                  {errors.phone && <p className="pm-field__error">{errors.phone}</p>}
                </div>

                <div className="pm-field">
                  <label htmlFor="message">Message (optional)</label>
                  <textarea
                    id="message"
                    rows={3}
                    value={form.message}
                    onChange={(e) => update('message', e.target.value)}
                    placeholder={`Why would ${animal.name} be a good fit for you?`}
                  />
                </div>

                <button type="submit" className="btn-pm btn-pm--orange btn-pm--full" disabled={submitting}>
                  {submitting ? 'Sending…' : 'Send request'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}