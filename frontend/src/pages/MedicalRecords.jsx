import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { MEDICAL_ANIMALS } from '../data/medicalRecords.js'
import './medicalRecords.css'

const RECORD_TYPES = ['Vaccination', 'Treatment', 'Diagnosis']

export default function MedicalRecords() {
  const { user, isLoggedIn } = useAuth()

  // Volunteers and NGO admins can view/log records. Reporters can't —
  // this isn't public data, and there's no Vet signup path in the UI yet
  // (the role exists on the backend, but we haven't built that flow).
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (!['Volunteer', 'NGO_Admin'].includes(user.role)) return <Navigate to="/" replace />

  const [animals, setAnimals] = useState(MEDICAL_ANIMALS)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [form, setForm] = useState({ type: 'Vaccination', detail: '' })

  const filtered = useMemo(
    () => animals.filter((a) => a.name.toLowerCase().includes(search.trim().toLowerCase())),
    [animals, search]
  )

  function addRecord(animalId) {
    if (!form.detail.trim()) return
    // Wire this up to POST /api/medical/records/ once the backend exposes
    // it — the `medical` app currently has models.py only, no API yet.
    const newRecord = {
      id: `MR-${Math.floor(Math.random() * 9000 + 1000)}`,
      date: new Date().toISOString().slice(0, 10),
      type: form.type,
      detail: form.detail,
      vetName: user.full_name,
    }
    setAnimals((prev) =>
      prev.map((a) => (a.animalId === animalId ? { ...a, records: [newRecord, ...a.records] } : a))
    )
    setForm({ type: 'Vaccination', detail: '' })
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
                <article key={a.animalId} className="pm-mr-card">
                  <button
                    type="button"
                    className="pm-mr-card__summary"
                    onClick={() => setExpandedId(expandedId === a.animalId ? null : a.animalId)}
                  >
                    <img src={a.photo} alt={a.name} className="pm-mr-card__photo" />
                    <div className="pm-mr-card__info">
                      <h3>{a.name}</h3>
                      <p>{a.species} · {a.animalId} · {a.records.length} record{a.records.length !== 1 ? 's' : ''}</p>
                    </div>
                    <span className="pm-mr-card__chevron">{expandedId === a.animalId ? '−' : '+'}</span>
                  </button>

                  {expandedId === a.animalId && (
                    <div className="pm-mr-card__details">
                      <ul className="pm-mr-timeline">
                        {a.records.map((r) => (
                          <li key={r.id} className="pm-mr-timeline__item">
                            <span className={`pm-mr-type pm-mr-type--${r.type.toLowerCase()}`}>{r.type}</span>
                            <div>
                              <p className="pm-mr-timeline__detail">{r.detail}</p>
                              <p className="pm-mr-timeline__meta">{r.date} · {r.vetName}</p>
                            </div>
                          </li>
                        ))}
                      </ul>

                      <div className="pm-mr-add">
                        <h4>Log a new record</h4>
                        <div className="pm-mr-add__row">
                          <select
                            value={form.type}
                            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                          >
                            {RECORD_TYPES.map((t) => (
                              <option key={t} value={t}>{t}</option>
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
                            onClick={() => addRecord(a.animalId)}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
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