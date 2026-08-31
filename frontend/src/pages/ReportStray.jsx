import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Camera, CheckCircle2, MapPin } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE_URL } from '../lib/api.js'
import { forwardGeocode, reverseGeocode } from '../lib/geocode.js'
import './report.css'

// Fix leaflet icon loading issue in Vite
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

const SPECIES = ['Dog', 'Cat', 'Cow', 'Bird', 'Other']
const SEVERITIES = [
  { value: 'low', label: 'Low', hint: 'Healthy, just needs monitoring' },
  { value: 'medium', label: 'Medium', hint: 'Visible injury, not life-threatening' },
  { value: 'high', label: 'High / SOS', hint: 'Severe injury, needs urgent help' },
]

const WARDS_DATA = [
  { name: 'Koramangala', lat: 12.9348, lon: 77.6189 },
  { name: 'Indiranagar', lat: 12.9719, lon: 77.6412 },
  { name: 'Jayanagar', lat: 12.9250, lon: 77.5938 },
  { name: 'JP Nagar', lat: 12.9063, lon: 77.5857 },
  { name: 'HSR Layout', lat: 12.9121, lon: 77.6446 },
  { name: 'Whitefield', lat: 12.9698, lon: 77.7500 },
  { name: 'Malleshwaram', lat: 12.9982, lon: 77.5683 },
  { name: 'Hebbal', lat: 13.0358, lon: 77.5970 },
  { name: 'Yelahanka', lat: 13.1007, lon: 77.5963 },
  { name: 'Marathahalli', lat: 12.9569, lon: 77.7011 }
]

function getNearestWard(lat, lon) {
  let minDistance = Infinity
  let nearestWardName = 'Koramangala'
  for (const w of WARDS_DATA) {
    const d = Math.pow(lat - w.lat, 2) + Math.pow(lon - w.lon, 2)
    if (d < minDistance) {
      minDistance = d
      nearestWardName = w.name
    }
  }
  return nearestWardName
}

function LocationMarker({ position, setPosition, onSetLatLng }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng)
      onSetLatLng(e.latlng)
    },
  })
  return position === null ? null : <Marker position={position} />
}

function ChangeMapView({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom())
    }
  }, [center, map])
  return null
}

export default function ReportStray() {
  const navigate = useNavigate()
  const { user, isLoggedIn, accessToken, loading } = useAuth()

  const [form, setForm] = useState({
    species: 'Dog',
    otherSpecies: '',
    estimatedAge: '',
    animalCount: 1,
    severity: 'medium',
    injuryType: '',
    aggressionLevel: 2,
    priorAction: '',
    notes: '',
  })
  const [latLng, setLatLng] = useState(null)
  const [placeName, setPlaceName] = useState('')
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946])
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [createdCaseId, setCreatedCaseId] = useState('')

  if (loading) return null

  if (isLoggedIn && user.role === 'NGO_Admin') {
    return <Navigate to="/ngo/dashboard" replace />
  }
  if (isLoggedIn && user.role === 'Volunteer') {
    return <Navigate to="/volunteer/dashboard" replace />
  }

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
    if (!latLng) {
      next.location = 'Please drop a pin on the map or click "Use current location" to specify the location.'
    }
    if (!photo) next.photo = 'A photo helps volunteers recognize the animal on arrival.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSetLatLng(coords) {
    setLatLng(coords)
    const name = await reverseGeocode(coords.lat, coords.lng)
    setPlaceName(name)
  }

  async function handleTypedLocation() {
    const result = await forwardGeocode(placeName)
    if (!result) {
      setErrors((previous) => ({ ...previous, location: 'We could not find that location. Try a more specific address.' }))
      return
    }
    setLatLng(result)
    setMapCenter([result.lat, result.lng])
    setPlaceName(result.name)
    setErrors((previous) => ({ ...previous, location: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const body = new FormData()
      body.append('species', form.species === 'Other' ? form.otherSpecies : form.species)
      body.append('estimated_age', form.estimatedAge || 'Adult')
      body.append('severity', form.severity === 'high' ? 5 : form.severity === 'medium' ? 3 : 2)
      body.append('aggression_level', form.aggressionLevel)
      body.append('injury_type', form.injuryType || 'Stray animal')
      
      // Store both the place name (in description) and the coordinates (for the API)
      const desc = form.notes 
        ? `Location description: ${placeName}\n\nNotes: ${form.notes}`
        : `Location description: ${placeName}`
      body.append('description', desc)
      
      body.append('latitude', latLng.lat.toFixed(6))
      body.append('longitude', latLng.lng.toFixed(6))
      body.append('ward', getNearestWard(latLng.lat, latLng.lng))
      if (photo) body.append('photo', photo)

      const res = await fetch(`${API_BASE_URL}/cases/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to submit report.')
      }

      const caseData = await res.json()
      setCreatedCaseId(caseData.case_id)
      setSubmitted(true)
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err.message }))
    } finally {
      setSubmitting(false)
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setLatLng({ lat: latitude, lng: longitude })
        setMapCenter([latitude, longitude])
        const name = await reverseGeocode(latitude, longitude)
        setPlaceName(name)
      },
      (err) => {
        alert('Failed to get location: ' + err.message)
      }
    )
  }

  // Full-screen uploading overlay — shown while API call is in flight
  if (submitting) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(255,255,255,0.97)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 20,
      }}>
        {/* Spinner */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          border: '5px solid #e5e7eb',
          borderTopColor: '#f97316',
          animation: 'pm-spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes pm-spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: 18, fontWeight: 600, color: '#111', margin: 0 }}>Sending your report…</p>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Uploading photo &amp; notifying volunteers nearby</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div>
        <Navbar variant="light" />
        <div className="pm-report-done">
          <div className="pm-report-done__card">
            <span className="pm-report-done__icon" aria-hidden="true"><CheckCircle2 size="1em" /></span>
            <h1>Report received! 🐾</h1>
            <p>
              Case <strong>#{createdCaseId}</strong> has been logged. We're notifying the nearest
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
                    species: 'Dog', otherSpecies: '', estimatedAge: '', animalCount: 1, severity: 'medium',
                    injuryType: '', aggressionLevel: 2, priorAction: '', notes: '',
                  })
                  setLatLng(null)
                  setPlaceName('')
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
                    <span className="pm-photo-drop__icon" aria-hidden="true"><Camera size="1em" /></span>
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

            {/* Location Map */}
            <div className={`pm-field ${errors.location ? 'pm-field--error' : ''}`}>
              <label>Location (Tap map to drop pin)</label>
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <MapContainer
                  center={[12.9716, 77.5946]}
                  zoom={12}
                  maxBounds={[[12.7, 77.3], [13.2, 77.9]]}
                  style={{ height: '320px', width: '100%', borderRadius: '10px', zIndex: 1 }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <LocationMarker position={latLng} setPosition={setLatLng} onSetLatLng={handleSetLatLng} />
                  <ChangeMapView center={mapCenter} />
                </MapContainer>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                <label htmlFor="location_name" style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '0' }}>Location</label>
                <input
                  id="location_name"
                  type="text"
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  onBlur={handleTypedLocation}
                  placeholder="Type an address, or tap the map..."
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>

              <div className="pm-location-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  {latLng ? (
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      Coordinates: {latLng.lat.toFixed(5)}, {latLng.lng.toFixed(5)} ({getNearestWard(latLng.lat, latLng.lng)} ward)
                    </span>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                      No location selected yet. Tap the map to drop a pin.
                    </span>
                  )}
                </div>
                <button type="button" className="btn-pm btn-pm--outline-light" onClick={useCurrentLocation}>
                  <MapPin size="1em" aria-hidden="true" /> Use current location
                </button>
              </div>
              {errors.location && <p className="pm-field__error" style={{ marginTop: '4px' }}>{errors.location}</p>}
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
                <label htmlFor="animalCount">How many animals?</label>
                <input
                  id="animalCount"
                  type="number"
                  min="1"
                  max="20"
                  value={form.animalCount}
                  onChange={(e) => update('animalCount', Math.max(1, Number(e.target.value)))}
                />
              </div>
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

            {form.animalCount > 1 && (
              <p className="pm-field-note">
                One report will be filed for all {form.animalCount} animals — a volunteer will
                create individual profiles for each once they're on site.
              </p>
            )}

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

            {errors.submit && <p className="pm-field__error" style={{ marginBottom: '12px' }}>{errors.submit}</p>}
            <button type="submit" className="btn-pm btn-pm--orange btn-pm--full">
              Submit report
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
