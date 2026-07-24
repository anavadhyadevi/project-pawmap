import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import './reportLostFound.css'
import './report.css'

const SPECIES = ['Dog', 'Cat', 'Bird', 'Other']

export default function ReportLostFound() {
  const navigate = useNavigate()
  const [type, setType] = useState('lost') // 'lost' | 'found'
  const [form, setForm] = useState({
    petName: '',
    species: 'Dog',
    breed: '',
    date: '',
    location: '',
    features: '',
    microchipId: '',
    contactName: '',
    contactPhone: '',
  })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function update(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
  }

  function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function validate() {
    const next = {}
    if (type === 'lost' && !form.petName.trim()) next.petName = "Enter your pet's name."
    if (!form.location.trim()) next.location = 'Add a location.'
    if (!form.date) next.date = type === 'lost' ? 'When did you last see them?' : 'When did you find them?'
    if (!form.contactName.trim()) next.contactName = 'Enter your name.'
    if (!/^\d{10}$/.test(form.contactPhone.replace(/\D/g, ''))) next.contactPhone = 'Enter a 10-digit phone number.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      // Wire this up to POST /api/lost-found/ once the backend exposes it.
      // const body = new FormData()
      // body.append('type', type)
      // Object.entries(form).forEach(([k, v]) => body.append(k, v))
      // if (photo) body.append('photo', photo)
      // await fetch('/api/lost-found/', { method: 'POST', body })
      await new Promise((r) => setTimeout(r, 700))
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div>
        <Navbar variant="light" />
        <div className="pm-lf-done">
          <div className="pm-lf-done__card">
            <span aria-hidden="true">✅</span>
            <h1>Report submitted</h1>
            <p>
              We've logged this {type === 'lost' ? 'lost pet' : 'found animal'} report and
              will check it against existing {type === 'lost' ? 'found' : 'lost'} listings automatically.
            </p>
            <button className="btn-pm btn-pm--orange" onClick={() => navigate('/lost-found')}>
              Back to Lost & Found
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar variant="light" />
      <div className="pm-lf-report">
        <div className="container-pm pm-lf-report__inner">
          <p className="eyebrow pm-lf-report__eyebrow">Lost & Found</p>
          <h1 className="pm-lf-report__title">
            {type === 'lost' ? 'Report a lost pet' : 'Report a found animal'}
          </h1>

          <div className="pm-lf-type-toggle" role="radiogroup" aria-label="Report type">
            <button
              type="button"
              className={`pm-lf-type ${type === 'lost' ? 'pm-lf-type--active' : ''}`}
              onClick={() => setType('lost')}
            >
              I lost a pet
            </button>
            <button
              type="button"
              className={`pm-lf-type ${type === 'found' ? 'pm-lf-type--active' : ''}`}
              onClick={() => setType('found')}
            >
              I found an animal
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="pm-lf-form">
            <div className={`pm-field ${errors.photo ? 'pm-field--error' : ''}`}>
              <label htmlFor="photo">Photo</label>
              <label className="pm-photo-drop" htmlFor="photo">
                {photoPreview ? (
                  <img src={photoPreview} alt="Selected" />
                ) : (
                  <span>
                    <span className="pm-photo-drop__icon" aria-hidden="true">📷</span>
                    Tap to add a photo
                  </span>
                )}
              </label>
              <input id="photo" type="file" accept="image/*" onChange={handlePhoto} hidden />
            </div>

            {type === 'lost' && (
              <div className={`pm-field ${errors.petName ? 'pm-field--error' : ''}`}>
                <label htmlFor="petName">Pet's name</label>
                <input
                  id="petName"
                  value={form.petName}
                  onChange={(e) => update('petName', e.target.value)}
                  placeholder="Tommy"
                />
                {errors.petName && <p className="pm-field__error">{errors.petName}</p>}
              </div>
            )}

            <div className="pm-field">
              <label>Species</label>
              <div className="pm-chip-row">
                {SPECIES.map((s) => (
                  <button
                    type="button"
                    key={s}
                    className={`pm-chip ${form.species === s ? 'pm-chip--active' : ''}`}
                    onClick={() => update('species', s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="pm-field-grid">
              <div className="pm-field">
                <label htmlFor="breed">Breed (if known)</label>
                <input
                  id="breed"
                  value={form.breed}
                  onChange={(e) => update('breed', e.target.value)}
                  placeholder="e.g. German Shepherd mix"
                />
              </div>
              <div className={`pm-field ${errors.date ? 'pm-field--error' : ''}`}>
                <label htmlFor="date">{type === 'lost' ? 'Last seen date' : 'Date found'}</label>
                <input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => update('date', e.target.value)}
                />
                {errors.date && <p className="pm-field__error">{errors.date}</p>}
              </div>
            </div>

            <div className={`pm-field ${errors.location ? 'pm-field--error' : ''}`}>
              <label htmlFor="location">Location</label>
              <input
                id="location"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                placeholder="Street, landmark, or area"
              />
              {errors.location && <p className="pm-field__error">{errors.location}</p>}
            </div>

            <div className="pm-field">
              <label htmlFor="features">Distinguishing features</label>
              <textarea
                id="features"
                rows={3}
                value={form.features}
                onChange={(e) => update('features', e.target.value)}
                placeholder="Collar color, markings, scars, behavior…"
              />
            </div>

            <div className="pm-field">
              <label htmlFor="microchipId">Microchip ID (if known)</label>
              <input
                id="microchipId"
                value={form.microchipId}
                onChange={(e) => update('microchipId', e.target.value)}
                placeholder="e.g. MC-77291048"
              />
            </div>

            <div className="pm-field-grid">
              <div className={`pm-field ${errors.contactName ? 'pm-field--error' : ''}`}>
                <label htmlFor="contactName">Your name</label>
                <input
                  id="contactName"
                  value={form.contactName}
                  onChange={(e) => update('contactName', e.target.value)}
                  placeholder="Anjali Rao"
                />
                {errors.contactName && <p className="pm-field__error">{errors.contactName}</p>}
              </div>
              <div className={`pm-field ${errors.contactPhone ? 'pm-field--error' : ''}`}>
                <label htmlFor="contactPhone">Your phone</label>
                <input
                  id="contactPhone"
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => update('contactPhone', e.target.value)}
                  placeholder="98765 43210"
                />
                {errors.contactPhone && <p className="pm-field__error">{errors.contactPhone}</p>}
              </div>
            </div>

            <button type="submit" className="btn-pm btn-pm--orange btn-pm--full" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit report'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}