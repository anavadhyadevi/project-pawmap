import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, CheckCircle2, MapPin } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE_URL } from '../lib/api.js'
import { reverseGeocode } from '../lib/geocode.js'
import './reportLostFound.css'
import './report.css'

// Fix leaflet icon loading issue in Vite
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

const SPECIES = ['Dog', 'Cat', 'Bird', 'Other']

function LocationMarker({ position, setPosition, onSetCoords }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng)
      onSetCoords(e.latlng)
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

export default function ReportLostFound() {
  const navigate = useNavigate()
  const { accessToken, isLoggedIn } = useAuth()
  const [type, setType] = useState('lost') // 'lost' | 'found'
  
  const [form, setForm] = useState({
    petName: '',
    species: 'Dog',
    breed: '',
    date: '',
    location: '', // Stores coordinates as "place_name (lat, lon)"
    features: '',
    microchipId: '',
    contactName: '',
    contactPhone: '',
  })
  const [latLng, setLatLng] = useState(null)
  const [placeName, setPlaceName] = useState('')
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946])
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
    if (!latLng) next.location = 'Please tap on the map to specify the location.'
    if (!form.date) next.date = type === 'lost' ? 'When did you last see them?' : 'When did you find them?'
    if (!form.contactName.trim()) next.contactName = 'Enter your name.'
    if (!/^\d{10}$/.test(form.contactPhone.replace(/\D/g, ''))) next.contactPhone = 'Enter a 10-digit phone number.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSetLatLng(coords) {
    setLatLng(coords)
    const name = await reverseGeocode(coords.lat, coords.lng)
    setPlaceName(name)
    update('location', `${name} (${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)})`)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    if (!isLoggedIn) {
      navigate('/login')
      return
    }

    setSubmitting(true)
    try {
      const endpoint = type === 'lost' ? '/cases/lost/' : '/cases/found/'

      const body = new FormData()
      if (type === 'lost') {
        body.append('pet_name', form.petName)
        body.append('last_seen_location', form.location)
        body.append('last_seen_date', form.date)
        body.append('microchip_id', form.microchipId)
      } else {
        body.append('found_location', form.location)
        body.append('found_date', form.date)
      }
      body.append('species', form.species)
      body.append('breed', form.breed)
      body.append('distinguishing_features', form.features)
      if (photo) body.append('photo', photo)

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Request failed')
      }

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
        const loc = { lat: latitude, lng: longitude }
        setLatLng(loc)
        setMapCenter([latitude, longitude])
        const name = await reverseGeocode(latitude, longitude)
        setPlaceName(name)
        update('location', `${name} (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`)
      },
      (err) => {
        alert('Failed to get location: ' + err.message)
      }
    )
  }

  if (submitted) {
    return (
      <div>
        <Navbar variant="light" />
        <div className="pm-lf-done">
          <div className="pm-lf-done__card">
            <CheckCircle2 size="1em" aria-hidden="true" />
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
              onClick={() => {
                setType('lost')
                setLatLng(null)
                setPlaceName('')
                update('location', '')
              }}
            >
              I lost a pet
            </button>
            <button
              type="button"
              className={`pm-lf-type ${type === 'found' ? 'pm-lf-type--active' : ''}`}
              onClick={() => {
                setType('found')
                setLatLng(null)
                setPlaceName('')
                update('location', '')
              }}
            >
              I found an animal
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="pm-lf-form">
            {/* Photo */}
            <div className={`pm-field ${errors.photo ? 'pm-field--error' : ''}`}>
              <label htmlFor="photo">Photo</label>
              <label className="pm-photo-drop" htmlFor="photo">
                {photoPreview ? (
                  <img src={photoPreview} alt="Selected" />
                ) : (
                  <span>
                    <span className="pm-photo-drop__icon" aria-hidden="true"><Camera size="1em" /></span>
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

            {/* Location Map */}
            <div className={`pm-field ${errors.location ? 'pm-field--error' : ''}`}>
              <label>{type === 'lost' ? 'Last seen location (Tap map to drop pin)' : 'Found location (Tap map to drop pin)'}</label>
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
                  <LocationMarker 
                    position={latLng} 
                    setPosition={setLatLng} 
                    onSetCoords={handleSetLatLng} 
                  />
                  <ChangeMapView center={mapCenter} />
                </MapContainer>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                <label htmlFor="location_name" style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '0' }}>Location</label>
                <input
                  id="location_name"
                  type="text"
                  value={placeName}
                  onChange={(e) => {
                    setPlaceName(e.target.value)
                    if (latLng) {
                      update('location', `${e.target.value} (${latLng.lat.toFixed(6)}, ${latLng.lng.toFixed(6)})`)
                    } else {
                      update('location', e.target.value)
                    }
                  }}
                  placeholder="Tap map to get readable location name..."
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>

              <div className="pm-location-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  {latLng ? (
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      Coordinates: {latLng.lat.toFixed(5)}, {latLng.lng.toFixed(5)}
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

            {errors.submit && <p className="pm-field__error" style={{ marginBottom: '12px' }}>{errors.submit}</p>}
            <button type="submit" className="btn-pm btn-pm--orange btn-pm--full" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit report'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
