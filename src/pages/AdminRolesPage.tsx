import { useEffect, useId, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { listUsers, updateUserRoles, updateUserStatus, adminResetUserPassword, adminDeleteUser, AdminUser } from '../services/adminApi'
import { http } from '../services/http'
import ConfirmModal from '../components/ConfirmModal'
import AnchoredPopover from '../components/AnchoredPopover'
import FormSelect from '../components/FormSelect'
import { roleLabel } from '../utils/roles'
import { PaginationBar } from '../components/PaginationBar'
import { useQuery } from '@tanstack/react-query'
import { StateBlock } from '../components/StateBlock'

const ALL_ROLES = ['Admin', 'Doctor', 'Patient', 'Secretary']

export default function AdminRolesPage() {
  const [searchParams] = useSearchParams()
  const { state } = useAuth()
  const meId = state.step === 'AUTH' ? state.user.id : null
  const [users, setUsers] = useState<AdminUser[]>([])
  const [q, setQ] = useState('')
  const [qInput, setQInput] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive' | ''>('active')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [openRolesFor, setOpenRolesFor] = useState<number | null>(null)
  const [rolesAnchorEl, setRolesAnchorEl] = useState<HTMLElement | null>(null)
  const [openActionsFor, setOpenActionsFor] = useState<number | null>(null)
  const [actionsAnchorEl, setActionsAnchorEl] = useState<HTMLElement | null>(null)
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetLoading, setResetLoading] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState('')
  const [deleteBlockedMessage, setDeleteBlockedMessage] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<null | {
    type: 'roles' | 'status' | 'delete'
    user: AdminUser
    nextRoles?: string[]
    nextStatus?: boolean
  }>(null)
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const rolesPopoverId = useId()
  const actionsPopoverId = useId()

  const isSelf = (u: AdminUser) => meId !== null && u.id === meId

  useEffect(() => {
    const urlQ = searchParams.get('q')
    const urlRole = searchParams.get('role')
    const urlStatus = searchParams.get('status')
    const urlActive = searchParams.get('active')

    if (urlQ !== null && urlQ !== q) setQ(urlQ)
    if (urlQ !== null && urlQ !== qInput) setQInput(urlQ)
    if (urlRole !== null && urlRole !== role) setRole(urlRole)

    let nextStatus: 'active' | 'inactive' | '' | null = null
    if (urlStatus !== null) {
      if (urlStatus === 'active') nextStatus = 'active'
      if (urlStatus === 'inactive') nextStatus = 'inactive'
      if (urlStatus === 'all' || urlStatus === '') nextStatus = ''
    } else if (urlActive !== null) {
      if (urlActive === 'true' || urlActive === '1') nextStatus = 'active'
      if (urlActive === 'false' || urlActive === '0') nextStatus = 'inactive'
      if (urlActive === '') nextStatus = ''
    }
    if (nextStatus !== null && nextStatus !== status) setStatus(nextStatus)
  }, [searchParams, q, qInput, role, status])

  useEffect(() => {
    const id = setTimeout(() => {
      if (qInput !== q) setQ(qInput)
    }, 350)
    return () => clearTimeout(id)
  }, [qInput, q])

  useEffect(() => {
    setPage(1)
  }, [q, role, status, createdFrom, createdTo])

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', q, role, status, createdFrom, createdTo, page, pageSize],
    queryFn: async () => {
      const params: any = {}
      if (q) params.q = q
      if (role) params.role = role
      if (status) params.active = status === 'active'
      if (createdFrom) params.created_from = createdFrom
      if (createdTo) params.created_to = createdTo
      params.limit = pageSize
      params.offset = (page - 1) * pageSize
      return await listUsers(params)
    },
    keepPreviousData: true,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (data) {
      setUsers(data.items)
      setTotal(data.total)
    }
  }, [data])

  const rolesPopoverUser = useMemo(
    () => (openRolesFor === null ? null : users.find((u) => u.id === openRolesFor) ?? null),
    [openRolesFor, users]
  )
  const rolesPopoverOpen = !!rolesPopoverUser && !!rolesAnchorEl
  const actionsPopoverUser = useMemo(
    () => (openActionsFor === null ? null : users.find((u) => u.id === openActionsFor) ?? null),
    [openActionsFor, users]
  )
  const actionsPopoverOpen = !!actionsPopoverUser && !!actionsAnchorEl

  useEffect(() => {
    if (openRolesFor !== null && !rolesPopoverUser) {
      setOpenRolesFor(null)
      setRolesAnchorEl(null)
    }
  }, [openRolesFor, rolesPopoverUser])
  useEffect(() => {
    if (openActionsFor !== null && !actionsPopoverUser) {
      setOpenActionsFor(null)
      setActionsAnchorEl(null)
    }
  }, [openActionsFor, actionsPopoverUser])

  useEffect(() => {
    if (!confirmAction && !resetTarget) return
    setOpenRolesFor(null)
    setRolesAnchorEl(null)
    setOpenActionsFor(null)
    setActionsAnchorEl(null)
  }, [confirmAction, resetTarget])

  async function toggleRole(userId: number, role: string) {
    const u = users.find(u => u.id === userId)!
    if (isSelf(u)) {
      setInlineError('Non puoi modificare i ruoli del tuo account da questa pagina')
      return
    }
    const has = u.roles.includes(role)
    const next = has ? u.roles.filter(r => r !== role) : [...u.roles, role]
    setOpenRolesFor(null)
    setRolesAnchorEl(null)
    setConfirmAction({ type: 'roles', user: u, nextRoles: next })
  }

  async function toggleStatus(userId: number) {
    const u = users.find(u => u.id === userId)!
    if (isSelf(u)) {
      setInlineError('Non puoi disattivare/riattivare il tuo account')
      return
    }
    const next = !u.is_active
    setConfirmAction({ type: 'status', user: u, nextStatus: next })
  }

  async function confirmResetPassword() {
    if (!resetTarget) return
    if (isSelf(resetTarget)) {
      setResetError('Per cambiare la password del tuo account usa la pagina Profilo')
      return
    }
    setResetError(null)
    setInlineError(null)
    if (!resetPassword || resetPassword.length < 10) {
      setResetError('La password deve avere almeno 10 caratteri')
      return
    }

    setResetLoading(true)
    try {
      await adminResetUserPassword(resetTarget.id, resetPassword)
      setResetTarget(null)
      setResetPassword('')
    } catch (e: any) {
      setResetError(e?.response?.data?.detail || 'Reset password non riuscito')
    } finally {
      setResetLoading(false)
    }
  }

  async function handleDeleteUser(userId: number) {
    const u = users.find(u => u.id === userId)
    if (!u) return
    if (isSelf(u)) {
      setInlineError('Non puoi eliminare il tuo account')
      return
    }
    setConfirmAction({ type: 'delete', user: u })
  }

  const requiresEmailConfirm =
    !!confirmAction &&
    confirmAction.type === 'roles' &&
    !!confirmAction.nextRoles &&
    confirmAction.user.roles.includes('Admin') &&
    !confirmAction.nextRoles.includes('Admin')

  useEffect(() => {
    if (!confirmAction) return
    setConfirmEmail('')
  }, [confirmAction?.type, confirmAction?.user?.id])

  async function runConfirmedAction() {
    const action = confirmAction
    if (!action) return
    setInlineError(null)
    try {
      if (action.type === 'roles' && action.nextRoles) {
        await updateUserRoles(action.user.id, action.nextRoles)
        setUsers(users.map(x => x.id === action.user.id ? { ...x, roles: action.nextRoles! } : x))
      }
      if (action.type === 'status' && typeof action.nextStatus === 'boolean') {
        await updateUserStatus(action.user.id, action.nextStatus)
        setUsers(users.map(x => x.id === action.user.id ? { ...x, is_active: action.nextStatus! } : x))
      }
      if (action.type === 'delete') {
        await adminDeleteUser(action.user.id)
        setUsers(prev => prev.filter(x => x.id !== action.user.id))
      }
      setConfirmAction(null)
    } catch (e: any) {
      const message = e?.response?.data?.detail || 'Operazione non riuscita'
      if (action.type === 'delete' && message.includes('attivita storica')) {
        setDeleteBlockedMessage('Impossibile eliminare l\'utente perché ha attività storica. Usa la disattivazione.')
        setConfirmAction(null)
        return
      }
      setInlineError(message)
    }
  }

  if (isLoading) return <StateBlock tone="loading" message="Caricamento..." />
  if (error) return <StateBlock tone="error" message={(error as any)?.response?.data?.detail || 'Errore di caricamento utenti'} />

  function makeExportParams() {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (role) params.set('role', role)
    if (status) params.set('active', String(status === 'active'))
    return params.toString()
  }

  async function exportFile(format: 'csv' | 'json') {
    const qs = makeExportParams()
    const url = `/admin/users/export?${qs}&format=${format}`
    const res = await http.get(url, { responseType: 'blob' })
    const blob = new Blob([res.data], { type: format === 'csv' ? 'text/csv' : 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `users.${format}`
    document.body.appendChild(link)
    link.click()
    URL.revokeObjectURL(link.href)
    link.remove()
  }

  return (
    <div className="ds-card ds-card-body">
      <div className="d-flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div className="d-flex flex-column" style={{ gap: 2 }}>
          <h2 style={{ margin: 0 }}>Ruoli</h2>
        </div>
        <div className="d-flex" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="ds-btn ds-btn-ghost" type="button" onClick={() => exportFile('csv')}>Export CSV</button>
          <button className="ds-btn ds-btn-ghost" type="button" onClick={() => exportFile('json')}>Export JSON</button>
          <button
            className="ds-btn ds-btn-ghost"
            type="button"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Nascondi dettagli' : 'Mostra dettagli'}
          </button>
        </div>
      </div>

      <div className="filters-panel" style={{ marginTop: 12, marginBottom: 12 }}>
        <div className="filters-grid">
          <div className="filters-field">
            <div className="label">Ricerca</div>
            <input
              className="ds-input"
              placeholder="Email, nome o cognome..."
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              aria-label="Cerca per email, nome o cognome"
              style={{ maxWidth: 240 }}
            />
          </div>
          <div className="filters-field">
            <div className="label">Ruolo</div>
            <FormSelect value={role} onChange={setRole} aria-label="Filtro ruolo">
              <option value="">Tutti</option>
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </FormSelect>
          </div>
          <div className="filters-field">
            <div className="label">Stato</div>
            <FormSelect value={status} onChange={(v) => setStatus(v as any)} aria-label="Filtro stato">
              <option value="active">Attivi</option>
              <option value="inactive">Disattivati</option>
              <option value="">Tutti</option>
            </FormSelect>
          </div>
          <div className="filters-field">
            <div className="label">Creati da</div>
            <input
              className="ds-input"
              type="date"
              value={createdFrom}
              onChange={(e) => setCreatedFrom(e.target.value)}
              aria-label="Creati da"
            />
          </div>
          <div className="filters-field">
            <div className="label">Creati a</div>
            <input
              className="ds-input"
              type="date"
              value={createdTo}
              onChange={(e) => setCreatedTo(e.target.value)}
              aria-label="Creati a"
            />
          </div>
          <div className="filters-actions">
            <button
              className="ds-btn ds-btn-ghost"
              type="button"
              onClick={() => { setQ(''); setQInput(''); setRole(''); setStatus('active'); setCreatedFrom(''); setCreatedTo('') }}
              disabled={!qInput && !role && status === 'active' && !createdFrom && !createdTo}
              title="Ripristina filtri"
              style={{ height: 40, paddingInline: 14 }}
            >
              Reset filtri
            </button>
          </div>
        </div>
      </div>

      {inlineError && (
        <div className="alert alert-danger" style={{ marginBottom: 12 }}>
          {inlineError}
        </div>
      )}
      <div className="table-responsive app-table-wrap roles-table-wrap">
        <table className="table table-striped table-hover align-middle app-table app-table-mobile roles-table">
          <colgroup>
            <col />
            <col />
            <col />
            {showDetails && <col />}
            {showDetails && <col />}
            <col />
            <col className="table-actions-col" />
          </colgroup>
          <thead>
            <tr>
              <th>Email</th>
              <th>Nome</th>
              <th>Stato</th>
              {showDetails && <th>Creato</th>}
              {showDetails && <th>Ultimo accesso</th>}
              <th>Ruoli</th>
              <th className="table-actions">
                <span className="visually-hidden">Azioni</span>
                <svg
                  className="ellipsis-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <circle cx="5" cy="12" r="1.8" />
                  <circle cx="12" cy="12" r="1.8" />
                  <circle cx="19" cy="12" r="1.8" />
                </svg>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td data-label="Email"><span className="cell-email">{u.email}</span></td>
                <td data-label="Nome">{u.first_name} {u.last_name}</td>
                <td data-label="Stato">
                  <span className="label">{u.is_active ? 'Attivo' : 'Disattivato'}</span>
                </td>
                {showDetails && (
                  <td className="label" data-label="Creato">
                    {(u as any).created_at
                      ? new Date((u as any).created_at).toLocaleString('it-IT', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : '-'}
                  </td>
                )}
                {showDetails && (
                  <td className="label" data-label="Ultimo accesso">
                    {(u as any).last_login
                      ? new Date((u as any).last_login).toLocaleString('it-IT', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : '-'}
                  </td>
                )}
                <td data-label="Ruoli">
                  <div className="d-flex flex-column">
                    <div className="d-flex" style={{ gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {u.roles.length ? (
                        u.roles.map(r => (
                          <span
                            key={r}
                            className="pill role-pill"
                            data-role={r}
                          >
                            {roleLabel(r)}
                          </span>
                        ))
                      ) : (
                        <span className="label">Nessuno</span>
                      )}
                      <button
                        className="ds-btn ds-btn-ghost ds-btn-sm"
                        type="button"
                        disabled={isSelf(u)}
                        aria-haspopup="dialog"
                        aria-expanded={rolesPopoverOpen && openRolesFor === u.id}
                        aria-controls={rolesPopoverOpen && openRolesFor === u.id ? rolesPopoverId : undefined}
                        onClick={(e) => {
                          if (openRolesFor === u.id) {
                            setOpenRolesFor(null)
                            setRolesAnchorEl(null)
                            return
                          }
                          setOpenRolesFor(u.id)
                          setRolesAnchorEl(e.currentTarget)
                        }}
                        title={isSelf(u) ? 'Non puoi modificare i ruoli del tuo account' : 'Modifica ruoli'}
                      >
                        Modifica
                      </button>
                      <button
                        className="ds-btn ds-btn-ghost ds-btn-sm actions-menu-inline ellipsis-btn"
                        type="button"
                        aria-haspopup="dialog"
                        aria-expanded={actionsPopoverOpen && openActionsFor === u.id}
                        aria-controls={actionsPopoverOpen && openActionsFor === u.id ? actionsPopoverId : undefined}
                        aria-label="Azioni"
                        title="Azioni"
                        onClick={(e) => {
                          if (openActionsFor === u.id) {
                            setOpenActionsFor(null)
                            setActionsAnchorEl(null)
                            return
                          }
                          setOpenActionsFor(u.id)
                          setActionsAnchorEl(e.currentTarget)
                        }}
                      >
                        <svg
                          className="ellipsis-icon"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <circle cx="5" cy="12" r="1.8" />
                          <circle cx="12" cy="12" r="1.8" />
                          <circle cx="19" cy="12" r="1.8" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </td>
                <td className="table-actions" data-label="">
                  <div className="actions-menu">
                    <button
                      className="ds-btn ds-btn-ghost ds-btn-sm ellipsis-btn"
                      type="button"
                      aria-haspopup="dialog"
                      aria-expanded={actionsPopoverOpen && openActionsFor === u.id}
                      aria-controls={actionsPopoverOpen && openActionsFor === u.id ? actionsPopoverId : undefined}
                      aria-label="Azioni"
                      title="Azioni"
                      onClick={(e) => {
                        if (openActionsFor === u.id) {
                          setOpenActionsFor(null)
                          setActionsAnchorEl(null)
                          return
                        }
                        setOpenActionsFor(u.id)
                        setActionsAnchorEl(e.currentTarget)
                      }}
                    >
                      <svg
                        className="ellipsis-icon"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <circle cx="5" cy="12" r="1.8" />
                        <circle cx="12" cy="12" r="1.8" />
                        <circle cx="19" cy="12" r="1.8" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationBar page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />

      <AnchoredPopover
        open={rolesPopoverOpen}
        anchorEl={rolesAnchorEl}
        onClose={() => {
          setOpenRolesFor(null)
          setRolesAnchorEl(null)
        }}
        id={rolesPopoverId}
        ariaLabel="Modifica ruoli"
        className="ds-card ds-card-body popover-card"
        style={{ minWidth: 240 }}
      >
        <div className="d-flex flex-column">
          {rolesPopoverUser && ALL_ROLES.map((r) => (
            <label key={r} className="d-flex" style={{ gap: 6, alignItems: 'center' }}>
              <input
                type="checkbox"
                className="form-check-input"
                checked={rolesPopoverUser.roles.includes(r)}
                disabled={isSelf(rolesPopoverUser)}
                onChange={() => toggleRole(rolesPopoverUser.id, r)}
              />
              <span>{roleLabel(r)}</span>
            </label>
          ))}
          <div className="d-flex" style={{ justifyContent: 'flex-end' }}>
            <button
              className="ds-btn ds-btn-ghost ds-btn-sm"
              type="button"
              onClick={() => {
                setOpenRolesFor(null)
                setRolesAnchorEl(null)
              }}
            >
              Chiudi
            </button>
          </div>
        </div>
      </AnchoredPopover>
      <AnchoredPopover
        open={actionsPopoverOpen}
        anchorEl={actionsAnchorEl}
        onClose={() => {
          setOpenActionsFor(null)
          setActionsAnchorEl(null)
        }}
        id={actionsPopoverId}
        ariaLabel="Azioni utente"
        className="ds-card ds-card-body popover-card"
        style={{ minWidth: 220 }}
      >
        <div className="d-flex flex-column">
          {actionsPopoverUser && (
            <>
              <div className="label" style={{ marginBottom: 6 }}>{actionsPopoverUser.email}</div>
              <button
                className="ds-btn ds-btn-ghost ds-btn-sm"
                type="button"
                disabled={!actionsPopoverUser.is_active || isSelf(actionsPopoverUser)}
                onClick={() => {
                  setOpenActionsFor(null)
                  setActionsAnchorEl(null)
                  setResetTarget(actionsPopoverUser)
                  setResetPassword('')
                  setResetError(null)
                }}
                title={isSelf(actionsPopoverUser) ? 'Per il tuo account usa la pagina Profilo' : undefined}
              >
                Reset password
              </button>
              <button
                className="ds-btn ds-btn-danger ds-btn-sm"
                type="button"
                disabled={!actionsPopoverUser.is_active || isSelf(actionsPopoverUser)}
                onClick={() => {
                  setOpenActionsFor(null)
                  setActionsAnchorEl(null)
                  setConfirmAction({ type: 'status', user: actionsPopoverUser, nextStatus: false })
                }}
                title={isSelf(actionsPopoverUser) ? 'Non puoi disattivare il tuo account' : undefined}
              >
                Disattiva
              </button>
              <div className="d-flex" style={{ justifyContent: 'flex-end' }}>
                <button
                  className="ds-btn ds-btn-ghost ds-btn-sm"
                  type="button"
                  onClick={() => {
                    setOpenActionsFor(null)
                    setActionsAnchorEl(null)
                  }}
                >
                  Chiudi
                </button>
              </div>
            </>
          )}
        </div>
      </AnchoredPopover>
      {resetTarget && (
        <ConfirmModal
          title="Reset password utente"
          message={`Nuova password per ${resetTarget.email}`}
          cancelLabel="Annulla"
          confirmLabel={resetLoading ? 'Salvo...' : 'Conferma reset'}
          variant="danger"
          confirmDisabled={resetLoading}
          onCancel={() => { setResetTarget(null); setResetPassword(''); setResetError(null) }}
          onConfirm={confirmResetPassword}
        >
          <div className="d-flex flex-column" style={{ gap: 8, marginBottom: 12 }}>
            <input
              className="ds-input"
              type="password"
              placeholder="Nuova password"
              value={resetPassword}
              onChange={e => setResetPassword(e.target.value)}
            />
            {resetError && <div style={{ color: '#dc2626' }}>{resetError}</div>}
          </div>
        </ConfirmModal>
      )}
      {confirmAction && (
        <ConfirmModal
          title={
            confirmAction.type === 'roles' ? 'Conferma aggiornamento ruoli'
            : confirmAction.type === 'status' ? 'Conferma aggiornamento stato'
            : confirmAction.type === 'delete' ? 'Conferma eliminazione utente'
            : 'Conferma operazione'
          }
          message={
            confirmAction.type === 'roles'
              ? `Confermi aggiornamento ruoli per ${confirmAction.user.email}?`
              : confirmAction.type === 'status'
              ? `${confirmAction.nextStatus ? 'Riattivare' : 'Disattivare'} l'utente ${confirmAction.user.email}?`
              : confirmAction.type === 'delete'
              ? `Eliminare definitivamente l'utente ${confirmAction.user.email}?`
              : `Confermi l'operazione per ${confirmAction.user.email}?`
          }
          confirmLabel={
            confirmAction.type === 'delete' ? 'Elimina'
            : confirmAction.type === 'status' && confirmAction.nextStatus === false ? 'Disattiva'
            : 'Conferma'
          }
          variant={confirmAction.type === 'delete' || (confirmAction.type === 'status' && confirmAction.nextStatus === false) ? 'danger' : 'default'}
          onCancel={() => setConfirmAction(null)}
          onConfirm={runConfirmedAction}
          confirmDisabled={requiresEmailConfirm && confirmEmail.trim().toLowerCase() !== confirmAction.user.email.trim().toLowerCase()}
        >
          {requiresEmailConfirm && (
            <div className="d-flex flex-column" style={{ gap: 8, marginBottom: 12 }}>
              <div className="label">
                Azione sensibile: per rimuovere il ruolo Admin digita l'email dell'utente (<strong>{confirmAction.user.email}</strong>).
              </div>
              <input
                className="ds-input"
                placeholder="Email utente"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
              />
            </div>
          )}
        </ConfirmModal>
      )}
      {deleteBlockedMessage && (
        <>
          <div className="modal-backdrop show" />
          <div
            className="modal show"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-blocked-title"
            style={{ display: 'block' }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="delete-blocked-title">Impossibile eliminare</h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Chiudi"
                    onClick={() => setDeleteBlockedMessage(null)}
                  />
                </div>
                <div className="modal-body">
                  {deleteBlockedMessage}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setDeleteBlockedMessage(null)}
                  >
                    Ok
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

