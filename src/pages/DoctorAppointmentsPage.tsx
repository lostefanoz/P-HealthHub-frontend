import { useEffect, useMemo, useState } from 'react'
import { listAppointments, notifyAppointment, updateAppointmentStatus, AppointmentDto } from '../services/appointmentsApi'
import { useAuth } from '../auth/AuthContext'
import ConfirmModal from '../components/ConfirmModal'
import { statusLabel } from '../utils/status'
import { PaginationBar } from '../components/PaginationBar'
import { useQuery } from '@tanstack/react-query'
import { StateBlock } from '../components/StateBlock'
import FormSelect from '../components/FormSelect'
import { IconCheck, IconMail, IconMessage, IconXCircle } from '../components/Icon'

type DoctorAppt = AppointmentDto

export default function DoctorAppointmentsPage() {
  const { state } = useAuth()
  const [items, setItems] = useState<DoctorAppt[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<DoctorAppt | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [pendingStatus, setPendingStatus] = useState<null | { id: number; status: 'Confirmed' | 'Rejected' }>(null)
  const [pendingReminder, setPendingReminder] = useState<null | { id: number; channel: 'email' | 'sms' }>(null)
  const [rejectTarget, setRejectTarget] = useState<null | { id: number }>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [rejectNoteMessage, setRejectNoteMessage] = useState<string | null>(null)

  const isDoctor = state.step === 'AUTH' && state.user.roles.includes('Doctor')

  useEffect(() => {
    setPage(1)
  }, [statusFilter, fromDate, toDate])

  const apptsQuery = useQuery({
    queryKey: ['doctor-appts', page, pageSize, statusFilter, fromDate, toDate],
    queryFn: async () =>
      listAppointments({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        status: statusFilter || undefined,
        scheduled_from: fromDate || undefined,
        scheduled_to: toDate || undefined,
      }),
    enabled: isDoctor,
    keepPreviousData: true,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (apptsQuery.data) {
      setItems(apptsQuery.data.items as DoctorAppt[])
      setTotal(apptsQuery.data.total)
    }
  }, [apptsQuery.data])

  async function act(id: number, status: 'Confirmed' | 'Rejected') {
    setPendingStatus({ id, status })
  }

  async function sendReminder(id: number, channel: 'email' | 'sms') {
    setPendingReminder({ id, channel })
  }

  async function confirmCancel(kind: 'none' | 'email' | 'sms') {
    if (!cancelTarget) return
    setCancelLoading(true)
    setCancelError(null)
    try {
      await updateAppointmentStatus(cancelTarget.id, 'Cancelled')
      if (kind === 'email' || kind === 'sms') {
        await notifyAppointment(cancelTarget.id, kind, 'cancellation')
      }
      await apptsQuery.refetch()
      setCancelTarget(null)
    } catch (e: any) {
      setCancelError(e?.response?.data?.detail || 'Errore annullamento appuntamento')
    } finally {
      setCancelLoading(false)
    }
  }

  if (state.step !== 'AUTH') return null
  if (!isDoctor) {
    return (
      <div className="ds-card ds-card-body">
        <h2>Appuntamenti</h2>
        <div className="label">Questa pagina è disponibile solo per i dottori.</div>
      </div>
    )
  }

  const upcoming = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      ),
    [items]
  )

  return (
    <div className="ds-card ds-card-body">
      <h1 className="visually-hidden">Appuntamenti</h1>
      <h2>I miei appuntamenti</h2>
      {error && <StateBlock tone="error" message={error} />}
      {apptsQuery.isLoading && <StateBlock tone="loading" message="Caricamento..." />}
      {apptsQuery.error && !error && <StateBlock tone="error" message={(apptsQuery.error as any)?.response?.data?.detail || 'Errore caricamento appuntamenti'} />}
      <div className="d-flex" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 8 }}>
        <div>
          <label className="label" htmlFor="doctor-appts-status">Stato</label>
          <FormSelect id="doctor-appts-status" value={statusFilter} onChange={setStatusFilter} aria-label="Filtro stato" className="ds-input-sm">
            <option value="">Tutti</option>
            <option value="Requested">Richiesto</option>
            <option value="Confirmed">Confermato</option>
            <option value="Rejected">Rifiutato</option>
            <option value="Completed">Completato</option>
            <option value="Cancelled">Annullato</option>
          </FormSelect>
        </div>
        <div>
          <label className="label" htmlFor="doctor-appts-from">Da</label>
          <input
            id="doctor-appts-from"
            className="ds-input ds-input-sm"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="doctor-appts-to">A</label>
          <input
            id="doctor-appts-to"
            className="ds-input ds-input-sm"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <button className="ds-btn ds-btn-ghost ds-btn-sm" type="button" onClick={() => { setStatusFilter(''); setFromDate(''); setToDate('') }} disabled={!statusFilter && !fromDate && !toDate}>
          Reset filtri
        </button>
      </div>

      {upcoming.length === 0 ? (
        <div className="label">Nessun appuntamento pianificato</div>
      ) : (
        <div className="table-responsive app-table-wrap">
          <table className="table table-striped table-hover align-middle app-table app-table-mobile">
          <thead>
            <tr>
              <th>Paziente</th>
              <th>Data visita</th>
              <th>Data di prenotazione</th>
              <th className="table-center">Stato</th>
                <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.map((a) => (
              <tr key={a.id}>
                <td data-label="Paziente">
                  {a.patient_first_name || a.patient_last_name
                    ? `${a.patient_first_name ?? ''} ${a.patient_last_name ?? ''}`.trim()
                    : `ID ${a.patient_id}`}
                </td>
                <td data-label="Data visita">{new Date(a.scheduled_at).toLocaleString('it-IT', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                <td data-label="Data prenotazione">
                  {a.created_at
                    ? new Date(a.created_at).toLocaleString('it-IT', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                    : '-'}
                </td>
                <td data-label="Stato" className="table-center">
                  <div className="status-with-note">
                    <span className="status-pill" data-status={a.status}>
                      {statusLabel(a.status)}
                    </span>
                    <span className="status-note-slot" aria-hidden={a.status !== 'Rejected'}>
                      {a.status === 'Rejected' && (
                        <button
                          className="reject-reason-btn"
                          type="button"
                          onClick={() => setRejectNoteMessage(a.rejected_note || 'Motivazione non disponibile.')}
                          aria-label="Mostra motivazione rifiuto"
                          title="Mostra motivazione rifiuto"
                        >
                          i
                        </button>
                      )}
                    </span>
                  </div>
                </td>
                <td data-label="Azioni">
                  <div className="d-flex" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {a.status === 'Requested' && (
                      <>
                        <button
                          className="ds-btn ds-btn-primary ds-btn-sm"
                          type="button"
                          disabled={loading}
                          onClick={() => act(a.id, 'Confirmed')}
                          aria-label="Accetta"
                          title="Accetta"
                        >
                          <span className="btn-icon" aria-hidden="true">
                            <IconCheck size={18} />
                          </span>
                          <span className="sr-only">Accetta</span>
                        </button>
                        <button
                          className="ds-btn ds-btn-danger ds-btn-sm"
                          type="button"
                          disabled={loading}
                          onClick={() => act(a.id, 'Rejected')}
                          aria-label="Rifiuta appuntamento"
                          title="Rifiuta appuntamento"
                        >
                          <span className="btn-icon" aria-hidden="true">
                            <IconXCircle size={18} />
                          </span>
                          <span className="sr-only">Rifiuta appuntamento</span>
                        </button>
                      </>
                    )}
                    {a.status === 'Confirmed' && (
                      <>
                        <button
                          className="ds-btn ds-btn-ghost ds-btn-sm"
                          type="button"
                          disabled={loading}
                          onClick={() => sendReminder(a.id, 'email')}
                          aria-label="Promemoria email"
                          title="Promemoria email"
                        >
                          <span className="btn-icon" aria-hidden="true">
                            <IconMail size={18} />
                          </span>
                          <span className="sr-only">Promemoria email</span>
                        </button>
                        <button
                          className="ds-btn ds-btn-ghost ds-btn-sm"
                          type="button"
                          disabled={loading}
                          onClick={() => sendReminder(a.id, 'sms')}
                          aria-label="Promemoria SMS"
                          title="Promemoria SMS"
                        >
                          <span className="btn-icon" aria-hidden="true">
                            <IconMessage size={18} />
                          </span>
                          <span className="sr-only">Promemoria SMS</span>
                        </button>
                      </>
                    )}
                    {a.status === 'Confirmed' && (
                      <>
                        <button
                          className="ds-btn ds-btn-danger ds-btn-sm"
                          type="button"
                          disabled={loading}
                          onClick={() => { setCancelTarget(a); setCancelError(null) }}
                          aria-label="Annulla appuntamento"
                          title="Annulla appuntamento"
                        >
                          <span className="btn-icon" aria-hidden="true">
                            <IconXCircle size={18} />
                          </span>
                          <span className="sr-only">Annulla appuntamento</span>
                        </button>
                      </>
                    )}
                    {!['Requested', 'Confirmed'].includes(a.status) && (
                      <span className="label">Nessuna azione disponibile</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <PaginationBar page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
      </div>
      )}
      {cancelTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="ds-card ds-card-body modal-card">
            <h3>Annulla appuntamento</h3>
            <div className="label">
              Vuoi annullare l&apos;appuntamento per{' '}
              {cancelTarget.patient_first_name || cancelTarget.patient_last_name
                ? `${cancelTarget.patient_first_name ?? ''} ${cancelTarget.patient_last_name ?? ''}`.trim()
                : `ID ${cancelTarget.patient_id}`}{' '}
              del {new Date(cancelTarget.scheduled_at).toLocaleString('it-IT', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}?
            </div>
            <div className="spacer"></div>
            <div className="label">Scegli se inviare una notifica al paziente:</div>
            {cancelError && <div style={{ color: '#dc2626' }}>{cancelError}</div>}
            <div className="d-flex modal-actions">
              <button
                className="ds-btn ds-btn-ghost"
                type="button"
                onClick={() => { setCancelTarget(null); setCancelError(null) }}
                disabled={cancelLoading}
              >
                Chiudi
              </button>
              <button
                className="ds-btn ds-btn-ghost"
                type="button"
                disabled={cancelLoading}
                onClick={() => confirmCancel('none')}
              >
                Solo annulla
              </button>
              <button
                className="ds-btn ds-btn-ghost"
                type="button"
                disabled={cancelLoading}
                onClick={() => confirmCancel('email')}
              >
                Annulla e invia email
              </button>
              <button
                className="ds-btn ds-btn-danger"
                type="button"
                disabled={cancelLoading}
                onClick={() => confirmCancel('sms')}
              >
                Annulla e invia SMS
              </button>
            </div>
          </div>
        </div>
      )}
      {pendingStatus && (
        <ConfirmModal
          title="Conferma aggiornamento stato"
          message={
            pendingStatus.status === 'Rejected'
              ? "Confermi di respingere l'appuntamento?"
              : "Confermi lo stato 'Confermato' per questo appuntamento?"
          }
          confirmLabel="Conferma"
          cancelLabel="Annulla"
          onCancel={() => setPendingStatus(null)}
          onConfirm={async () => {
            if (pendingStatus.status === 'Rejected') {
              setRejectTarget({ id: pendingStatus.id })
              setRejectNote('')
              setPendingStatus(null)
              return
            }
            setLoading(true)
            setError(null)
            try {
              await updateAppointmentStatus(pendingStatus.id, pendingStatus.status)
              await apptsQuery.refetch()
            } catch (e: any) {
              setError(e?.response?.data?.detail || 'Errore aggiornamento appuntamento')
            } finally {
              setLoading(false)
              setPendingStatus(null)
            }
          }}
        />
      )}
      {rejectTarget && (
        <ConfirmModal
          title="Motivo rifiuto"
          message="Inserisci una nota che spiega la motivazione del rifiuto."
          confirmLabel="Conferma rifiuto"
          cancelLabel="Annulla"
          confirmDisabled={!rejectNote.trim() || loading}
          onCancel={() => { setRejectTarget(null); setRejectNote('') }}
          onConfirm={async () => {
            setLoading(true)
            setError(null)
            try {
              await updateAppointmentStatus(rejectTarget.id, 'Rejected', rejectNote.trim())
              await apptsQuery.refetch()
              setRejectTarget(null)
              setRejectNote('')
            } catch (e: any) {
              setError(e?.response?.data?.detail || 'Errore aggiornamento appuntamento')
            } finally {
              setLoading(false)
            }
          }}
        >
          <label className="d-flex flex-column gap-1">
            <span className="label">Nota di rifiuto</span>
            <textarea
              className="ds-input"
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Motivazione del rifiuto"
              disabled={loading}
            />
          </label>
        </ConfirmModal>
      )}
      {pendingReminder && (
        <ConfirmModal
          title="Conferma invio promemoria"
          message={`Inviare un promemoria via ${pendingReminder.channel === 'email' ? 'email' : 'SMS'} al paziente?`}
          confirmLabel="Invia"
          cancelLabel="Annulla"
          onCancel={() => setPendingReminder(null)}
          onConfirm={async () => {
            setLoading(true)
            setError(null)
            try {
              await notifyAppointment(pendingReminder.id, pendingReminder.channel, 'reminder')
            } catch (e: any) {
              setError(e?.response?.data?.detail || 'Errore invio promemoria')
            } finally {
              setLoading(false)
              setPendingReminder(null)
            }
          }}
        />
      )}
      {rejectNoteMessage && (
        <ConfirmModal
          title="Motivazione rifiuto"
          message={rejectNoteMessage}
          onCancel={() => setRejectNoteMessage(null)}
          onConfirm={() => setRejectNoteMessage(null)}
          footer={(
            <button className="ds-btn ds-btn-ghost" type="button" onClick={() => setRejectNoteMessage(null)}>
              Chiudi
            </button>
          )}
        />
      )}
    </div>
  )
}

