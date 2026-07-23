import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { getAnimalById } from '../data/animals.js'
import './animalDetail.css'

export default function AnimalDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const animal = getAnimalById(id)

  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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
    setSubmitting(true)
    try {
      // Wire this up to POST /api/adoption-requests/ once the backend is available.
      // await fetch('/api/adoption-requests/', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ animalId: animal.id, ...form }),
      // })
      await new Promise((r) => setTimeout(r, 600))
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
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