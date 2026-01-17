import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin, me as apiMe, logout as apiLogout } from '../services/authApi'
import { http } from '../services/http'

type User = { id: number; email: string; first_name: string; last_name: string; roles: string[] }

type AuthState =
  | { step: 'INIT' }
  | { step: 'ANON' }
  | { step: 'AUTH'; token: string; user: User }

type AuthContextType = {
  state: AuthState
  doLogin: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [state, setState] = useState<AuthState>({ step: 'INIT' })
  const stateRef = useRef<AuthState>(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  async function doLogin(email: string, password: string) {
    const { data } = await apiLogin({ email, password })
    if (data?.user) {
      const user = data.user as User
      setState({ step: 'AUTH', token: 'cookie', user })
      navigate('/app')
      return
    }
    throw new Error('Risposta login inattesa')
  }

  async function logout() {
    try {
      await apiLogout()
    } catch {}
    setState({ step: 'ANON' })
    navigate('/area-riservata')
  }

  useEffect(() => {
    const id = http.interceptors.response.use(
      (res) => res,
      (err) => {
        const status = err?.response?.status
        const url = (err?.config?.url as string | undefined) ?? ''
        const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register')
        const curr = stateRef.current
        if (status === 401 && curr.step === 'AUTH' && !isAuthEndpoint) {
          logout()
        }
        return Promise.reject(err)
      }
    )
    return () => {
      http.interceptors.response.eject(id)
    }
  }, [])

  useEffect(() => {
    let active = true
    apiMe()
      .then((user) => {
        if (active && stateRef.current.step === 'INIT') {
          setState({ step: 'AUTH', token: 'cookie', user })
        }
      })
      .catch(() => {
        if (active && stateRef.current.step === 'INIT') {
          setState({ step: 'ANON' })
        }
      })
    return () => {
      active = false
    }
  }, [])

  const value = useMemo(() => ({ state, doLogin, logout }), [state])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('AuthContext non disponibile')
  return ctx
}
