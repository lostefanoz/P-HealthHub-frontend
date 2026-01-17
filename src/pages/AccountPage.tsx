import { FormEvent, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { changeMyPassword } from '../services/authApi'
import ConfirmModal from '../components/ConfirmModal'
import { roleLabel } from '../utils/roles'

export default function AccountPage() {
  const { state } = useAuth()
  if (state.step !== 'AUTH') return null
  const u = state.user
  const [oldp, setOldp] = useState('')
  const [newp, setNewp] = useState('')
  const [conf, setConf] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setMsg(null)
    setErr(null)
    if (newp !== conf) {
      setErr('Le password non coincidono')
      return
    }
    setConfirmReset(true)
  }

  async function runReset() {
    setLoading(true)
    setMsg(null)
    setErr(null)
    try {
      await changeMyPassword({ old_password: oldp, new_password: newp })
      setMsg('Password aggiornata')
      setOldp('')
      setNewp('')
      setConf('')
    } catch (e: any) {
      setErr(e?.response?.data?.detail || 'Operazione non riuscita')
    } finally {
      setLoading(false)
      setConfirmReset(false)
    }
  }

  return (
    <div className="d-flex flex-column" style={{ gap: 16 }}>
      <h1 className="visually-hidden">Account</h1>
      <div className="ds-card account-card">
        <div className="account-avatar">
          {`${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase() || u.email[0].toUpperCase()}
        </div>
        <div className="account-main">
          <div className="label">Il mio account</div>
          <div className="account-name">{u.first_name} {u.last_name}</div>
          <div className="account-email">{u.email}</div>
          <div className="account-meta">
            {u.roles.map(r => (
              <span key={r} className="account-role-pill" data-role={r}>{roleLabel(r)}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="ds-card ds-card-body">
        <h3>Reset password</h3>
        <form className="d-flex flex-column gap-2" onSubmit={onSubmit}>
          <input
            className="ds-input"
            type="password"
            placeholder="Password attuale"
            value={oldp}
            onChange={e => setOldp(e.target.value)}
            required
            aria-label="Password attuale"
          />
          <input
            className="ds-input"
            type="password"
            placeholder="Nuova password"
            value={newp}
            onChange={e => setNewp(e.target.value)}
            required
            aria-label="Nuova password"
          />
          <input
            className="ds-input"
            type="password"
            placeholder="Conferma nuova password"
            value={conf}
            onChange={e => setConf(e.target.value)}
            required
            aria-label="Conferma nuova password"
          />
          {err && <div style={{ color: '#dc2626' }}>{err}</div>}
          {msg && <div style={{ color: '#16a34a' }}>{msg}</div>}
          <button className="ds-btn ds-btn-primary" disabled={loading}>{loading ? 'Aggiorno...' : 'Aggiorna password'}</button>
        </form>
      </div>
      {confirmReset && (
        <ConfirmModal
          title="Conferma reset password"
          message="Confermi il reset della password del tuo account?"
          confirmLabel="Conferma"
          onCancel={() => setConfirmReset(false)}
          onConfirm={runReset}
        />
      )}
    </div>
  )
}
