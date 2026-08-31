import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { apiRequest } from '../lib/api.js'
import './auth.css'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const uid   = searchParams.get('uid')   || ''
  const token = searchParams.get('token') || ''

  const [form, setForm]               = useState({ password: '', confirm: '' })
  const [errors, setErrors]           = useState({})
  const [submitting, setSubmitting]   = useState(false)
  const [serverError, setServerError] = useState('')
  const [done, setDone]               = useState(false)
  const [show, setShow]               = useState({ password: false, confirm: false })

  useEffect(() => {
    if (!uid || !token) {
      setServerError('Invalid or missing reset link. Please request a new one.')
    }
  }, [uid, token])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  function validate() {
    const next = {}
    if (!form.password) next.password = 'Enter a new password.'
    else if (form.password.length < 8) next.password = 'Password must be at least 8 characters.'
    if (!form.confirm) next.confirm = 'Confirm your new password.'
    else if (form.password !== form.confirm) next.confirm = 'Passwords do not match.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')
    if (!validate()) return
    setSubmitting(true)
    try {
      await apiRequest('/users/password-reset/confirm/', {
        method: 'POST',
        body: { uid, token, password: form.password },
      })
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setServerError(err.data?.error || 'Something went wrong. Please request a new reset link.')
    } finally {
      setSubmitting(false)
    }
  }

  function EyeIcon({ open }) {
    return open
      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  }

  return (
    <div>
      <Navbar variant="light" />
      <div className="pm-auth">
        <div className="pm-auth__card">
          {done ? (
            <div style={{ textAlign: 'center' }}>
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
              <h1 className="pm-auth__title" style={{ fontSize: '1.5rem' }}>Password updated!</h1>
              <p className="pm-auth__sub">
                Your password has been changed. Redirecting to login&hellip;
              </p>
              <Link to="/login" className="btn-pm btn-pm--orange btn-pm--full" style={{ marginTop: 8 }}>
                Go to login now
              </Link>
            </div>
          ) : (
            <>
              <p className="eyebrow pm-auth__eyebrow">Account recovery</p>
              <h1 className="pm-auth__title">Set new password</h1>
              <p className="pm-auth__sub">Choose a strong password of at least 8 characters.</p>

              {serverError && (
                <div className="pm-field__error pm-auth__server-error" style={{ marginBottom: 18 }}>
                  {serverError}
                  {(!uid || !token) && (
                    <> &nbsp;<Link to="/forgot-password" style={{ fontWeight: 600, color: 'inherit', textDecoration: 'underline' }}>Request a new link</Link>.</>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className={`pm-field ${errors.password ? 'pm-field--error' : ''}`}>
                  <label htmlFor="rp-password">New password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="rp-password"
                      name="password"
                      type={show.password ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Min. 8 characters"
                      disabled={!uid || !token}
                      style={{ paddingRight: 40 }}
                    />
                    <button type="button"
                      onClick={() => setShow(s => ({ ...s, password: !s.password }))}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                               background: 'none', border: 'none', cursor: 'pointer',
                               color: 'rgba(26,26,23,0.45)', padding: 4 }}
                      aria-label={show.password ? 'Hide' : 'Show'}
                    >
                      <EyeIcon open={show.password} />
                    </button>
                  </div>
                  {errors.password && <p className="pm-field__error">{errors.password}</p>}
                </div>

                <div className={`pm-field ${errors.confirm ? 'pm-field--error' : ''}`}>
                  <label htmlFor="rp-confirm">Confirm new password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="rp-confirm"
                      name="confirm"
                      type={show.confirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={form.confirm}
                      onChange={handleChange}
                      placeholder="Repeat password"
                      disabled={!uid || !token}
                      style={{ paddingRight: 40 }}
                    />
                    <button type="button"
                      onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                               background: 'none', border: 'none', cursor: 'pointer',
                               color: 'rgba(26,26,23,0.45)', padding: 4 }}
                      aria-label={show.confirm ? 'Hide' : 'Show'}
                    >
                      <EyeIcon open={show.confirm} />
                    </button>
                  </div>
                  {errors.confirm && <p className="pm-field__error">{errors.confirm}</p>}
                </div>

                <button
                  type="submit"
                  className="btn-pm btn-pm--orange btn-pm--full"
                  disabled={submitting || !uid || !token}
                  style={{ marginBottom: 18 }}
                >
                  {submitting ? 'Updating…' : 'Set new password'}
                </button>
              </form>

              <p className="pm-auth__switch">
                <Link to="/forgot-password">Request a new reset link</Link>
                {' · '}
                <Link to="/login">Back to login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
