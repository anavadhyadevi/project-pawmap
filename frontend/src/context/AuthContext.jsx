import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEY = 'pawmap_auth'

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null) // { user, tokens: { access, refresh } }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setAuth(JSON.parse(stored))
    } catch {
      // ignore corrupt storage
    } finally {
      setLoading(false)
    }
  }, [])

  // Call this with the exact response body from /api/users/login/ or /register/
  // i.e. { user: {...}, tokens: { access, refresh } }
  function login({ user, tokens }) {
    const next = { user, tokens }
    setAuth(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function logout() {
    setAuth(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider
      value={{
        user: auth?.user ?? null,
        accessToken: auth?.tokens?.access ?? null,
        refreshToken: auth?.tokens?.refresh ?? null,
        isLoggedIn: !!auth?.user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider')
  return ctx
}