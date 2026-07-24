import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './report.css'

const SPECIES = ['Dog', 'Cat', 'Cow', 'Bird', 'Other']
const SEVERITIES = [
  { value: 1, label: 'Low',      hint: 'Healthy, just needs monitoring' },
  { value: 3, label: 'Medium',   hint: 'Visible injury, not life-threatening' },
  { value: 5, label: 'High / SOS', hint: 'Severe injury, needs urgent help' },
]
const AGE_MAP = {
  'puppy':   'Puppy',
  'kitten':  'Kitten',
  'calf':    'Calf',
  'juvenile':'Juvenile',
  'adult':   'Adult',
  'senior':  'Senior',
}

export default function ReportStray() {
  const navigate      = useNavigate()
  const { token, isLoggedIn } = useAuth()

  const [form, setForm] = useState({
    species:        'Dog',
    otherSpecies:   '',
    estimatedAge:   '',
    severity:       3,
    injuryType:     '',
    aggressionLevel: 2,
    priorAction:    '',
    location:       '',
    notes:          '',
  })
  const [coords, setCoords]             = useState({ lat: null, lon: null })
  const [photo, setPhoto]               = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [errors, setErrors]             = useState({})
  const [apiError, setApiError]         = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [submitted, setSubmitted]       = useState(false)
  const [caseId, setCaseId]             = useState('')

  function update(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
  }

  function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords
      const lat = parseFloat(latitude.toFixed(6))
      const lon = parseFloat(longitude.toFixed(6))
      setCoords({ lat, lon })
      update('location', `${lat}, ${lon}`)
    })
  }

  function validate() {
    const next = {}
    if (form.species === 'Other' && !form.otherSpecies.trim()) {
      next.otherSpecies = 'Tell us what kind of animal this is.'
    }
    if (!form.location.trim()) next.location = 'Add a location so a volunteer can find them.'
    if (!coords.lat && !form.location.trim()) next.location = 'Use current location or enter an address.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  // map sreya's age freetext to our enum
  function mapAge(raw) {
    if (!raw) return 'Adult'
    const lower = raw.toLowerCase()
    for (const [key, val] of Object.entries(AGE_MAP)) {
      if (lower.includes(key)) return val
    }
    return 'Adult'
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    if (!isLoggedIn) {
      navigate('/login')
      return
    }

    setSubmitting(true)
    setApiError('')

    try {
      // parse lat/lon from location field if not set via GPS
      let lat = coords.lat
      let lon = coords.lon

      if (!lat && form.location.includes(',')) {
        const parts = form.location.split(',')
        lat = parseFloat(parseFloat(parts[0].trim()).toFixed(6))
        lon = parseFloat(parseFloat(parts[1].trim()).toFixed(6))
    }

      // fallback to Bengaluru centre if nothing parseable
      if (!lat) { lat = 12.9716; lon = 77.5946 }

      const body = new FormData()
      body.append('latitude',        lat)
      body.append('longitude',       lon)
      body.append('species',         form.species === 'Other' ? form.otherSpecies : form.species)
      body.append('estimated_age',   mapAge(form.estimatedAge))
      body.append('severity',        form.severity)
      body.append('aggression_level', form.aggressionLevel)
      body.append('injury_type',     form.injuryType || '')
      body.append('bystander_action', form.priorAction ? 'contacted_ngo' : 'none')
      body.append('description',     form.notes || '')
      if (photo) body.append('photo', photo)

      const res = await fetch('http://localhost:8000/api/cases/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // do NOT set Content-Type — browser sets it automatically for FormData
        },
        body,
      })

      const data = await res.json()

      if (!res.ok) {
        const firstError = Object.values(data)[0]
        setApiError(Array.isArray(firstError) ? firstError[0] : String(firstError))
        return
      }

      setCaseId(data.case_id)
      setSubmitted(true)

    } catch (err) {
      setApiError('Could not connect to server. Is the backend running?')
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setSubmitted(false)
    setForm({
      species: 'Dog', otherSpecies: '', estimatedAge: '', severity: 3,
      injuryType: '', aggressionLevel: 2, priorAction: '', location: '', notes: '',
    })
    setPhoto(null)
    setPhotoPreview(null)
    setCoords({ lat: null, lon: null })
    setCaseId('')
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
              Case <strong>#{caseId}</strong> has been logged. We're notifying the nearest
              verified volunteers now — you'll get updates as the case moves.
            </p>
            <div className="pm-report-done__actions">
              <button className="btn-pm btn-pm--orange" onClick={() => navigate('/')}>
                Back to home
              </button>
              <button className="btn-pm btn-pm--outline-light" onClick={resetForm}>
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

          {apiError && (
            <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 6, background: '#fef2f2', border: '1px solid #fca5a5' }}>
              <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{apiError}</p>
            </div>
          )}

          {!isLoggedIn && (
            <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 6, background: '#fffbeb', border: '1px solid #fcd34d' }}>
              <p style={{ color: '#92400e', fontSize: 13, margin: 0 }}>
                You need to <a href="/login" style={{ color: '#92400e', fontWeight: 600 }}>log in</a> to submit a report.
              </p>
            </div>
          )}

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
              <input id="photo" name="photo" type="file" accept="image/*"
                capture="environment" onChange={handlePhoto} hidden/>
              {errors.photo && <p className="pm-field__error">{errors.photo}</p>}
            </div>

            {/* Location */}
            <div className={`pm-field ${errors.location ? 'pm-field--error' : ''}`}>
              <label htmlFor="location">Location</label>
              <div className="pm-location-row">
                <input id="location" name="location" value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                  placeholder="Street, landmark, or area"/>
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
                  <button type="button" key={s}
                    className={`pm-chip ${form.species === s ? 'pm-chip--active' : ''}`}
                    onClick={() => update('species', s)}>{s}</button>
                ))}
              </div>
              {form.species === 'Other' && (
                <input className="pm-field__followup"
                  placeholder="What kind of animal is it?"
                  value={form.otherSpecies}
                  onChange={(e) => update('otherSpecies', e.target.value)}/>
              )}
              {errors.otherSpecies && <p className="pm-field__error">{errors.otherSpecies}</p>}
            </div>

            <div className="pm-field-grid">
              <div className="pm-field">
                <label htmlFor="estimatedAge">Estimated age</label>
                <input id="estimatedAge" value={form.estimatedAge}
                  onChange={(e) => update('estimatedAge', e.target.value)}
                  placeholder="e.g. puppy, adult, ~2 years"/>
              </div>
              <div className="pm-field">
                <label htmlFor="injuryType">Injury type (if any)</label>
                <input id="injuryType" value={form.injuryType}
                  onChange={(e) => update('injuryType', e.target.value)}
                  placeholder="e.g. limping, wound on leg"/>
              </div>
            </div>

            {/* Severity */}
            <div className="pm-field">
              <label>Severity</label>
              <div className="pm-severity-row">
                {SEVERITIES.map((s) => (
                  <button type="button" key={s.value}
                    className={`pm-severity ${form.severity === s.value ? 'pm-severity--active' : ''} pm-severity--${s.label.toLowerCase().split(' ')[0]}`}
                    onClick={() => update('severity', s.value)}>
                    <strong>{s.label}</strong>
                    <span>{s.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aggression */}
            <div className="pm-field">
              <label htmlFor="aggression">
                Aggression level ({form.aggressionLevel} / 5)
              </label>
              <input id="aggression" type="range" min="1" max="5"
                value={form.aggressionLevel}
                onChange={(e) => update('aggressionLevel', Number(e.target.value))}
                className="pm-slider"/>
              <div className="pm-slider__labels">
                <span>Calm</span><span>Cautious</span><span>Aggressive</span>
              </div>
            </div>

            <div className="pm-field">
              <label htmlFor="priorAction">Prior action taken (optional)</label>
              <input id="priorAction" value={form.priorAction}
                onChange={(e) => update('priorAction', e.target.value)}
                placeholder="e.g. gave water, kept away from traffic"/>
            </div>

            <div className="pm-field">
              <label htmlFor="notes">Additional notes (optional)</label>
              <textarea id="notes" rows={3} value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Anything else a volunteer should know"/>
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