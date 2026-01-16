import { FormEvent, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

type LoginFormProps = {
  title?: string
  subtitle?: string
  showRegisterLink?: boolean
  className?: string
}

export default function LoginForm({
  title = 'Accedi',
  subtitle,
  showRegisterLink = true,
  className,
}: LoginFormProps) {
  const { doLogin } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const errorId = useId()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await doLogin(email, password)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Errore di login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={className}>
      <div className="ds-card ds-card-body">
        <h2>{title}</h2>
        {subtitle && <p className="label">{subtitle}</p>}
        <form onSubmit={onSubmit} className="d-flex flex-column gap-2" aria-busy={loading}>
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
              autoFocus
              disabled={loading}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
            />
          </label>
          <label className="d-flex flex-column gap-1">
            <span className="label">Password</span>
            <div className="ds-input-group">
              <input
                className="ds-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
              />
              <button
                className="ds-btn ds-btn-ghost ds-btn-sm"
                type="button"
                onMouseDown={() => setShowPassword(true)}
                onMouseUp={() => setShowPassword(false)}
                onMouseLeave={() => setShowPassword(false)}
                onTouchStart={() => setShowPassword(true)}
                onTouchEnd={() => setShowPassword(false)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault()
                    setShowPassword(true)
                  }
                }}
                onKeyUp={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault()
                    setShowPassword(false)
                  }
                }}
                aria-label="Tieni premuto per mostrare la password"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                    <path
                      d="M3 12c2.5-4 5.5-6 9-6s6.5 2 9 6c-2.5 4-5.5 6-9 6s-6.5-2-9-6Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M15 9l-6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M9.5 10.5a3 3 0 0 1 4 4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                    <path
                      d="M3 12c2.5-4 5.5-6 9-6s6.5 2 9 6c-2.5 4-5.5 6-9 6s-6.5-2-9-6Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </button>
            </div>
          </label>
          {error && <div id={errorId} role="alert" className="form-error">{error}</div>}
          <button className="ds-btn ds-btn-primary" disabled={loading} type="submit">
            {loading ? 'Accesso...' : 'Continua'}
          </button>
        </form>
      </div>
      {showRegisterLink && (
        <>
          <div className="spacer" />
          <div className="label">Non hai un account? <Link to="/register">Registrati</Link></div>
        </>
      )}
    </div>
  )
}
