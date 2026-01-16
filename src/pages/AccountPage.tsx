import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { changeMyPassword, getMfaProvisioning, regenerateMfaSecret, listMfaDevices, addMfaDevice, deleteMfaDevice, getMfaStatus, setMfaEnabled } from '../services/authApi'
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
  const [mfa, setMfa] = useState<{ otpauth_uri: string; secret: string; issuer: string } | null>(null)
  const [devices, setDevices] = useState<Array<{ id: number; name: string; added_at: string; verified: boolean }>>([])
  const [devName, setDevName] = useState('')
  const [devCode, setDevCode] = useState('')
  const [mfaEnabled, setMfaEnabledState] = useState<boolean>(true)
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [pwdInput, setPwdInput] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [confirm, setConfirm] = useState<null | { type: 'password' | 'regenSecret' | 'deleteDevice'; deviceId?: number; deviceName?: string }>(null)

  async function loadDevices() {
    try { const d = await listMfaDevices(); setDevices(d) } catch {}
  }
  useEffect(() => { (async () => { try { const st = await getMfaStatus(); setMfaEnabledState(st.enabled) } catch {}; await loadDevices() })() }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setMsg(null); setErr(null)
    if (newp !== conf) { setErr('Le password non coincidono'); return }
    setConfirm({ type: 'password' })
  }

  async function runConfirm() {
    const c = confirm
    if (!c) return
    try {
      if (c.type === 'password') {
        setLoading(true)
        await changeMyPassword({ old_password: oldp, new_password: newp })
        setMsg('Password aggiornata')
        setOldp(''); setNewp(''); setConf('')
      }
      if (c.type === 'regenSecret') {
        const prov = await regenerateMfaSecret()
        setMfa(prov)
      }
      if (c.type === 'deleteDevice' && c.deviceId != null) {
        await deleteMfaDevice(c.deviceId)
        await loadDevices()
      }
      setConfirm(null)
    } catch (e: any) {
      setErr(e?.response?.data?.detail || 'Operazione non riuscita')
    } finally {
      setLoading(false)
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
      <div className="ds-card ds-card-body">
        <h3>Configura MFA (Authenticator App)</h3>
        <div className="d-flex flex-column gap-2">
          <div className="d-flex" style={{ alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <label className="d-flex align-items-center gap-2">
              <input className="form-check-input" type="checkbox" checked={mfaEnabled} onChange={async (e) => {
                const next = e.target.checked
                setErr(null); setMsg(null)
                try {
                  if (!next) {
                    // open modal to request password; do not toggle yet
                    (e.target as HTMLInputElement).checked = true
                    setShowDisableModal(true)
                    return
                  } else {
                    await setMfaEnabled({ enabled: true })
                    setMfaEnabledState(true)
                    setMsg('MFA abilitato')
                  }
                } catch (er: any) {
                  setErr(er?.response?.data?.detail || 'Errore aggiornamento MFA'); (e.target as HTMLInputElement).checked = !next
                }
              }} />
              <span className="form-check-label">{mfaEnabled ? 'MFA Abilitato' : 'MFA Disabilitato'}</span>
            </label>
          </div>
          {mfaEnabled ? (
            <>
              {!mfa && (
                <button className="ds-btn ds-btn-ghost" type="button" onClick={async () => {
                  try { const data = await getMfaProvisioning(); setMfa(data) } catch {}
                }}>Mostra dettagli MFA</button>
              )}
              {mfa && (
                <>
                  <div className="label">Emittente: {mfa.issuer}</div>
                  <div className="label">Segreto: {mfa.secret}</div>
                  <div className="label" style={{ wordBreak: 'break-all' }}>URI: {mfa.otpauth_uri}</div>
                  <div className="spacer"></div>
                  <div className="d-flex flex-column" style={{ alignItems: 'center' }}>
                    <div className="label">Scansiona il QR Code con Google Authenticator</div>
                    <img
                      alt="MFA QR Code"
                      width={200}
                      height={200}
                      style={{ background: '#fff', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }}
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mfa.otpauth_uri)}`}
                    />
                  </div>
                  <div className="d-flex" style={{ justifyContent: 'flex-end' }}>
                    <button
                      className="ds-btn ds-btn-ghost"
                      type="button"
                      onClick={() => setConfirm({ type: 'regenSecret' })}
                    >
                      Rigenera segreto
                    </button>
                  </div>
                </>
              )}
              <div className="spacer"></div>
              <h4>Dispositivi registrati ({devices.length})</h4>
              {devices.length === 0 ? (
                <div className="label">Nessun dispositivo registrato</div>
              ) : (
                <ul>
                  {devices.map(d => (
                    <li key={d.id} className="d-flex" style={{ alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span>{d.name} <span className="label">({d.verified ? 'Verificato' : 'In attesa'}) · aggiunto {new Date(d.added_at).toLocaleString('it-IT', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span></span>
                      <button
                        className="ds-btn ds-btn-ghost ds-btn-sm"
                        type="button"
                        onClick={() => setConfirm({ type: 'deleteDevice', deviceId: d.id, deviceName: d.name })}
                      >
                        Rimuovi
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="spacer"></div>
              <h4>Aggiungi dispositivo</h4>
              <div className="d-flex" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  className="ds-input"
                  placeholder="Nome dispositivo (es. iPhone)"
                  value={devName}
                  onChange={e => setDevName(e.target.value)}
                  aria-label="Nome dispositivo"
                />
                <input
                  className="ds-input"
                  placeholder="Codice OTP (opzionale)"
                  value={devCode}
                  onChange={e => setDevCode(e.target.value)}
                  aria-label="Codice OTP (opzionale)"
                />
                <button className="ds-btn ds-btn-ghost" type="button" onClick={async () => {
                  setErr(null); setMsg(null)
                  try { await addMfaDevice({ name: devName, code: devCode }); setDevName(''); setDevCode(''); await loadDevices(); setMsg('Dispositivo aggiunto') } catch (e: any) { setErr(e?.response?.data?.detail || 'Errore aggiunta dispositivo') }
                }}>Conferma dispositivo</button>
              </div>
            </>
          ) : null}
        </div>
      </div>
      {showDisableModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="ds-card ds-card-body modal-card">
            <h3>Disabilita MFA</h3>
            <div className="label">Inserisci la password per disabilitare MFA</div>
            <div className="d-flex" style={{ alignItems: 'center', gap: 8 }}>
              <input
                className="ds-input"
                type="password"
                placeholder="Password"
                value={pwdInput}
                onChange={e => setPwdInput(e.target.value)}
                aria-label="Password"
              />
            </div>
            {err && <div style={{ color: '#dc2626' }}>{err}</div>}
            <div className="d-flex modal-actions">
              <button className="ds-btn ds-btn-ghost" type="button" onClick={() => { setShowDisableModal(false); setPwdInput('') }}>Annulla</button>
              <button className="ds-btn ds-btn-danger" type="button" disabled={pwdLoading || !pwdInput} onClick={async () => {
                setErr(null); setMsg(null); setPwdLoading(true)
                try {
                  await setMfaEnabled({ enabled: false, password: pwdInput })
                  setMfaEnabledState(false)
                  setMfa(null)
                  setMsg('MFA disabilitato')
                  setShowDisableModal(false)
                  setPwdInput('')
                } catch (e: any) {
                  setErr(e?.response?.data?.detail || 'Password non valida')
                } finally {
                  setPwdLoading(false)
                }
              }}>{pwdLoading ? 'Confermo...' : 'Conferma'}</button>
            </div>
          </div>
        </div>
      )}
      {confirm && (
        <ConfirmModal
          title={
            confirm.type === 'password'
              ? 'Conferma reset password'
              : confirm.type === 'regenSecret'
              ? 'Rigenera segreto MFA'
              : 'Rimuovi dispositivo'
          }
          message={
            confirm.type === 'password'
              ? 'Confermi il reset della password del tuo account?'
              : confirm.type === 'regenSecret'
              ? 'Rigenerare il segreto MFA? Dovrai riconfigurare l\'app di autenticazione.'
              : `Rimuovere il dispositivo '${confirm.deviceName ?? ''}'?`
          }
          confirmLabel="Conferma"
          onCancel={() => setConfirm(null)}
          onConfirm={runConfirm}
        />
      )}
    </div>
  )
}
