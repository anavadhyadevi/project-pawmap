import { useEffect, useState, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { PawPrint } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE_URL } from '../lib/api.js'
import './medicalRecords.css'

const RECORD_TYPES = [
  { value: 'vaccination',   label: 'Vaccination' },
  { value: 'treatment',     label: 'Treatment' },
  { value: 'diagnosis',     label: 'Diagnosis' },
  { value: 'deworming',     label: 'Deworming' },
  { value: 'sterilisation', label: 'Sterilisation' },
  { value: 'weight',        label: 'Weight Check' },
  { value: 'other',         label: 'Other' },
]

export default function MedicalRecords() {
  const { user, accessToken, isLoggedIn, loading: authLoading } = useAuth()

  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [form, setForm] = useState({ type: 'vaccination', detail: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchAnimals = useCallback(async () => {
    if (!accessToken) return
    try {
      const res = await fetch(`${API_BASE_URL}/animals/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      setAnimals(data.results ?? data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => { fetchAnimals() }, [fetchAnimals])

  if (authLoading) return null
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (!['Volunteer', 'NGO_Admin'].includes(user.role)) return <Navigate to="/" replace />

  const filtered = animals.filter((a) =>
    (a.name || a.species).toLowerCase().includes(search.trim().toLowerCase())
  )

  async function addRecord(animalId) {
    if (!form.detail.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/medical/${animalId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          entry_type: form.type,
          details: form.detail,
        }),
      })
      if (res.ok) {
        await fetchAnimals()
        setForm({ type: 'vaccination', detail: '' })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="pm-mr-page">
        <Navbar variant="light" />
        <div style={{ textAlign: 'center', padding: '80px', color: '#6b7280' }}>
          Loading medical records...
        </div>
      </div>
    )
  }

  return (
    <div className="pm-mr-page">
      <Navbar variant="light" />

      <section className="pm-mr-hero">
        <div className="container-pm">
          <p className="eyebrow pm-mr-hero__eyebrow">Medical records</p>
          <h1 className="pm-mr-hero__title">Track every animal's care history.</h1>
          <p className="pm-mr-hero__sub">
            Vaccinations, treatments, and diagnoses — all linked to the animal, not the case.
          </p>
          <input
            type="text"
            className="pm-mr-search"
            placeholder="Search by animal name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      <section className="pm-mr-list">
        <div className="container-pm">
          {filtered.length === 0 ? (
            <div className="pm-mr-empty">
              <p>No animals match "{search}".</p>
            </div>
          ) : (
            <div className="pm-mr-cards">
              {filtered.map((a) => (
                <article key={a.animal_id} className="pm-mr-card">
                  <button
                    type="button"
                    className="pm-mr-card__summary"
                    onClick={() => setExpandedId(expandedId === a.animal_id ? null : a.animal_id)}
                  >
                    {a.photo ? (
                      <img src={a.photo} alt={a.name || a.species} className="pm-mr-card__photo" />
                    ) : (
                      <div className="pm-mr-card__photo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e5e7eb', fontSize: 24 }}>
                        <PawPrint size={24} aria-hidden="true" />
                      </div>
                    )}
                    <div className="pm-mr-card__info">
                      <h3>{a.name || `Unnamed ${a.species}`}</h3>
                      <p>
                        {a.species} · {a.animal_id} ·{' '}
                        {a.temperament_ratings ? '' : ''}
                        {(a.medical_records_count ?? a.records?.length ?? 0)} record
                        {(a.medical_records_count ?? a.records?.length ?? 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="pm-mr-card__chevron">{expandedId === a.animal_id ? '−' : '+'}</span>
                  </button>

                  {expandedId === a.animal_id && (
                    <AnimalMedicalDetail
                      animal={a}
                      accessToken={accessToken}
                      form={form}
                      setForm={setForm}
                      submitting={submitting}
                      onAdd={() => addRecord(a.animal_id)}
                    />
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

function AnimalMedicalDetail({ animal, accessToken, form, setForm, submitting, onAdd }) {
  const [records, setRecords] = useState([])
  const [loadingRecords, setLoadingRecords] = useState(true)

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/medical/${animal.animal_id}/`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      const data = await res.json()
      setRecords(data.results ?? data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingRecords(false)
    }
  }, [animal.animal_id, accessToken])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  async function handleAdd() {
    await onAdd()
    fetchRecords()
  }

  return (
    <div className="pm-mr-card__details">
      {loadingRecords ? (
        <p style={{ color: '#6b7280', fontSize: 13 }}>Loading records…</p>
      ) : (
        <ul className="pm-mr-timeline">
          {records.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: 13 }}>No records yet.</p>
          ) : (
            records.map((r) => (
              <li key={r.record_id} className="pm-mr-timeline__item">
                <span className={`pm-mr-type pm-mr-type--${r.entry_type}`}>
                  {r.entry_type.charAt(0).toUpperCase() + r.entry_type.slice(1)}
                </span>
                <div>
                  <p className="pm-mr-timeline__detail">{r.details}</p>
                  <p className="pm-mr-timeline__meta">
                    {new Date(r.timestamp).toLocaleDateString()} · {r.vet_name || 'Unknown'}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      <div className="pm-mr-add">
        <h4>Log a new record</h4>
        <div className="pm-mr-add__row">
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          >
            {RECORD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="e.g. Rabies booster administered"
            value={form.detail}
            onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
          />
          <button
            type="button"
            className="btn-pm btn-pm--orange"
            disabled={submitting}
            onClick={handleAdd}
          >
            {submitting ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
