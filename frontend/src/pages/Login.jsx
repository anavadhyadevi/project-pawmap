import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { apiRequest } from '../lib/api.js'
import './auth.css'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function validate() {
    const next = {}
    if (!form.email.trim()) next.email = 'Enter your email address.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.'
    if (!form.password) next.password = 'Enter your password.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')
    if (!validate()) return
    setSubmitting(true)
    try {
      const data = await apiRequest('/users/login/', {
        method: 'POST',
        body: { email: form.email, password: form.password },
      })
      login({ user: data.user, tokens: data.tokens })
      navigate('/')
    } catch (err) {
      setServerError(err.data?.error || 'Login failed. Check your email and password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Navbar variant="light" />
      <div className="pm-auth">
        <div className="pm-auth__card">
          <p className="eyebrow pm-auth__eyebrow">Welcome back</p>
          <h1 className="pm-auth__title">Log in to PawMap</h1>
          <p className="pm-auth__sub">
            Track cases you've reported, manage claimed rescues, and keep your
            adoption applications up to date.
          </p>

          {serverError && <p className="pm-field__error pm-auth__server-error">{serverError}</p>}

          <form onSubmit={handleSubmit} noValidate>
            <div className={`pm-field ${errors.email ? 'pm-field--error' : ''}`}>
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
              />
              {errors.email && <p className="pm-field__error">{errors.email}</p>}
            </div>

            <div className={`pm-field ${errors.password ? 'pm-field--error' : ''}`}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
              {errors.password && <p className="pm-field__error">{errors.password}</p>}
            </div>

            <div className="pm-auth__row">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" name="remember" /> Remember me
              </label>
              <a href="#" className="pm-auth__forgot">Forgot password?</a>
            </div>

            <button type="submit" className="btn-pm btn-pm--orange btn-pm--full" disabled={submitting}>
              {submitting ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className="pm-auth__switch">
            New to PawMap? <Link to="/signup">Get started</Link>
          </p>
        </div>
      </div>
    </div>
  )
}