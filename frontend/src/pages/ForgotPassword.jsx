import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { apiRequest } from '../lib/api.js'
import './auth.css'

export default function ForgotPassword() {
  const [email, setEmail]       = useState('')
  const [error, setError]       = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Enter your email address.'); return }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Enter a valid email address.'); return }

    setSubmitting(true)
    try {
      await apiRequest('/users/password-reset/request/', {
        method: 'POST',
        body: { email: email.trim().toLowerCase() },
      })
      setSubmitted(true)
    } catch {
      // Even on network errors show the safe message — avoids revealing info
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Navbar variant="light" />
      <div className="pm-auth">
        <div className="pm-auth__card">
          {submitted ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'rgba(34,197,94,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 18px',
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h1 className="pm-auth__title" style={{ fontSize: '1.5rem' }}>Check your inbox</h1>
                <p className="pm-auth__sub" style={{ marginBottom: 0 }}>
                  If <strong>{email}</strong> is registered with PawMap, we've sent a
                  password-reset link. It expires in&nbsp;15&nbsp;minutes.
                </p>
              </div>
              <p className="pm-auth__sub" style={{ fontSize: '0.82rem', textAlign: 'center' }}>
                Didn't get it? Check your spam folder, or&nbsp;
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                           color: 'var(--pm-orange-dark)', fontWeight: 600, fontSize: '0.82rem' }}
                >
                  try again
                </button>.
              </p>
            </>
          ) : (
            <>
              <p className="eyebrow pm-auth__eyebrow">Account recovery</p>
              <h1 className="pm-auth__title">Forgot password?</h1>
              <p className="pm-auth__sub">
                Enter the email you signed up with and we'll send you a
                link to reset your password.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div className={`pm-field ${error ? 'pm-field--error' : ''}`}>
                  <label htmlFor="fp-email">Email address</label>
                  <input
                    id="fp-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoFocus
                  />
                  {error && <p className="pm-field__error">{error}</p>}
                </div>

                <button
                  type="submit"
                  className="btn-pm btn-pm--orange btn-pm--full"
                  disabled={submitting}
                  style={{ marginBottom: 18 }}
                >
                  {submitting ? 'Sending link…' : 'Send reset link'}
                </button>
              </form>

              <p className="pm-auth__switch">
                Remember it? <Link to="/login">Back to login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
