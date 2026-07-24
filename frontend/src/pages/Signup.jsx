import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { apiRequest } from '../lib/api.js'
import './auth.css'

// UI value -> backend ROLE_CHOICES value
const ROLES = [
  { value: 'Reporter', label: 'User', icon: '🐾' },
  { value: 'Volunteer', label: 'Volunteer', icon: '🚑' },
  { value: 'NGO_Admin', label: 'NGO', icon: '🏥' },
]

export default function Signup() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [role, setRole] = useState('Reporter')

  // Shared fields (individual signup: User / Volunteer)
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', password2: '' })

  // NGO-only fields — org name maps to full_name on submit; the rest are
  // captured here but NOT yet sent to the backend (her serializer doesn't
  // accept them yet — flag this to her when NGO onboarding gets built out).
  const [ngoForm, setNgoForm] = useState({
    orgName: '',
    registrationNumber: '',
    address: '',
    contactPerson: '',
  })

  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const isNgo = role === 'NGO_Admin'

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function handleNgoChange(e) {
    const { name, value } = e.target
    setNgoForm((f) => ({ ...f, [name]: value }))
  }

  function validate() {
    const next = {}

    if (isNgo) {
      if (!ngoForm.orgName.trim()) next.orgName = 'Enter your organization name.'
      if (!ngoForm.registrationNumber.trim()) next.registrationNumber = 'Enter your NGO registration number.'
      if (!ngoForm.address.trim()) next.address = 'Enter your organization address.'
      if (!ngoForm.contactPerson.trim()) next.contactPerson = 'Enter a contact person.'
    } else {
      if (!form.fullName.trim()) next.fullName = 'Enter your full name.'
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.'
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) next.phone = 'Enter a 10-digit phone number.'
    if (form.password.length < 8) next.password = 'Use at least 8 characters.'
    if (form.password !== form.password2) next.password2 = 'Passwords do not match.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')
    if (!validate()) return
    setSubmitting(true)
    try {
      const data = await apiRequest('/users/register/', {
        method: 'POST',
        body: {
          full_name: isNgo ? ngoForm.orgName : form.fullName,
          email: form.email,
          phone: form.phone,
          role,
          password: form.password,
          password2: form.password2,
          // NOTE: registrationNumber / address / contactPerson are not yet
          // accepted by the backend serializer — sending them today has no
          // effect until she adds NGO-specific fields to the User model
          // or a separate NGOProfile model + serializer.
        },
      })
      login({ user: data.user, tokens: data.tokens })
      navigate('/')
    } catch (err) {
      const data = err.data
      if (data && typeof data === 'object') {
        const flat = {}
        Object.entries(data).forEach(([key, val]) => {
          flat[key] = Array.isArray(val) ? val[0] : String(val)
        })
        setErrors((prev) => ({ ...prev, ...flat }))
      }
      setServerError(data?.error || data?.detail || 'Could not create account. Check the fields and try again.')
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

          {role !== 'Reporter' && (
            <p className="pm-role-note">
              {role === 'Volunteer'
                ? "Volunteer accounts need approval from the NGO you'll work with before you can claim cases. You'll get a notification once you're reviewed."
                : 'NGO accounts need approval from the PawMap team before you can manage adoptions or approvals. We\u2019ll be in touch after review.'}
            </p>
          )}

          {serverError && <p className="pm-field__error pm-auth__server-error">{serverError}</p>}

          <form onSubmit={handleSubmit} noValidate>
            {isNgo ? (
              <>
                <div className={`pm-field ${errors.orgName ? 'pm-field--error' : ''}`}>
                  <label htmlFor="orgName">Organization name</label>
                  <input
                    id="orgName"
                    name="orgName"
                    value={ngoForm.orgName}
                    onChange={handleNgoChange}
                    placeholder="Bangalore Animal Rescue Trust"
                  />
                  {errors.orgName && <p className="pm-field__error">{errors.orgName}</p>}
                </div>

                <div className={`pm-field ${errors.registrationNumber ? 'pm-field--error' : ''}`}>
                  <label htmlFor="registrationNumber">NGO registration number</label>
                  <input
                    id="registrationNumber"
                    name="registrationNumber"
                    value={ngoForm.registrationNumber}
                    onChange={handleNgoChange}
                    placeholder="e.g. KA/2019/00123"
                  />
                  {errors.registrationNumber && <p className="pm-field__error">{errors.registrationNumber}</p>}
                </div>

                <div className={`pm-field ${errors.address ? 'pm-field--error' : ''}`}>
                  <label htmlFor="address">Organization address</label>
                  <input
                    id="address"
                    name="address"
                    value={ngoForm.address}
                    onChange={handleNgoChange}
                    placeholder="Street, area, city"
                  />
                  {errors.address && <p className="pm-field__error">{errors.address}</p>}
                </div>

                <div className={`pm-field ${errors.contactPerson ? 'pm-field--error' : ''}`}>
                  <label htmlFor="contactPerson">Contact person's name</label>
                  <input
                    id="contactPerson"
                    name="contactPerson"
                    value={ngoForm.contactPerson}
                    onChange={handleNgoChange}
                    placeholder="Who should we reach out to?"
                  />
                  {errors.contactPerson && <p className="pm-field__error">{errors.contactPerson}</p>}
                </div>
              </>
            ) : (
              <div className={`pm-field ${errors.fullName || errors.full_name ? 'pm-field--error' : ''}`}>
                <label htmlFor="fullName">Full name</label>
                <input
                  id="fullName"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Anjali Rao"
                />
                {(errors.fullName || errors.full_name) && (
                  <p className="pm-field__error">{errors.fullName || errors.full_name}</p>
                )}
              </div>
            )}

            <div className={`pm-field ${errors.email ? 'pm-field--error' : ''}`}>
              <label htmlFor="email">{isNgo ? 'Organization email' : 'Email address'}</label>
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

            <div className={`pm-field ${errors.password2 ? 'pm-field--error' : ''}`}>
              <label htmlFor="password2">Confirm password</label>
              <input
                id="password2"
                name="password2"
                type="password"
                value={form.password2}
                onChange={handleChange}
                placeholder="Re-enter your password"
              />
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