import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import './report.css'

const SPECIES = ['Dog', 'Cat', 'Cow', 'Bird', 'Other']
const SEVERITIES = [
  { value: 'low', label: 'Low', hint: 'Healthy, just needs monitoring' },
  { value: 'medium', label: 'Medium', hint: 'Visible injury, not life-threatening' },
  { value: 'high', label: 'High / SOS', hint: 'Severe injury, needs urgent help' },
]

export default function ReportStray() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    species: 'Dog',
    otherSpecies: '',
    estimatedAge: '',
    severity: 'medium',
    injuryType: '',
    aggressionLevel: 2,
    priorAction: '',
    location: '',
    notes: '',
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
    if (form.species === 'Other' && !form.otherSpecies.trim()) {
      next.otherSpecies = 'Tell us what kind of animal this is.'
    }
    if (!form.location.trim()) next.location = 'Add a location so a volunteer can find them.'
    if (!photo) next.photo = 'A photo helps volunteers recognize the animal on arrival.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      // Wire this up to POST /api/cases/ (multipart/form-data) once the backend is available.
      // const body = new FormData()
      // Object.entries(form).forEach(([k, v]) => body.append(k, v))
      // if (photo) body.append('photo', photo)
      // await fetch('/api/cases/', { method: 'POST', body })
      await new Promise((r) => setTimeout(r, 700))
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords
      update('location', `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
    })
  }

  if (submitted) {
    return (
      <div>
        <Navbar variant="light" />
        <div className="pm-report-done">
          <div className="pm-report-done__card">
            <span className="pm-report-done__icon" aria-hidden="true">✅</span>
            <h1>Report received</h1>
            <p>
              Case <strong>#A-0157</strong> has been logged. We're notifying the nearest
              verified volunteers now — you'll get updates as the case moves.
            </p>
            <div className="pm-report-done__actions">
              <button className="btn-pm btn-pm--orange" onClick={() => navigate('/')}>
                Back to home
              </button>
              <button
                className="btn-pm btn-pm--outline-light"
                onClick={() => {
                  setSubmitted(false)
                  setForm({
                    species: 'Dog', otherSpecies: '', estimatedAge: '', severity: 'medium',
                    injuryType: '', aggressionLevel: 2, priorAction: '', location: '', notes: '',
                  })
                  setPhoto(null)
                  setPhotoPreview(null)
                }}
              >
                Report another
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar variant="light" />
      <div className="pm-report">
        <div className="container-pm pm-report__inner">
          <p className="eyebrow pm-report__eyebrow">Report a stray</p>
          <h1 className="pm-report__title">Tell us what you found.</h1>
          <p className="pm-report__sub">
            A clear photo and location are the most important things — the rest helps
            volunteers prepare before they arrive.
          </p>

          <form onSubmit={handleSubmit} noValidate className="pm-report__form">
            {/* Photo */}
            <div className={`pm-field ${errors.photo ? 'pm-field--error' : ''}`}>
              <label htmlFor="photo">Photo</label>
              <label className="pm-photo-drop" htmlFor="photo">
                {photoPreview ? (
                  <img src={photoPreview} alt="Selected stray" />
                ) : (
                  <span>
                    <span className="pm-photo-drop__icon" aria-hidden="true">📷</span>
                    Tap to add a photo
                  </span>
                )}
              </label>
              <input
                id="photo"
                name="photo"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhoto}
                hidden
              />
              {errors.photo && <p className="pm-field__error">{errors.photo}</p>}
            </div>

            {/* Location */}
            <div className={`pm-field ${errors.location ? 'pm-field--error' : ''}`}>
              <label htmlFor="location">Location</label>
              <div className="pm-location-row">
                <input
                  id="location"
                  name="location"
                  value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                  placeholder="Street, landmark, or area"
                />
                <button type="button" className="btn-pm btn-pm--outline-light" onClick={useCurrentLocation}>
                  📍 Use current
                </button>
              </div>
              {errors.location && <p className="pm-field__error">{errors.location}</p>}
            </div>

            {/* Species */}
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
              {form.species === 'Other' && (
                <input
                  className="pm-field__followup"
                  placeholder="What kind of animal is it?"
                  value={form.otherSpecies}
                  onChange={(e) => update('otherSpecies', e.target.value)}
                />
              )}
              {errors.otherSpecies && <p className="pm-field__error">{errors.otherSpecies}</p>}
            </div>

            <div className="pm-field-grid">
              <div className="pm-field">
                <label htmlFor="estimatedAge">Estimated age</label>
                <input
                  id="estimatedAge"
                  value={form.estimatedAge}
                  onChange={(e) => update('estimatedAge', e.target.value)}
                  placeholder="e.g. ~2 years, puppy"
                />
              </div>
              <div className="pm-field">
                <label htmlFor="injuryType">Injury type (if any)</label>
                <input
                  id="injuryType"
                  value={form.injuryType}
                  onChange={(e) => update('injuryType', e.target.value)}
                  placeholder="e.g. limping, wound on leg"
                />
              </div>
            </div>

            {/* Severity */}
            <div className="pm-field">
              <label>Severity</label>
              <div className="pm-severity-row">
                {SEVERITIES.map((s) => (
                  <button
                    type="button"
                    key={s.value}
                    className={`pm-severity ${form.severity === s.value ? 'pm-severity--active' : ''} pm-severity--${s.value}`}
                    onClick={() => update('severity', s.value)}
                  >
                    <strong>{s.label}</strong>
                    <span>{s.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aggression level */}
            <div className="pm-field">
              <label htmlFor="aggression">
                Aggression level ({form.aggressionLevel} / 5)
              </label>
              <input
                id="aggression"
                type="range"
                min="1"
                max="5"
                value={form.aggressionLevel}
                onChange={(e) => update('aggressionLevel', Number(e.target.value))}
                className="pm-slider"
              />
              <div className="pm-slider__labels">
                <span>Calm</span>
                <span>Cautious</span>
                <span>Aggressive</span>
              </div>
            </div>

            <div className="pm-field">
              <label htmlFor="priorAction">Prior action taken (optional)</label>
              <input
                id="priorAction"
                value={form.priorAction}
                onChange={(e) => update('priorAction', e.target.value)}
                placeholder="e.g. gave water, kept away from traffic"
              />
            </div>

            <div className="pm-field">
              <label htmlFor="notes">Additional notes (optional)</label>
              <textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Anything else a volunteer should know"
              />
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