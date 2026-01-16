import { FormEvent, useEffect, useId, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { Navigate } from 'react-router-dom'
import { http } from '../services/http'
import { sendMfaChallenge } from '../services/authApi'
import FormSelect from '../components/FormSelect'
import Logo from '../components/Logo'
import ThemeToggleButton from '../components/ThemeToggleButton'

export default function MfaPage() {
  const { state, doVerify } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [otpauth, setOtpauth] = useState<{ otpauth_uri: string; secret: string; issuer: string } | null>(null)
  const [method, setMethod] = useState<'totp' | 'email'>('totp')

  const msgId = useId()

  const methods = useMemo(() => (state.step === 'MFA' ? state.methods : []), [state])

  if (state.step !== 'MFA') {
    return <Navigate to="/area-riservata" replace />
  }

  useEffect(() => {
    if (methods.length > 0) {
      setMethod(methods[0].type)
    }
  }, [methods])

  useEffect(() => {
    setError(null)
    setInfo(null)
    setCode('')
  }, [method])

  useEffect(() => {
    if (method !== 'totp') return
    ;(async () => {
      try {
        const { data } = await http.get('/auth/mfa/provisioning')
        setOtpauth(data)
      } catch {
        // ignore
      }
    })()
  }, [method])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      await doVerify(state.email, code, method)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'OTP non valido')
    } finally {
      setLoading(false)
    }
  }

  async function onSendEmailCode() {
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      await sendMfaChallenge({ email: state.email, method: 'email' })
      setInfo('Codice inviato via email.')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Errore invio codice email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-bg">
      <div className="cross x1"></div>
      <div className="cross x2"></div>
      <div className="cross x3"></div>
      <div className="cross x4"></div>
        <div className="container" style={{ maxWidth: 420 }}>
          <div className="d-flex" style={{ justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
            <Logo />
            <ThemeToggleButton />
          </div>
        <div className="ds-card ds-card-body">
          <h2>Verifica MFA</h2>

          <div className="d-flex flex-column gap-2">
            <span className="label">Scegli metodo MFA</span>
            <FormSelect value={method} onChange={(v) => setMethod(v as 'totp' | 'email')} aria-label="Metodo MFA">
              {methods.map(m => (
                <option key={m.type} value={m.type as 'totp' | 'email'}>{m.label}</option>
              ))}
            </FormSelect>
          </div>

          <p className="label">Inserisci il codice OTP ricevuto</p>

          <form onSubmit={onSubmit} className="d-flex flex-column gap-2" aria-busy={loading}>
            <input
              className="ds-input"
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="000000"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              disabled={loading}
              aria-invalid={!!error}
              aria-describedby={(error || info) ? msgId : undefined}
            />
            {(error || info) && (
              <div id={msgId} role={error ? 'alert' : undefined} style={{ color: error ? '#ef4444' : 'var(--muted)' }}>
                {error ?? info}
              </div>
            )}
            <button className="ds-btn ds-btn-primary" disabled={loading} type="submit">
              {loading ? 'Verifica...' : 'Verifica'}
            </button>
          </form>

          {method === 'email' && (
            <div className="d-flex" style={{ marginTop: 8 }}>
              <button className="ds-btn ds-btn-ghost" type="button" onClick={onSendEmailCode} disabled={loading}>
                Invia codice via email
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
