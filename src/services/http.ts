import axios from 'axios'
import { API_URL } from '../config'

export const http = axios.create({ baseURL: API_URL, withCredentials: true })

function makeRequestId() {
  try {
    const cryptoAny = crypto as any
    if (typeof cryptoAny?.randomUUID === 'function') return cryptoAny.randomUUID() as string
  } catch {}
  return `req_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

http.interceptors.request.use((config) => {
  const headers = (config.headers ??= {} as any)
  if (!headers['X-Request-ID']) {
    headers['X-Request-ID'] = makeRequestId()
  }
  return config
})

export function setAuthToken(token: string | null) {
  if (token) {
    http.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete http.defaults.headers.common['Authorization']
  }
}

// Auth cookie is HttpOnly; no token initialization here.
