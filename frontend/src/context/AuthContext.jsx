import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

const USER_KEY  = 'pawmap_user'
const TOKEN_KEY = 'pawmap_token'

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const storedUser  = localStorage.getItem(USER_KEY)
      const storedToken = localStorage.getItem(TOKEN_KEY)
      if (storedUser)  setUser(JSON.parse(storedUser))
      if (storedToken) setToken(storedToken)
    } catch {
      // ignore corrupt storage
    } finally {
      setLoading(false)
    }
  }, [])

  function login(userData, accessToken) {
    setUser(userData)
    setToken(accessToken)
    localStorage.setItem(USER_KEY,  JSON.stringify(userData))
    localStorage.setItem(TOKEN_KEY, accessToken)
  }

  function logout() {
    setUser(null)
    setToken(null)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(TOKEN_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn: !!user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider')
  return ctx
}