import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './auth.css'

const ROLES = [
  { value: 'user', label: 'User', icon: '🐾' },
  { value: 'volunteer', label: 'Volunteer', icon: '🚑' },
  { value: 'ngo', label: 'NGO', icon: '🏥' },
]

export default function Signup() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [role, setRole] = useState('user')
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function validate() {
    const next = {}
    if (!form.fullName.trim()) next.fullName = 'Enter your full name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.'
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) next.phone = 'Enter a 10-digit phone number.'
    if (form.password.length < 8) next.password = 'Use at least 8 characters.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      // Wire this up to POST /api/auth/register/ once the backend is available.
      // Volunteer / NGO accounts come back in a Pending state until reviewed (SDR 7.1).
      // const res = await fetch('/api/auth/register/', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ ...form, role }),
      // })
      await new Promise((r) => setTimeout(r, 500))

      if (role === 'user') {
        // Regular users get full access right away.
        login({ name: form.fullName, email: form.email, role })
        navigate('/')
      } else {
        // Volunteer / NGO accounts wait on approval — send them to log in instead.
        navigate('/login')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Navbar variant="light" />
      <div className="pm-auth">
        <div className="pm-auth__card">
          <p className="eyebrow pm-auth__eyebrow">Get started</p>
          <h1 className="pm-auth__title">Create your account</h1>
          <p className="pm-auth__sub">Choose how you'll use PawMap.</p>

          <div className="pm-role-group" role="radiogroup" aria-label="Account type">
            {ROLES.map((r) => (
              <button
                type="button"
                key={r.value}
                role="radio"
                aria-checked={role === r.value}
                className={`pm-role-option ${role === r.value ? 'pm-role-option--active' : ''}`}
                onClick={() => setRole(r.value)}
              >
                <span className="pm-role-option__icon" aria-hidden="true">{r.icon}</span>
                {r.label}
              </button>
            ))}
          </div>

          {role !== 'user' && (
            <p className="pm-role-note">
              {role === 'volunteer'
                ? "Volunteer accounts need approval from the NGO you'll work with before you can claim cases. You'll get a notification once you're reviewed."
                : 'NGO accounts need approval from the PawMap team before you can manage adoptions or approvals. We\u2019ll be in touch after review.'}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={`pm-field ${errors.fullName ? 'pm-field--error' : ''}`}>
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Anjali Rao"
              />
              {errors.fullName && <p className="pm-field__error">{errors.fullName}</p>}
            </div>

            <div className={`pm-field ${errors.email ? 'pm-field--error' : ''}`}>
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
              />
              {errors.email && <p className="pm-field__error">{errors.email}</p>}
            </div>

            <div className={`pm-field ${errors.phone ? 'pm-field--error' : ''}`}>
              <label htmlFor="phone">Phone number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="98765 43210"
              />
              {errors.phone && <p className="pm-field__error">{errors.phone}</p>}
            </div>

            <div className={`pm-field ${errors.password ? 'pm-field--error' : ''}`}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
              />
              {errors.password && <p className="pm-field__error">{errors.password}</p>}
            </div>

            <button type="submit" className="btn-pm btn-pm--orange btn-pm--full" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="pm-auth__switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}