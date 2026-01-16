import { FormEvent, useId, useState } from 'react'
import { register as apiRegister } from '../services/authApi'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import ThemeToggleButton from '../components/ThemeToggleButton'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const msgId = useId()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      await apiRegister({ email, password, first_name: firstName, last_name: lastName })
      setSuccess('Registrazione completata. Ora effettua il login.')
      setTimeout(() => navigate('/area-riservata'), 1000)
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      if (Array.isArray(detail)) {
        const message = detail
          .map((item) => {
            const locParts = Array.isArray(item?.loc) ? item.loc : []
            const field = locParts[locParts.length - 1]
            const msg = item?.msg || 'Errore validazione'
            const translated = translateValidationError(field, msg, item?.type, item?.ctx)
            return translated
          })
          .join(' | ')
        setError(message || 'Errore di registrazione')
      } else {
        setError(detail || 'Errore di registrazione')
      }
    } finally {
      setLoading(false)
    }
  }

  function translateValidationError(field?: string, msg?: string, type?: string, ctx?: any) {
    const fieldLabel = field === 'email'
      ? 'Email'
      : field === 'password'
        ? 'Password'
        : field === 'first_name'
          ? 'Nome'
          : field === 'last_name'
            ? 'Cognome'
            : 'Campo'

    if (type === 'value_error.email' || msg?.toLowerCase().includes('valid email')) {
      return `${fieldLabel} non valida.`
    }
    if (type === 'value_error.any_str.min_length' || msg?.toLowerCase().includes('at least')) {
      const min = ctx?.limit_value
      const fallbackMin = field === 'password' ? 10 : undefined
      const effectiveMin = typeof min === 'number' ? min : fallbackMin
      if (typeof effectiveMin === 'number') {
        return `${fieldLabel} deve avere almeno ${effectiveMin} caratteri.`
      }
      return `${fieldLabel} deve avere almeno il numero minimo di caratteri richiesto.`
    }
    if (type === 'value_error.any_str.max_length' || msg?.toLowerCase().includes('at most')) {
      const max = ctx?.limit_value
      return `${fieldLabel} deve avere al massimo ${max ?? ''} caratteri.`.trim()
    }
    return `${fieldLabel}: ${msg || 'Errore di validazione'}.`
  }

  return (
    <div className="login-bg">
      <div className="cross x1"></div>
      <div className="cross x2"></div>
      <div className="cross x3"></div>
      <div className="cross x4"></div>
      <div className="container" style={{ maxWidth: 480 }}>
        <div className="d-flex" style={{ justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
          <Logo />
          <ThemeToggleButton />
        </div>
        <div className="ds-card ds-card-body">
          <h2>Registrati</h2>
          <form onSubmit={onSubmit} className="d-flex flex-column gap-2" aria-busy={loading}>
            <label className="d-flex flex-column gap-1">
              <span className="label">Nome</span>
              <input
                className="ds-input"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
                disabled={loading}
                aria-invalid={!!error}
                aria-describedby={(error || success) ? msgId : undefined}
              />
            </label>
            <label className="d-flex flex-column gap-1">
              <span className="label">Cognome</span>
              <input
                className="ds-input"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
                autoComplete="family-name"
                disabled={loading}
                aria-invalid={!!error}
                aria-describedby={(error || success) ? msgId : undefined}
              />
            </label>
            <label className="d-flex flex-column gap-1">
              <span className="label">Email</span>
              <input
                className="ds-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                disabled={loading}
                aria-invalid={!!error}
                aria-describedby={(error || success) ? msgId : undefined}
              />
            </label>
            <label className="d-flex flex-column gap-1">
              <span className="label">Password</span>
              <input
                className="ds-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={loading}
                aria-invalid={!!error}
                aria-describedby={(error || success) ? msgId : undefined}
              />
            </label>
            {(error || success) && (
              <div id={msgId} role={error ? 'alert' : undefined} style={{ color: error ? '#ef4444' : '#22c55e' }}>
                {error ?? success}
              </div>
            )}
            <button className="ds-btn ds-btn-primary" disabled={loading} type="submit">
              {loading ? 'Creazione...' : 'Crea account'}
            </button>
          </form>
          <div className="spacer" />
          <div className="label">Hai già un account? <Link to="/area-riservata">Accedi</Link></div>
        </div>
        <div className="spacer" />
        <footer className="app-footer">
          © {new Date().getFullYear()} P-HealthHub. Tutti i diritti riservati.
        </footer>
      </div>
    </div>
  )
}
