import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './auth.css'

const ROLES = [
  { value: 'Reporter',  label: 'User',      icon: '🐾' },
  { value: 'Volunteer', label: 'Volunteer',  icon: '🚑' },
  { value: 'NGO_Admin', label: 'NGO',        icon: '🏥' },
]

export default function Signup() {
  const navigate  = useNavigate()
  const { login } = useAuth()
  const [role, setRole]             = useState('Reporter')
  const [form, setForm]             = useState({ fullName: '', email: '', phone: '', password: '', password2: '' })
  const [errors, setErrors]         = useState({})
  const [apiError, setApiError]     = useState('')
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
    if (form.password !== form.password2) next.password2 = 'Passwords do not match.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setApiError('')

    try {
      const res = await fetch('http://localhost:8000/api/users/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.fullName,
          email:     form.email,
          phone:     form.phone,
          password:  form.password,
          password2: form.password2,
          role:      role,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        // show first validation error from Django
        const firstError = Object.values(data)[0]
        setApiError(Array.isArray(firstError) ? firstError[0] : firstError)
        return
      }

      // Volunteer / NGO_Admin accounts need verification — send to login
      if (role === 'Volunteer' || role === 'NGO_Admin') {
        navigate('/login')
        return
      }

      // Reporter gets logged in immediately
      login(data.user, data.tokens.access)
      navigate('/')

    } catch (err) {
      setApiError('Could not connect to server. Is the backend running?')
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
                type="button" key={r.value} role="radio"
                aria-checked={role === r.value}
                className={`pm-role-option ${role === r.value ? 'pm-role-option--active' : ''}`}
                onClick={() => setRole(r.value)}
              >
                <span className="pm-role-option__icon" aria-hidden="true">{r.icon}</span>
                {r.label}
              </button>
            ))}
          </div>

          {role !== 'Reporter' && (
            <p className="pm-role-note">
              {role === 'Volunteer'
                ? "Volunteer accounts need approval from an NGO before you can claim cases."
                : 'NGO accounts need approval from the PawMap team before you can manage adoptions.'}
            </p>
          )}

          {apiError && (
            <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 6, background: '#fef2f2', border: '1px solid #fca5a5' }}>
              <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={`pm-field ${errors.fullName ? 'pm-field--error' : ''}`}>
              <label htmlFor="fullName">Full name</label>
              <input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Anjali Rao"/>
              {errors.fullName && <p className="pm-field__error">{errors.fullName}</p>}
            </div>

            <div className={`pm-field ${errors.email ? 'pm-field--error' : ''}`}>
              <label htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com"/>
              {errors.email && <p className="pm-field__error">{errors.email}</p>}
            </div>

            <div className={`pm-field ${errors.phone ? 'pm-field--error' : ''}`}>
              <label htmlFor="phone">Phone number</label>
              <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="98765 43210"/>
              {errors.phone && <p className="pm-field__error">{errors.phone}</p>}
            </div>

            <div className={`pm-field ${errors.password ? 'pm-field--error' : ''}`}>
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="At least 8 characters"/>
              {errors.password && <p className="pm-field__error">{errors.password}</p>}
            </div>

            <div className={`pm-field ${errors.password2 ? 'pm-field--error' : ''}`}>
              <label htmlFor="password2">Confirm password</label>
              <input id="password2" name="password2" type="password" value={form.password2} onChange={handleChange} placeholder="Repeat your password"/>
              {errors.password2 && <p className="pm-field__error">{errors.password2}</p>}
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