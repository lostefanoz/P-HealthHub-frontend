import { useEffect, useMemo, useState } from 'react'
import { listAppointments, updateAppointmentStatus, listDoctors, Doctor, deleteAppointment, AppointmentDto, archiveAppointmentReport, notifyAppointment } from '../services/appointmentsApi'
import ConfirmModal from '../components/ConfirmModal'
import { statusLabel } from '../utils/status'
import { useAuth } from '../auth/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { StateBlock } from '../components/StateBlock'
import { PaginationBar } from '../components/PaginationBar'
import { IconCheck, IconXCircle, IconTrash, IconFilePlus, IconMail, IconMessage, IconChevronDown, IconChevronUp } from '../components/Icon'

type Appt = AppointmentDto

export default function PlannerPage() {
  const { state } = useAuth()
  const isSecretary = state.step === 'AUTH' && state.user.roles.includes('Secretary')

  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<null | { id: number; status: 'Confirmed' | 'Rejected' }>(null)
  const [pendingDelete, setPendingDelete] = useState<null | { id: number }>(null)
  const [pendingArchive, setPendingArchive] = useState<null | { id: number }>(null)
  const [pendingReminder, setPendingReminder] = useState<null | { id: number; channel: 'email' | 'sms' }>(null)
  const [rejectNoteMessage, setRejectNoteMessage] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [requestedPage, setRequestedPage] = useState(1)
  const [requestedPageSize, setRequestedPageSize] = useState(20)
  const [rejectedPage, setRejectedPage] = useState(1)
  const [rejectedPageSize, setRejectedPageSize] = useState(20)
  const [confirmedPage, setConfirmedPage] = useState(1)
  const [confirmedPageSize, setConfirmedPageSize] = useState(20)
  const [completedPage, setCompletedPage] = useState(1)
  const [completedPageSize, setCompletedPageSize] = useState(20)
  const [showRequested, setShowRequested] = useState(true)
  const [showConfirmed, setShowConfirmed] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)
  const [showRejected, setShowRejected] = useState(false)

  useEffect(() => {
    setError(null)
    setRequestedPage(1)
    setRejectedPage(1)
    setConfirmedPage(1)
    setCompletedPage(1)
  }, [fromDate, toDate])

  function romeDateString(value: Date) {
    return value.toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' })
  }

  const todayRome = romeDateString(new Date())
  const confirmedFrom = fromDate && fromDate > todayRome ? fromDate : todayRome
  const completedTo = toDate && toDate < todayRome ? toDate : todayRome

  const requestedQuery = useQuery({
    queryKey: ['planner-requested', fromDate, toDate, requestedPage, requestedPageSize],
    queryFn: async () => {
      return await listAppointments({
        limit: requestedPageSize,
        offset: (requestedPage - 1) * requestedPageSize,
        status: 'Requested',
        scheduled_from: fromDate || undefined,
        scheduled_to: toDate || undefined,
      })
    },
    enabled: isSecretary,
    keepPreviousData: true,
    staleTime: 30_000,
  })

  const confirmedQuery = useQuery({
    queryKey: ['planner-confirmed', confirmedFrom, toDate, confirmedPage, confirmedPageSize],
    queryFn: async () => {
      return await listAppointments({
        limit: confirmedPageSize,
        offset: (confirmedPage - 1) * confirmedPageSize,
        status: 'Confirmed',
        scheduled_from: confirmedFrom,
        scheduled_to: toDate || undefined,
      })
    },
    enabled: isSecretary,
    keepPreviousData: true,
    staleTime: 30_000,
  })

  const rejectedQuery = useQuery({
    queryKey: ['planner-rejected', fromDate, toDate, rejectedPage, rejectedPageSize],
    queryFn: async () => {
      return await listAppointments({
        limit: rejectedPageSize,
        offset: (rejectedPage - 1) * rejectedPageSize,
        status: 'Rejected',
        scheduled_from: fromDate || undefined,
        scheduled_to: toDate || undefined,
      })
    },
    enabled: isSecretary,
    keepPreviousData: true,
    staleTime: 30_000,
  })

  const completedQuery = useQuery({
    queryKey: ['planner-completed', fromDate, completedTo, completedPage, completedPageSize],
    queryFn: async () => {
      return await listAppointments({
        limit: completedPageSize,
        offset: (completedPage - 1) * completedPageSize,
        status: 'Confirmed,Completed',
        scheduled_from: fromDate || undefined,
        scheduled_to: completedTo,
        report_archived: false,
      })
    },
    enabled: isSecretary,
    keepPreviousData: true,
    staleTime: 30_000,
  })

  const doctorsQuery = useQuery({
    queryKey: ['planner-doctors'],
    queryFn: async () => {
      const res = await listDoctors({ limit: 500, offset: 0 })
      return res.items as Doctor[]
    },
    enabled: isSecretary,
    staleTime: 300_000,
  })

  const doctors = doctorsQuery.data ?? []

  const requested = useMemo(
    () => (requestedQuery.data?.items as Appt[] | undefined) ?? [],
    [requestedQuery.data]
  )
  const rejected = useMemo(
    () => (rejectedQuery.data?.items as Appt[] | undefined) ?? [],
    [rejectedQuery.data]
  )
  const upcomingConfirmed = useMemo(() => {
    const items = (confirmedQuery.data?.items as Appt[] | undefined) ?? []
    return [...items].sort((x, y) => new Date(x.scheduled_at).getTime() - new Date(y.scheduled_at).getTime())
  }, [confirmedQuery.data])
  const completedAppointments = useMemo(() => {
    const items = (completedQuery.data?.items as Appt[] | undefined) ?? []
    return [...items].sort((x, y) => new Date(x.scheduled_at).getTime() - new Date(y.scheduled_at).getTime())
  }, [completedQuery.data])

  function doctorName(id: number) {
    const d = doctors.find(x => x.id === id)
    return d ? `${d.first_name} ${d.last_name}` : `ID ${id}`
  }

  function specialtyName(a: Appt) {
    const d = doctors.find(x => x.id === a.doctor_id)
    if (!d || !d.specialties) return 'N/D'
    if (a.specialty_id) {
      const spec = d.specialties.find(s => s.id === a.specialty_id)
      return spec?.name || 'N/D'
    }
    if (d.specialties.length === 1) return d.specialties[0].name
    return 'N/D'
  }

  function patientName(a: Appt) {
    const name = `${a.patient_first_name ?? ''} ${a.patient_last_name ?? ''}`.trim()
    return name || `ID ${a.patient_id}`
  }
  function requestDateTime(a: Appt) {
    if (!a.created_at) return '-'
    return new Date(a.created_at).toLocaleString('it-IT', {
      timeZone: 'Europe/Rome',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function formatDateTime(value: string) {
    return new Date(value).toLocaleString('it-IT', {
      timeZone: 'Europe/Rome',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function reportBadge(hasReport?: boolean | null, reportArchived?: boolean | null) {
    const isArchived = Boolean(reportArchived)
    const isPresent = Boolean(hasReport)
    const dotStyle = { background: isArchived ? '#64748b' : isPresent ? '#16a34a' : '#ef4444' }
    return (
      <span className="ds-badge">
        <span className="ds-badge-dot" style={dotStyle} />
        {isArchived ? 'Archiviato' : isPresent ? 'Presente' : 'Assente'}
      </span>
    )
  }

  async function confirmReminder() {
    if (!pendingReminder) return
    setActionLoading(true)
    setError(null)
    try {
      await notifyAppointment(pendingReminder.id, pendingReminder.channel, 'reminder')
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Errore invio promemoria')
    } finally {
      setActionLoading(false)
      setPendingReminder(null)
    }
  }

  if (state.step !== 'AUTH') return null
  if (!isSecretary) {
    return (
      <div className="ds-card ds-card-body">
        <h2>Agenda</h2>
        <div className="label">Questa pagina è disponibile solo per Segreteria.</div>
      </div>
    )
  }

  return (
    <div className="d-flex flex-column" style={{ gap: 16 }}>
      <h1 className="visually-hidden">Planner</h1>
      <div className="ds-card ds-card-body" style={{ maxWidth: 980, margin: '0 auto' }}>
        <h2 className="visually-hidden">Agenda</h2>
        <div className="d-flex" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="d-flex" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label className="label" htmlFor="planner-from-date">Da</label>
              <input
                id="planner-from-date"
                className="ds-input ds-input-sm"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="planner-to-date">A</label>
              <input
                id="planner-to-date"
                className="ds-input ds-input-sm"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <button
              className="ds-btn ds-btn-ghost ds-btn-sm"
              type="button"
              onClick={() => { setFromDate(''); setToDate('') }}
              disabled={!fromDate && !toDate}
            >
              Reset filtri
            </button>
          </div>
          <button
            className="ds-btn ds-btn-ghost"
            type="button"
            onClick={() => {
              requestedQuery.refetch()
              rejectedQuery.refetch()
              confirmedQuery.refetch()
              completedQuery.refetch()
              doctorsQuery.refetch()
            }}
            disabled={
              requestedQuery.isFetching ||
              rejectedQuery.isFetching ||
              confirmedQuery.isFetching ||
              completedQuery.isFetching ||
              doctorsQuery.isFetching
            }
          >
            {requestedQuery.isFetching ||
            rejectedQuery.isFetching ||
            confirmedQuery.isFetching ||
            completedQuery.isFetching ||
            doctorsQuery.isFetching
              ? 'Caricamento...'
              : 'Ricarica'}
          </button>
        </div>
        {error && <StateBlock tone="error" message={error} />}
        {(requestedQuery.isLoading || rejectedQuery.isLoading || confirmedQuery.isLoading || completedQuery.isLoading || doctorsQuery.isLoading) && (
          <StateBlock tone="loading" message="Caricamento..." />
        )}
        {(requestedQuery.error || rejectedQuery.error || confirmedQuery.error || completedQuery.error || doctorsQuery.error) && (
          <StateBlock
            tone="error"
            message={
              (requestedQuery.error as any)?.response?.data?.detail ||
              (rejectedQuery.error as any)?.response?.data?.detail ||
              (confirmedQuery.error as any)?.response?.data?.detail ||
              (completedQuery.error as any)?.response?.data?.detail ||
              (doctorsQuery.error as any)?.response?.data?.detail ||
              'Errore caricamento agenda'
            }
          />
        )}

        <div className="d-flex" style={{ justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <h3 style={{ textAlign: 'center', margin: 0 }}>Nuove richieste</h3>
          <button
            className="ds-btn ds-btn-ghost ds-btn-sm planner-toggle-btn"
            type="button"
            onClick={() => setShowRequested((prev) => !prev)}
            aria-expanded={showRequested}
          >
            <span className="btn-icon" aria-hidden="true">
              {showRequested ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </span>
            <span className="sr-only">{showRequested ? 'Chiudi' : 'Espandi'}</span>
          </button>
        </div>
        {showRequested && (
          <div>
            <div className="table-responsive app-table-wrap">
              <table className="table table-striped table-hover align-middle app-table app-table-mobile">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Medico</th>
                    <th>Visita</th>
                    <th>Data</th>
                    <th>Richiesta</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {requested.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="label">Nessuna richiesta in attesa</td>
                    </tr>
                  ) : (
                    requested.map(a => (
                      <tr key={a.id}>
                        <td data-label="Cliente">{patientName(a)}</td>
                        <td data-label="Medico">{doctorName(a.doctor_id)}</td>
                        <td data-label="Visita">{specialtyName(a)}</td>
                        <td data-label="Data">{formatDateTime(a.scheduled_at)}</td>
                        <td data-label="Richiesta">{requestDateTime(a)}</td>
                        <td data-label="Azioni">
                          <div className="d-flex" style={{ gap: 8, flexWrap: 'wrap' }}>
                            <button
                              className="ds-btn ds-btn-primary ds-btn-sm"
                              type="button"
                              onClick={() => setPending({ id: a.id, status: 'Confirmed' })}
                              disabled={actionLoading}
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
                              onClick={() => setPending({ id: a.id, status: 'Rejected' })}
                              disabled={actionLoading}
                              aria-label="Rifiuta"
                              title="Rifiuta"
                            >
                              <span className="btn-icon" aria-hidden="true">
                                <IconXCircle size={18} />
                              </span>
                              <span className="sr-only">Rifiuta</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <PaginationBar
              page={requestedPage}
              pageSize={requestedPageSize}
              total={requestedQuery.data?.total ?? 0}
              onPageChange={setRequestedPage}
              onPageSizeChange={(next) => { setRequestedPageSize(next); setRequestedPage(1) }}
            />
          </div>
        )}
        <div className="ds-divider" style={{ margin: '16px 0' }} />
        <div className="d-flex" style={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <h3 style={{ textAlign: 'center', margin: 0 }}>Appuntamenti confermati</h3>
          <button
            className="ds-btn ds-btn-ghost ds-btn-sm planner-toggle-btn"
            type="button"
            onClick={() => setShowConfirmed((prev) => !prev)}
            aria-expanded={showConfirmed}
          >
            <span className="btn-icon" aria-hidden="true">
              {showConfirmed ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </span>
            <span className="sr-only">{showConfirmed ? 'Chiudi' : 'Espandi'}</span>
          </button>
        </div>
        {showConfirmed && (
          <div>
        <div className="table-responsive app-table-wrap">
          <table className="table table-striped table-hover align-middle app-table app-table-mobile">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Medico</th>
              <th>Visita</th>
              <th>Data</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {upcomingConfirmed.length === 0 ? (
              <tr>
                <td colSpan={7} className="label">Nessun appuntamento confermato</td>
              </tr>
            ) : (
              upcomingConfirmed.map(a => (
                <tr key={a.id}>
                  <td data-label="Cliente">{patientName(a)}</td>
                  <td data-label="Medico">{doctorName(a.doctor_id)}</td>
                  <td data-label="Visita">{specialtyName(a)}</td>
                  <td data-label="Data">{formatDateTime(a.scheduled_at)}</td>
                  <td data-label="Stato">
                    <span className="status-pill" data-status={a.status}>
                      {statusLabel(a.status)}
                    </span>
                  </td>
                  <td data-label="Azioni">
                    <div className="d-flex" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button
                        className="ds-btn ds-btn-ghost ds-btn-sm"
                        type="button"
                        onClick={() => setPendingReminder({ id: a.id, channel: 'email' })}
                        disabled={actionLoading}
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
                        onClick={() => setPendingReminder({ id: a.id, channel: 'sms' })}
                        disabled={actionLoading}
                        aria-label="Promemoria SMS"
                        title="Promemoria SMS"
                      >
                        <span className="btn-icon" aria-hidden="true">
                          <IconMessage size={18} />
                        </span>
                        <span className="sr-only">Promemoria SMS</span>
                      </button>
                      <button
                        className="ds-btn ds-btn-danger ds-btn-sm"
                        type="button"
                        onClick={() => setPendingDelete({ id: a.id })}
                        disabled={actionLoading}
                        aria-label="Elimina"
                        title="Elimina"
                      >
                        <span className="btn-icon" aria-hidden="true">
                          <IconTrash size={18} />
                        </span>
                        <span className="sr-only">Elimina</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
        <PaginationBar
          page={confirmedPage}
          pageSize={confirmedPageSize}
          total={confirmedQuery.data?.total ?? 0}
          onPageChange={setConfirmedPage}
          onPageSizeChange={(next) => { setConfirmedPageSize(next); setConfirmedPage(1) }}
        />
        <div className="label" style={{ marginTop: 8 }}>
          Nota: l’eliminazione è bloccata se esistono referti associati all’appuntamento.
        </div>
          </div>
        )}
        <div className="ds-divider" style={{ margin: '16px 0' }} />
        <div className="d-flex" style={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <h3 style={{ textAlign: 'center', margin: 0 }}>Appuntamenti effettuati</h3>
          <button
            className="ds-btn ds-btn-ghost ds-btn-sm planner-toggle-btn"
            type="button"
            onClick={() => setShowCompleted((prev) => !prev)}
            aria-expanded={showCompleted}
          >
            <span className="btn-icon" aria-hidden="true">
              {showCompleted ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </span>
            <span className="sr-only">{showCompleted ? 'Chiudi' : 'Espandi'}</span>
          </button>
        </div>
        {showCompleted && (
          <div>
        <div className="table-responsive app-table-wrap">
          <table className="table table-striped table-hover align-middle app-table app-table-mobile">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Medico</th>
                <th>Visita</th>
                <th>Data</th>
                <th>Referto</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {completedAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="label">Nessun appuntamento effettuato da archiviare</td>
                </tr>
              ) : (
                completedAppointments.map(a => (
                  <tr key={a.id}>
                    <td data-label="Cliente">{patientName(a)}</td>
                    <td data-label="Medico">{doctorName(a.doctor_id)}</td>
                    <td data-label="Visita">{specialtyName(a)}</td>
                    <td data-label="Data">{formatDateTime(a.scheduled_at)}</td>
                    <td data-label="Referto">{reportBadge(a.has_report, a.report_archived)}</td>
                    <td data-label="Stato">
                      <span className="status-pill" data-status={a.status}>
                        {statusLabel(a.status)}
                      </span>
                    </td>
                    <td data-label="Azioni">
                      <button
                        className="ds-btn ds-btn-ghost ds-btn-sm"
                        type="button"
                        onClick={() => setPendingArchive({ id: a.id })}
                        disabled={actionLoading || !a.has_report || a.report_archived}
                        aria-label="Archivia referto"
                        title="Archivia referto"
                      >
                        <span className="btn-icon" aria-hidden="true">
                          <IconFilePlus size={18} />
                        </span>
                        <span className="sr-only">Archivia referto</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationBar
          page={completedPage}
          pageSize={completedPageSize}
          total={completedQuery.data?.total ?? 0}
          onPageChange={setCompletedPage}
          onPageSizeChange={(next) => { setCompletedPageSize(next); setCompletedPage(1) }}
        />
        <div className="label" style={{ marginTop: 8 }}>
          Nota: gli appuntamenti con referto archiviato non compaiono piu in questa sezione.
        </div>
          </div>
        )}
        <div className="ds-divider" style={{ margin: '16px 0' }} />
        <div className="d-flex" style={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <h3 style={{ textAlign: 'center', margin: 0 }}>Appuntamenti rifiutati</h3>
          <button
            className="ds-btn ds-btn-ghost ds-btn-sm planner-toggle-btn"
            type="button"
            onClick={() => setShowRejected((prev) => !prev)}
            aria-expanded={showRejected}
          >
            <span className="btn-icon" aria-hidden="true">
              {showRejected ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </span>
            <span className="sr-only">{showRejected ? 'Chiudi' : 'Espandi'}</span>
          </button>
        </div>
        {showRejected && (
          <div>
        <div className="table-responsive app-table-wrap">
          <table className="table table-striped table-hover align-middle app-table app-table-mobile">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Medico</th>
                <th>Visita</th>
                <th>Data</th>
                <th className="table-center">Stato</th>
              </tr>
            </thead>
            <tbody>
              {rejected.length === 0 ? (
                <tr>
                  <td colSpan={5} className="label">Nessun appuntamento rifiutato</td>
                </tr>
              ) : (
                rejected.map(a => (
                  <tr key={a.id}>
                    <td data-label="Cliente">{patientName(a)}</td>
                    <td data-label="Medico">{doctorName(a.doctor_id)}</td>
                    <td data-label="Visita">{specialtyName(a)}</td>
                    <td data-label="Data">{formatDateTime(a.scheduled_at)}</td>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationBar
          page={rejectedPage}
          pageSize={rejectedPageSize}
          total={rejectedQuery.data?.total ?? 0}
          onPageChange={setRejectedPage}
          onPageSizeChange={(next) => { setRejectedPageSize(next); setRejectedPage(1) }}
        />
          </div>
        )}
      </div>

      {pending && (
        <ConfirmModal
          title="Conferma aggiornamento stato"
          message={`Confermi lo stato '${statusLabel(pending.status)}' per questa richiesta?`}
          confirmLabel="Conferma"
          cancelLabel="Annulla"
          onCancel={() => setPending(null)}
          onConfirm={async () => {
            setActionLoading(true)
            setError(null)
            try {
              await updateAppointmentStatus(pending.id, pending.status)
              await requestedQuery.refetch()
              await confirmedQuery.refetch()
              await completedQuery.refetch()
            } catch (e: any) {
              setError(e?.response?.data?.detail || 'Errore aggiornamento appuntamento')
            } finally {
              setActionLoading(false)
              setPending(null)
            }
          }}
        />
      )}

      {pendingDelete && (
        <ConfirmModal
          title="Conferma eliminazione"
          message="Eliminare definitivamente questo appuntamento?"
          confirmLabel="Elimina"
          cancelLabel="Annulla"
          variant="danger"
          onCancel={() => setPendingDelete(null)}
          onConfirm={async () => {
            setActionLoading(true)
            setError(null)
            try {
              await deleteAppointment(pendingDelete.id)
              await requestedQuery.refetch()
              await confirmedQuery.refetch()
              await completedQuery.refetch()
            } catch (e: any) {
              setError(e?.response?.data?.detail || 'Errore eliminazione appuntamento')
            } finally {
              setActionLoading(false)
              setPendingDelete(null)
            }
          }}
        />
      )}

      {pendingArchive && (
        <ConfirmModal
          title="Archivia referto"
          message="Vuoi archiviare i referti di questo appuntamento? I file verranno spostati in archivio."
          confirmLabel="Archivia"
          cancelLabel="Annulla"
          onCancel={() => setPendingArchive(null)}
          onConfirm={async () => {
            setActionLoading(true)
            setError(null)
            try {
              await archiveAppointmentReport(pendingArchive.id)
              await requestedQuery.refetch()
              await confirmedQuery.refetch()
              await completedQuery.refetch()
            } catch (e: any) {
              setError(e?.response?.data?.detail || 'Errore archiviazione referto')
            } finally {
              setActionLoading(false)
              setPendingArchive(null)
            }
          }}
        />
      )}
      {pendingReminder && (
        <ConfirmModal
          title="Conferma invio promemoria"
          message={`Inviare un promemoria via ${pendingReminder.channel === 'email' ? 'email' : 'SMS'} al paziente?`}
          confirmLabel="Invia"
          cancelLabel="Annulla"
          onCancel={() => setPendingReminder(null)}
          onConfirm={confirmReminder}
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

