import { useState, useEffect, useCallback } from 'react'
import { Navigate, Link } from 'react-router-dom'
import {
  PawPrint, PlusCircle, ExternalLink, AlertTriangle,
  Users, CheckCircle, ClipboardList, Activity,
  TrendingUp, Zap, MapPin, Clock, ChevronDown, ChevronUp
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './ngoDashboard.css'

const API = 'http://localhost:8000/api'

const STATUS_META = {
  Open:        { label: 'Open',        color: '#f97316', bg: '#fff7ed', border: '#fdba74' },
  In_Progress: { label: 'In Progress', color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd' },
  On_Site:     { label: 'On Site',     color: '#0ea5e9', bg: '#f0f9ff', border: '#7dd3fc' },
  Resolved:    { label: 'Resolved',    color: '#22c55e', bg: '#f0fdf4', border: '#86efac' },
  Escalated:   { label: 'Escalated',   color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
  Unresolved:  { label: 'Unresolved',  color: '#6b7280', bg: '#f9fafb', border: '#d1d5db' },
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

function Initials({ name, size = 38, bg = '#f97316' }) {
  const letters = name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: bg, color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.38,
    }}>
      {letters}
    </div>
  )
}

function SeverityDots({ level }) {
  const color = level >= 4 ? '#ef4444' : level >= 3 ? '#f97316' : '#22c55e'
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: i <= level ? color : '#e5e7eb',
        }} />
      ))}
    </div>
  )
}

// ─── Register Animal form ────────────────────────────────────────────────────
function RegisterAnimalForm({ accessToken, onCreated }) {
  const [form, setForm] = useState({
    name: '', species: 'Dog', breed: '', estimated_age: '', ownership_status: 'Stray'
  })
  const [photo, setPhoto] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true); setError('')
    try {
      const body = new FormData()
      Object.entries({ species: form.species, breed: form.breed || 'Unknown',
        estimated_age: form.estimated_age || 'Unknown', ownership_status: form.ownership_status })
        .forEach(([k, v]) => body.append(k, v))
      if (form.name) body.append('name', form.name)
      if (photo) body.append('photo', photo)
      const res = await fetch(`${API}/animals/`, {
        method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body,
      })
      if (!res.ok) throw new Error(JSON.stringify(await res.json().catch(() => ({}))))
      onCreated(await res.json())
      setForm({ name: '', species: 'Dog', breed: '', estimated_age: '', ownership_status: 'Stray' })
      setPhoto(null)
    } catch (err) { setError(err.message) }
    finally { setSubmitting(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="pm-ngo-form-panel">
      <div className="pm-ngo-form-grid">
        {[
          { label: 'Name (optional)', key: 'name', placeholder: 'e.g. Brownie' },
          { label: 'Breed', key: 'breed', placeholder: 'e.g. Indie, Labrador mix' },
          { label: 'Estimated age', key: 'estimated_age', placeholder: 'e.g. ~2 years, Puppy' },
        ].map(({ label, key, placeholder }) => (
          <div key={key} className="pm-ngo-form-field">
            <label>{label}</label>
            <input placeholder={placeholder} value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
          </div>
        ))}
        <div className="pm-ngo-form-field">
          <label>Species *</label>
          <select value={form.species} onChange={e => setForm(f => ({ ...f, species: e.target.value }))}>
            {['Dog','Cat','Cow','Bird','Other'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="pm-ngo-form-field">
          <label>Ownership status</label>
          <select value={form.ownership_status} onChange={e => setForm(f => ({ ...f, ownership_status: e.target.value }))}>
            {['Stray','Abandoned','Unknown'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="pm-ngo-form-field">
          <label>Photo</label>
          <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} />
        </div>
      </div>
      {error && <p className="pm-ngo-form-error">{error}</p>}
      <button type="submit" className="btn-pm btn-pm--orange" disabled={submitting} style={{ marginTop: 16 }}>
        {submitting ? 'Registering…' : 'Register animal'}
      </button>
    </form>
  )
}

// ─── Case Row ────────────────────────────────────────────────────────────────
function CaseRow({ c, isNew }) {
  const meta = STATUS_META[c.status] || STATUS_META['Open']
  return (
    <div className="pm-ngo-case-row">
      {/* Photo thumbnail */}
      <div className="pm-ngo-case-row__thumb">
        {c.photo
          ? <img src={c.photo} alt={c.species} onError={e => e.target.style.display = 'none'} />
          : <PawPrint size={20} color="#d1d5db" />}
      </div>

      {/* Main info */}
      <div className="pm-ngo-case-row__body">
        <div className="pm-ngo-case-row__top">
          {/* Small dot instead of coloured left border */}
          <span className="pm-ngo-case-dot" style={{ background: meta.color }} />
          <span className="pm-ngo-case-row__species">{c.species}{c.breed && c.breed !== 'Unknown' ? ` · ${c.breed}` : ''}</span>
          {isNew && <span className="pm-ngo-new-pill">New</span>}
        </div>
        <span className="pm-ngo-case-row__id">{c.case_id}</span>
        <div className="pm-ngo-case-row__meta">
          <SeverityDots level={c.severity || 1} />
          {c.volunteer_name
            ? <span className="pm-ngo-case-row__vol">{c.volunteer_name.split(' ')[0]}</span>
            : <span className="pm-ngo-case-row__unassigned">Unassigned</span>}
          {c.created_at && (
            <span className="pm-ngo-case-row__time">
              <Clock size={11} /> {timeAgo(c.created_at)}
            </span>
          )}
        </div>
      </div>

      {/* Status badge */}
      <span className="pm-ngo-case-row__status"
        style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
        {meta.label}
      </span>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function NgoDashboard() {
  const { user, accessToken, isLoggedIn, loading: authLoading } = useAuth()

  const [cases, setCases]           = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [listings, setListings]     = useState([])
  const [animals, setAnimals]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [verifying, setVerifying]   = useState(null)
  const [approvalError, setApprovalError] = useState('')
  const [postingId, setPostingId]   = useState(null)
  const [postError, setPostError]   = useState('')
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [activeTab, setActiveTab]   = useState('cases')

  const fetchAll = useCallback(async () => {
    if (!accessToken) return
    try {
      const h = { Authorization: `Bearer ${accessToken}` }
      const [cR, vR, lR, aR] = await Promise.all([
        fetch(`${API}/cases/`,           { headers: h }).then(r => r.json()),
        fetch(`${API}/users/volunteers/`,{ headers: h }).then(r => r.json()),
        fetch(`${API}/adoption/`,        { headers: h }).then(r => r.json()),
        fetch(`${API}/animals/`,         { headers: h }).then(r => r.json()),
      ])
      setCases(cR.results ?? cR)
      setVolunteers(vR.results ?? vR ?? [])
      setListings(lR.results ?? lR)
      setAnimals(aR.results ?? aR)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [accessToken])

  useEffect(() => { fetchAll() }, [fetchAll])

  if (authLoading) return null
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (user?.role !== 'NGO_Admin') return <Navigate to="/" replace />

  const pending        = volunteers.filter(v => !v.is_verified)
  const approved       = volunteers.filter(v => v.is_verified)
  const resolvedCases  = cases.filter(c => c.status === 'Resolved').length
  const escalatedCases = cases.filter(c => c.status === 'Escalated').length
  const activeListings = listings.filter(l => l.status === 'Active').length
  const newCases       = cases.filter(c =>
    (Date.now() - new Date(c.created_at).getTime()) / 36e5 <= 24 && !c.volunteer)
  const listedIds      = new Set(listings.map(l => l.animal?.animal_id))
  const unlistedAnimals = animals.filter(a => !listedIds.has(a.animal_id))

  const STATS = [
    { icon: ClipboardList, label: 'Total cases',    value: cases.length,     accent: '#3b82f6' },
    { icon: AlertTriangle, label: 'Open',           value: cases.filter(c => c.status === 'Open').length, accent: '#f97316' },
    { icon: Zap,           label: 'Escalated',      value: escalatedCases,   accent: '#ef4444' },
    { icon: CheckCircle,   label: 'Resolved',       value: resolvedCases,    accent: '#22c55e' },
    { icon: Users,         label: 'Volunteers',     value: approved.length,  accent: '#8b5cf6' },
    { icon: Activity,      label: 'Active listings',value: activeListings,   accent: '#0ea5e9' },
  ]

  async function approveVolunteer(userId) {
    setVerifying(userId); setApprovalError('')
    try {
      const res = await fetch(`${API}/users/${userId}/verify/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ is_verified: true }),
      })
      if (res.ok) {
        setVolunteers(prev => prev.map(v => v.id === userId ? { ...v, is_verified: true } : v))
        setExpandedId(null)
      } else {
        const d = await res.json().catch(() => ({}))
        setApprovalError(d.error || 'Could not approve this volunteer.')
      }
    } catch (err) { console.error(err) }
    finally { setVerifying(null) }
  }

  async function postForAdoption(animal) {
    setPostingId(animal.animal_id); setPostError('')
    try {
      if (animal.adoption_status !== 'Available') {
        const r = await fetch(`${API}/animals/${animal.animal_id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ adoption_status: 'Available' }),
        })
        if (!r.ok) throw new Error('Could not mark animal as Available.')
      }
      const r2 = await fetch(`${API}/adoption/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ animal: animal.animal_id }),
      })
      if (!r2.ok) {
        const d = await r2.json().catch(() => ({}))
        throw new Error(d.error || 'Could not create listing.')
      }
      await fetchAll()
    } catch (err) { setPostError(err.message) }
    finally { setPostingId(null) }
  }

  if (loading) return (
    <div className="pm-ngo-page">
      <Navbar variant="light" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12, color: '#6b7280' }}>
        <div className="pm-ngo-spinner" /> Loading dashboard…
      </div>
    </div>
  )

  return (
    <div className="pm-ngo-page">
      <Navbar variant="light" />

      {/* HERO */}
      <section className="pm-ngo-hero">
        <div className="container-pm pm-ngo-hero__inner">
          <div>
            <p className="eyebrow pm-ngo-hero__eyebrow">NGO Dashboard</p>
            <h1 className="pm-ngo-hero__title">{user?.full_name}</h1>
            <p className="pm-ngo-hero__sub">
              Manage volunteers, monitor rescue activity, and publish animals for adoption.
            </p>
            {!user?.is_verified && (
              <p className="pm-ngo-pending-note">
                Your NGO account is pending verification. Decisions won't be saved until approved.
              </p>
            )}
            {approvalError && (
              <p className="pm-ngo-pending-note" style={{ borderColor: '#fca5a5', background: '#fef2f2', color: '#b91c1c' }}>
                {approvalError}
              </p>
            )}
          </div>
          <Link to="/adopt" className="btn-pm btn-pm--outline-light pm-ngo-hero__action">
            <TrendingUp size={15} /> View public listings
          </Link>
        </div>
      </section>

      {/* STATS */}
      <div className="pm-ngo-stats-bar">
        <div className="container-pm pm-ngo-stats-bar__inner">
          {STATS.map(({ icon: Icon, label, value, accent }) => (
            <div key={label} className="pm-ngo-stat" style={{ '--accent': accent }}>
              <div className="pm-ngo-stat__icon"><Icon size={16} /></div>
              <div>
                <span className="pm-ngo-stat__val">{value}</span>
                <span className="pm-ngo-stat__lbl">{label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BODY */}
      <section className="pm-ngo-body">
        <div className="container-pm">

          {/* TABS */}
          <div className="pm-ngo-tabs">
            <button type="button"
              className={`pm-ngo-tab ${activeTab === 'cases' ? 'active' : ''}`}
              onClick={() => setActiveTab('cases')}>
              Cases &amp; Volunteers
              {newCases.length > 0 && <span className="pm-ngo-badge">{newCases.length} new</span>}
            </button>
            <button type="button"
              className={`pm-ngo-tab ${activeTab === 'adoption' ? 'active' : ''}`}
              onClick={() => setActiveTab('adoption')}>
              Adoption Management
              {unlistedAnimals.length > 0 && <span className="pm-ngo-badge">{unlistedAnimals.length}</span>}
            </button>
          </div>

          {/* ── CASES & VOLUNTEERS ─────────────────────────────── */}
          {activeTab === 'cases' && (
            <div className="pm-ngo-content">

              {/* Alert for unclaimed */}
              {newCases.length > 0 && (
                <div className="pm-ngo-alert">
                  <AlertTriangle size={15} />
                  <span><strong>{newCases.length} case{newCases.length > 1 ? 's' : ''}</strong> reported in the last 24 hours with no volunteer assigned.</span>
                </div>
              )}

              {/* New cases */}
              {newCases.length > 0 && (
                <div className="pm-ngo-section">
                  <h2 className="pm-ngo-section__title">
                    <AlertTriangle size={16} color="#ef4444" /> Unclaimed cases
                  </h2>
                  <div className="pm-ngo-case-list">
                    {newCases.map(c => <CaseRow key={c.case_id} c={c} isNew />)}
                  </div>
                </div>
              )}

              {/* Pending applications */}
              <div className="pm-ngo-section">
                <h2 className="pm-ngo-section__title">
                  <Users size={16} /> Pending applications
                  {pending.length > 0 && <span className="pm-ngo-section__count">{pending.length}</span>}
                </h2>
                {pending.length === 0 ? (
                  <div className="pm-ngo-empty">
                    <CheckCircle size={24} color="#22c55e" />
                    <p>No pending applications right now.</p>
                  </div>
                ) : (
                  <div className="pm-ngo-vol-list">
                    {pending.map(v => (
                      <article key={v.user_id} className="pm-ngo-vol-card">
                        <button type="button" className="pm-ngo-vol-card__header"
                          onClick={() => setExpandedId(expandedId === v.user_id ? null : v.user_id)}>
                          <Initials name={v.full_name} />
                          <div className="pm-ngo-vol-card__info">
                            <p className="pm-ngo-vol-card__name">{v.full_name}</p>
                            <p className="pm-ngo-vol-card__meta">{v.email} · {v.phone || 'No phone'}</p>
                          </div>
                          {expandedId === v.user_id ? <ChevronUp size={18} color="#9ca3af" /> : <ChevronDown size={18} color="#9ca3af" />}
                        </button>
                        {expandedId === v.user_id && (
                          <div className="pm-ngo-vol-card__body">
                            <div className="pm-ngo-vol-card__fields">
                              <div><label>Email</label><p>{v.email}</p></div>
                              <div><label>Phone</label><p>{v.phone || '—'}</p></div>
                              <div><label>Role</label><p>{v.role}</p></div>
                            </div>
                            <div className="pm-ngo-vol-card__actions">
                              <button type="button" className="btn-pm btn-pm--orange"
                                disabled={verifying === v.id || !user?.is_verified}
                                onClick={() => approveVolunteer(v.id)}>
                                {!user?.is_verified ? 'Verification required' : verifying === v.id ? 'Approving…' : 'Approve'}
                              </button>
                              <button type="button" className="pm-ngo-dismiss"
                                onClick={() => setExpandedId(null)}>Dismiss</button>
                            </div>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </div>

              {/* Approved volunteers */}
              {approved.length > 0 && (
                <div className="pm-ngo-section">
                  <h2 className="pm-ngo-section__title">
                    <CheckCircle size={16} color="#22c55e" /> Approved volunteers
                    <span className="pm-ngo-section__count pm-ngo-section__count--green">{approved.length}</span>
                  </h2>
                  <div className="pm-ngo-approved-grid">
                    {approved.map(v => (
                      <div key={v.user_id} className="pm-ngo-approved-chip">
                        <Initials name={v.full_name} size={32} bg="#22c55e" />
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 13, margin: 0, color: '#111' }}>{v.full_name}</p>
                          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{v.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent cases */}
              <div className="pm-ngo-section">
                <h2 className="pm-ngo-section__title">
                  <ClipboardList size={16} /> Recent cases
                  <span className="pm-ngo-section__count">{Math.min(cases.length, 10)}</span>
                </h2>
                {cases.length === 0 ? (
                  <div className="pm-ngo-empty"><p>No cases yet.</p></div>
                ) : (
                  <div className="pm-ngo-case-list">
                    {[...cases]
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                      .slice(0, 10)
                      .map(c => <CaseRow key={c.case_id} c={c} />)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ADOPTION ───────────────────────────────────────── */}
          {activeTab === 'adoption' && (
            <div className="pm-ngo-content">

              {/* Register animal */}
              <div className="pm-ngo-section">
                <div className="pm-ngo-section__header-row">
                  <h2 className="pm-ngo-section__title" style={{ margin: 0 }}>
                    <PawPrint size={16} /> Register an animal
                  </h2>
                  <button type="button" className="pm-ngo-outline-btn"
                    onClick={() => setShowRegisterForm(v => !v)}>
                    <PlusCircle size={15} /> {showRegisterForm ? 'Cancel' : 'Add animal'}
                  </button>
                </div>
                {!showRegisterForm && (
                  <p style={{ fontSize: 13, color: '#9ca3af', margin: '6px 0 0' }}>
                    Add an animal to the system — then post it for adoption below.
                  </p>
                )}
                {showRegisterForm && (
                  <RegisterAnimalForm
                    accessToken={accessToken}
                    onCreated={a => { setAnimals(p => [a, ...p]); setShowRegisterForm(false) }}
                  />
                )}
              </div>

              {/* Animals not yet listed */}
              <div className="pm-ngo-section">
                <h2 className="pm-ngo-section__title">
                  <ClipboardList size={16} /> Animals not yet listed
                  <span className="pm-ngo-section__count">{unlistedAnimals.length}</span>
                </h2>
                <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16, marginTop: 0 }}>
                  Click "Post for adoption" to publish an animal on the public listings page.
                </p>
                {postError && <p className="pm-ngo-form-error">{postError}</p>}
                {unlistedAnimals.length === 0 ? (
                  <div className="pm-ngo-empty">
                    <CheckCircle size={24} color="#22c55e" />
                    <p>All registered animals are already listed.</p>
                  </div>
                ) : (
                  <div className="pm-ngo-animal-grid">
                    {unlistedAnimals.map(a => (
                      <div key={a.animal_id} className="pm-ngo-animal-card">
                        <div className="pm-ngo-animal-card__photo">
                          {(a.photo || a.case_photo)
                            ? <img src={a.photo || a.case_photo} alt={a.species} onError={e => e.target.style.display = 'none'} />
                            : <PawPrint size={30} color="#d1d5db" />}
                        </div>
                        <div className="pm-ngo-animal-card__body">
                          <p className="pm-ngo-animal-card__name">{a.name || `${a.species} ${a.animal_id}`}</p>
                          <p className="pm-ngo-animal-card__sub">{a.breed !== 'Unknown' ? a.breed : a.species} · {a.estimated_age || 'Unknown age'}</p>
                          <p className="pm-ngo-animal-card__sub" style={{ color: '#d1d5db' }}>
                            {a.case_id ? `Case ${a.case_id}` : 'Standalone'} · {a.ownership_status}
                          </p>
                          <span className={`pm-ngo-adopt-pill pm-ngo-adopt-pill--${a.adoption_status.toLowerCase().replace('_','-')}`}>
                            {a.adoption_status.replace('_', ' ')}
                          </span>
                        </div>
                        <button type="button" className="pm-ngo-animal-card__btn btn-pm btn-pm--orange"
                          disabled={postingId === a.animal_id || !user?.is_verified}
                          onClick={() => postForAdoption(a)}>
                          {postingId === a.animal_id ? 'Posting…' : 'Post for adoption'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active listings */}
              <div className="pm-ngo-section">
                <h2 className="pm-ngo-section__title">
                  <Activity size={16} /> Active listings
                  <span className="pm-ngo-section__count pm-ngo-section__count--green">{activeListings}</span>
                </h2>
                {listings.filter(l => l.status === 'Active').length === 0 ? (
                  <div className="pm-ngo-empty"><p>No active listings yet.</p></div>
                ) : (
                  <div className="pm-ngo-listing-list">
                    {listings.filter(l => l.status === 'Active').map(l => (
                      <div key={l.listing_id} className="pm-ngo-listing-row">
                        <div className="pm-ngo-listing-row__thumb">
                          {(l.animal?.photo || l.animal?.case_photo)
                            ? <img src={l.animal.photo || l.animal.case_photo} alt={l.animal?.species} onError={e => e.target.style.display = 'none'} />
                            : <PawPrint size={18} color="#d1d5db" />}
                        </div>
                        <div className="pm-ngo-listing-row__info">
                          <p className="pm-ngo-listing-row__name">
                            {l.animal?.name || `${l.animal?.species} · ${l.listing_id}`}
                          </p>
                          <p className="pm-ngo-listing-row__meta">
                            {l.animal?.breed !== 'Unknown' ? l.animal?.breed : l.animal?.species} · {l.interest_count} interested
                          </p>
                        </div>
                        <Link to={`/adopt`}
                          className="pm-ngo-outline-btn"
                          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                          View live <ExternalLink size={12} />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
