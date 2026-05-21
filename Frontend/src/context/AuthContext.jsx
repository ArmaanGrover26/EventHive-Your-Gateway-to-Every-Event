import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount: verify stored token with the server
  useEffect(() => {
    const token = localStorage.getItem('eh_token')
    if (!token) {
      setLoading(false)
      return
    }
    authAPI.me()
      .then((u) => setUser(u))
      .catch(() => {
        // Token invalid/expired – clear storage
        localStorage.removeItem('eh_token')
        localStorage.removeItem('eh_user')
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const data = await authAPI.login({ email, password })
    localStorage.setItem('eh_token', data.token)
    localStorage.setItem('eh_user',  JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const register = async (formData) => {
    const data = await authAPI.register(formData)
    localStorage.setItem('eh_token', data.token)
    localStorage.setItem('eh_user',  JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('eh_token')
    localStorage.removeItem('eh_user')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
