import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchMe } from '../services/authApi.js'

const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const raw = localStorage.getItem('aenko_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [token, setToken] = useState(() => localStorage.getItem('aenko_token'))
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('aenko_token')))
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      const t = localStorage.getItem('aenko_token')
      if (!t) {
        setLoading(false)
        setInitialized(true)
        return
      }
      try {
        const me = await fetchMe()
        if (!cancelled) {
          setUser(me)
          localStorage.setItem('aenko_user', JSON.stringify(me))
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem('aenko_token')
          localStorage.removeItem('aenko_user')
          setUser(null)
          setToken(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }
    boot()
    return () => { cancelled = true }
  }, [])

  const saveSession = useCallback((authResponse) => {
    localStorage.setItem('aenko_token', authResponse.token)
    localStorage.setItem('aenko_user', JSON.stringify(authResponse.user))
    setToken(authResponse.token)
    setUser(authResponse.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('aenko_token')
    localStorage.removeItem('aenko_user')
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, token, isAuthenticated: Boolean(token && user), loading, initialized, saveSession, logout }),
    [user, token, loading, initialized, saveSession, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
