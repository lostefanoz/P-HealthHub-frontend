import { useEffect, useMemo, useState } from 'react'
import { listReports, previewReport, downloadReport, deleteReportWithNote, updateReportNote, uploadReport, ReportDto } from '../services/reportsApi'
import { listAppointments, listSpecialties, AppointmentDto, SpecialtyDto } from '../services/appointmentsApi'
import { PaginationBar } from '../components/PaginationBar'
import { useQuery } from '@tanstack/react-query'
import { StateBlock } from '../components/StateBlock'
import ConfirmModal from '../components/ConfirmModal'
import { IconDownload, IconEdit, IconEye, IconTrash } from '../components/Icon'
import { statusLabel } from '../utils/status'

export default function ArchivedReportsPage() {
  const [reports, setReports] = useState<ReportDto[]>([])
  const [appointments, setAppointments] = useState<AppointmentDto[]>([])
  const [preview, setPreview] = useState<null | { id: number; url: string; type: string; name: string }>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [uploadTarget, setUploadTarget] = useState<AppointmentDto | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadNote, setUploadNote] = useState('')
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ReportDto | null>(null)
  const [deleteNote, setDeleteNote] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editTarget, setEditTarget] = useState<ReportDto | null>(null)
  const [editNote, setEditNote] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [apptPage, setApptPage] = useState(1)
  const [apptPageSize, setApptPageSize] = useState(10)
  const [apptTotal, setApptTotal] = useState(0)
  const [q, setQ] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    setPage(1)
  }, [q, fromDate, toDate])

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', page, pageSize, q, fromDate, toDate],
    queryFn: async () => {
      return await listReports({
        archived_only: false,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        q: q || undefined,
        uploaded_from: fromDate || undefined,
        uploaded_to: toDate || undefined,
      })
    },
    keepPreviousData: true,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (data) {
      setReports(data.items)
      setTotal(data.total)
    }
  }, [data])

  const apptsQuery = useQuery({
    queryKey: ['report-appointments', apptPage, apptPageSize],
    queryFn: async () =>
      listAppointments({
        limit: apptPageSize,
        offset: (apptPage - 1) * apptPageSize,
        status: 'Confirmed,Completed',
      }),
    keepPreviousData: true,
    staleTime: 30_000,
  })

  const specialtiesQuery = useQuery({
    queryKey: ['report-specialties'],
    queryFn: async () => listSpecialties({ limit: 500, offset: 0 }),
    staleTime: 300_000,
  })

  useEffect(() => {
    if (apptsQuery.data) {
      setAppointments(apptsQuery.data.items)
      setApptTotal(apptsQuery.data.total)
    }
  }, [apptsQuery.data])

  const specialtyMap = useMemo(() => {
    const items = specialtiesQuery.data?.items ?? []
    const map = new Map<number, SpecialtyDto>()
    for (const item of items) {
      map.set(item.id, item)
    }
    return map
  }, [specialtiesQuery.data])

  const getAppointmentSpecialty = (appt: AppointmentDto) => {
    if (appt.specialty_id && specialtyMap.has(appt.specialty_id)) {
      return specialtyMap.get(appt.specialty_id)?.name || `ID ${appt.specialty_id}`
    }
    return appt.specialty_id ? `ID ${appt.specialty_id}` : 'N/D'
  }

  const ordered = useMemo(
    () => [...reports].sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()),
    [reports]
  )
  const loadedReports = useMemo(() => ordered.filter((r) => !r.deleted_at), [ordered])
  const deletedReports = useMemo(() => ordered.filter((r) => r.deleted_at), [ordered])
  const pendingAppointments = useMemo(() => appointments.filter((a) => !a.has_report), [appointments])

  function formatDate(value?: string | null) {
    if (!value) return '-'
    return new Date(value).toLocaleString('it-IT', {
      timeZone: 'Europe/Rome',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function fullName(first?: string | null, last?: string | null, fallback?: string) {
    const name = `${first ?? ''} ${last ?? ''}`.trim()
    return name || fallback || '-'
  }

  function canUploadReport(appt: AppointmentDto) {
    const scheduled = new Date(appt.scheduled_at)
    const now = new Date()
    return (appt.status === 'Confirmed' || appt.status === 'Completed') && scheduled <= now
  }

  function reportStatusLabel(appt: AppointmentDto) {
    if (appt.report_archived) return 'Archiviato'
    if (appt.has_report) return 'Presente'
    return 'Assente'
  }

  useEffect(() => {
    return () => {
      if (preview?.url) {
        URL.revokeObjectURL(preview.url)
      }
    }
  }, [preview?.url])

  async function handlePreview(id: number, name?: string | null) {
    try {
      setPreviewLoading(true)
      setActionError(null)
      const blob = await previewReport(id)
      const url = URL.createObjectURL(blob)
      setPreview(prev => {
        if (prev?.url) URL.revokeObjectURL(prev.url)
        return { id, url, type: blob.type || 'application/octet-stream', name: name || `Referto ${id}` }
      })
    } catch (e: any) {
      setActionError(e?.response?.data?.detail || 'Errore anteprima referto')
    } finally {
      setPreviewLoading(false)
    }
  }

  async function handleDownload(id: number, filename?: string | null) {
    try {
      setActionError(null)
      const blob = await downloadReport(id)
      const url = URL.createObjectURL(blob)
      const aEl = document.createElement('a')
      aEl.href = url
      aEl.download = filename || `referto-${id}`
      aEl.rel = 'noopener'
      aEl.click()
      setTimeout(() => URL.revokeObjectURL(url), 30_000)
    } catch (e: any) {
      setActionError(e?.response?.data?.detail || 'Errore download referto')
    }
  }

  async function confirmUpload() {
    if (!uploadTarget) return
    if (!uploadFile && !uploadNote.trim()) {
      setUploadError('Inserisci una nota o seleziona un file.')
      return
    }
    setUploadLoading(true)
    setUploadError(null)
    setActionError(null)
    try {
      await uploadReport({
        appointment_id: uploadTarget.id,
        note: uploadNote.trim() || undefined,
        file: uploadFile ?? null,
      })
      setUploadTarget(null)
      setUploadFile(null)
      setUploadNote('')
      await refetch()
      await apptsQuery.refetch()
    } catch (e: any) {
      setUploadError(e?.response?.data?.detail || 'Errore caricamento referto')
    } finally {
      setUploadLoading(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    if (!deleteNote.trim()) return
    setDeleteLoading(true)
    setActionError(null)
    try {
      await deleteReportWithNote(deleteTarget.id, deleteNote.trim())
      setDeleteTarget(null)
      setDeleteNote('')
      await refetch()
    } catch (e: any) {
      setActionError(e?.response?.data?.detail || 'Errore eliminazione referto')
    } finally {
      setDeleteLoading(false)
    }
  }

  async function confirmEdit() {
    if (!editTarget) return
    if (!editNote.trim()) return
    setEditLoading(true)
    setEditError(null)
    setActionError(null)
    try {
      await updateReportNote(editTarget.id, editNote.trim())
      setEditTarget(null)
      setEditNote('')
      await refetch()
    } catch (e: any) {
      setEditError(e?.response?.data?.detail || 'Errore aggiornamento referto')
    } finally {
      setEditLoading(false)
    }
  }

  function renderTable(title: string, items: ReportDto[], emptyMessage: string, allowDelete = false, showTitle = true) {
    return (
      <>
        {showTitle && <h3 style={{ margin: '16px 0 8px' }}>{title}</h3>}
        <div className="table-responsive app-table-wrap archive-table-wrap">
          <table className="table table-striped table-hover align-middle app-table app-table-mobile archive-table">
            <caption className="visually-hidden">{title}</caption>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Medico</th>
                <th className="archive-col-visit">Visita</th>
                <th>Data visita</th>
                <th>Caricato</th>
                <th>Archiviato</th>
                <th>Note</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="label">{emptyMessage}</td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Cliente">{fullName(r.patient_first_name, r.patient_last_name, r.patient_id ? `ID ${r.patient_id}` : undefined)}</td>
                    <td data-label="Medico">{fullName(r.doctor_first_name, r.doctor_last_name, r.doctor_id ? `ID ${r.doctor_id}` : undefined)}</td>
                    <td className="archive-col-visit" data-label="Visita">
                      {r.specialty_name || (r.specialty_id ? `ID ${r.specialty_id}` : 'N/D')}
                    </td>
                    <td data-label="Data visita">{formatDate(r.appointment_scheduled_at)}</td>
                    <td data-label="Caricato">{formatDate(r.uploaded_at)}</td>
                    <td data-label="Archiviato">{formatDate(r.archived_at)}</td>
                    <td data-label="Note">
                      {r.deleted_at ? `Eliminato - ${r.deleted_note || 'N/D'}` : (r.note || '-')}
                    </td>
                    <td data-label="Azioni">
                      <div className="d-flex" style={{ gap: 8, flexWrap: 'wrap' }}>
                        <button
                          className="ds-btn ds-btn-ghost ds-btn-sm report-action-btn"
                          type="button"
                          onClick={() => handlePreview(r.id, r.original_filename)}
                          disabled={previewLoading}
                          aria-label="Anteprima"
                        >
                          <span className="btn-icon" aria-hidden="true">
                            <IconEye size={18} />
                          </span>
                        </button>
                        <button
                          className="ds-btn ds-btn-primary ds-btn-sm report-action-btn"
                          type="button"
                          onClick={() => handleDownload(r.id, r.original_filename)}
                          aria-label="Download"
                        >
                          <span className="btn-icon" aria-hidden="true">
                            <IconDownload size={18} />
                          </span>
                        </button>
                        <button
                          className="ds-btn ds-btn-ghost ds-btn-sm report-action-btn"
                          type="button"
                          onClick={() => { setEditTarget(r); setEditNote(r.note || ''); setEditError(null) }}
                          aria-label="Modifica note referto"
                          disabled={r.deleted_at || editLoading}
                        >
                          <span className="btn-icon" aria-hidden="true">
                            <IconEdit size={18} />
                          </span>
                        </button>
                        {allowDelete && (
                          <button
                            className="ds-btn ds-btn-danger ds-btn-sm report-action-btn"
                            type="button"
                            onClick={() => {
                              setDeleteTarget(r)
                              setDeleteNote('')
                            }}
                            aria-label="Elimina"
                          >
                            <span className="btn-icon" aria-hidden="true">
                              <IconTrash size={18} />
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  return (
    <div className="ds-card ds-card-body" style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div className="d-flex" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 className="visually-hidden">Referti</h1>
        <h2 style={{ margin: 0 }}>Referti</h2>
        <button className="ds-btn ds-btn-ghost" type="button" onClick={() => { refetch(); apptsQuery.refetch() }}>
          Ricarica
        </button>
      </div>
      <div style={{ marginTop: 16 }}>
        <h3 style={{ margin: '0 0 8px' }}>Carica referti</h3>
        <div className="label" style={{ marginBottom: 8 }}>
          Puoi caricare o generare un referto solo dopo la data e l&apos;ora dell&apos;appuntamento confermato.
        </div>
        {apptsQuery.isLoading && <StateBlock tone="loading" message="Caricamento appuntamenti..." />}
        {apptsQuery.error && <StateBlock tone="error" message={(apptsQuery.error as any)?.response?.data?.detail || 'Errore caricamento appuntamenti'} />}
        {!apptsQuery.isLoading && !apptsQuery.error && (
          <>
            <div className="table-responsive app-table-wrap">
              <table className="table table-striped table-hover align-middle app-table app-table-mobile">
                <caption className="visually-hidden">Referti da caricare</caption>
                <thead>
                  <tr>
                    <th>Paziente</th>
                    <th>Visita</th>
                    <th>Data visita</th>
                    <th>Stato</th>
                    <th>Referto</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="label">Nessun referto da caricare.</td>
                    </tr>
                  ) : (
                    pendingAppointments.map((a) => (
                      <tr key={a.id}>
                        <td data-label="Paziente">
                          {a.patient_first_name || a.patient_last_name
                            ? `${a.patient_first_name ?? ''} ${a.patient_last_name ?? ''}`.trim()
                            : `ID ${a.patient_id}`}
                        </td>
                        <td data-label="Visita">{getAppointmentSpecialty(a)}</td>
                        <td data-label="Data visita">{formatDate(a.scheduled_at)}</td>
                        <td data-label="Stato">
                          <span className="status-pill" data-status={a.status}>
                            {statusLabel(a.status)}
                          </span>
                        </td>
                        <td data-label="Referto">{reportStatusLabel(a)}</td>
                        <td data-label="Azioni">
                          <button
                            className="ds-btn ds-btn-primary ds-btn-sm"
                            type="button"
                            onClick={() => {
                              setUploadTarget(a)
                              setUploadFile(null)
                              setUploadNote('')
                              setUploadError(null)
                            }}
                            disabled={!canUploadReport(a)}
                          >
                            Carica referto
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <PaginationBar page={apptPage} pageSize={apptPageSize} total={apptTotal} onPageChange={setApptPage} onPageSizeChange={setApptPageSize} />
          </>
        )}
      </div>
      <div className="d-flex" style={{ gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginTop: 12 }}>
        <div style={{ minWidth: 220 }}>
          <label className="label" htmlFor="reports-search">Ricerca</label>
          <input
            id="reports-search"
            className="ds-input ds-input-sm"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Note"
          />
        </div>
        <div>
          <label className="label" htmlFor="reports-from">Da</label>
          <input
            id="reports-from"
            className="ds-input ds-input-sm"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="reports-to">A</label>
          <input
            id="reports-to"
            className="ds-input ds-input-sm"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <button className="ds-btn ds-btn-ghost ds-btn-sm" type="button" onClick={() => { setQ(''); setFromDate(''); setToDate('') }} disabled={!q && !fromDate && !toDate}>
          Reset filtri
        </button>
      </div>
      {isLoading && <StateBlock tone="loading" message="Caricamento..." />}
      {error && <StateBlock tone="error" message={(error as any)?.response?.data?.detail || 'Errore caricamento referti'} />}
      {actionError && <StateBlock tone="error" message={actionError} />}

      {!isLoading && !error && (
        <>
          {renderTable('Referti caricati', loadedReports, 'Nessun referto caricato', true)}
          <details style={{ marginTop: 16 }}>
            <summary className="label" style={{ cursor: 'pointer' }}>Referti eliminati</summary>
            {renderTable('Referti eliminati', deletedReports, 'Nessun referto eliminato', false, false)}
          </details>
          <PaginationBar page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </>
      )}
      {uploadTarget && (
        <ConfirmModal
          title="Carica referto"
          message={`Carica o genera il referto per l'appuntamento del ${formatDate(uploadTarget.scheduled_at)}.`}
          confirmLabel={uploadLoading ? 'Caricamento...' : 'Conferma'}
          cancelLabel="Annulla"
          confirmDisabled={uploadLoading || (!uploadFile && !uploadNote.trim())}
          onCancel={() => { setUploadTarget(null); setUploadFile(null); setUploadNote(''); setUploadError(null) }}
          onConfirm={confirmUpload}
        >
          <label className="d-flex flex-column gap-1">
            <span className="label">File referto (opzionale)</span>
            <input
              className="ds-input"
              type="file"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              disabled={uploadLoading}
            />
          </label>
          <label className="d-flex flex-column gap-1" style={{ marginTop: 12 }}>
            <span className="label">Note referto (obbligatorie se non carichi un file)</span>
            <textarea
              className="ds-input"
              rows={4}
              value={uploadNote}
              onChange={(e) => setUploadNote(e.target.value)}
              placeholder="Inserisci le note cliniche da includere nel referto"
              disabled={uploadLoading}
            />
          </label>
          {uploadError && <div className="label" style={{ color: '#dc2626', marginTop: 8 }}>{uploadError}</div>}
        </ConfirmModal>
      )}
      {deleteTarget && (
        <ConfirmModal
          title="Elimina referto"
          message={`Confermi di eliminare il referto ${deleteTarget.original_filename || `#${deleteTarget.id}`}? Verrà archiviato come eliminato.`}
          confirmLabel={deleteLoading ? 'Eliminazione...' : 'Elimina referto'}
          cancelLabel="Annulla"
          variant="danger"
          confirmDisabled={deleteLoading || !deleteNote.trim()}
          onCancel={() => { setDeleteTarget(null); setDeleteNote('') }}
          onConfirm={confirmDelete}
        >
          <label className="d-flex flex-column gap-1">
            <span className="label">Nota eliminazione (obbligatoria)</span>
            <textarea
              className="ds-input"
              rows={3}
              value={deleteNote}
              onChange={(e) => setDeleteNote(e.target.value)}
              placeholder="Motivo dell'eliminazione del referto"
              disabled={deleteLoading}
            />
          </label>
        </ConfirmModal>
      )}
      {editTarget && (
        <ConfirmModal
          title="Modifica note referto"
          message="Aggiorna le note: il documento sarà rigenerato con il nuovo contenuto."
          confirmLabel={editLoading ? 'Aggiornamento...' : 'Salva'}
          cancelLabel="Annulla"
          confirmDisabled={!editNote.trim() || editLoading}
          onCancel={() => { setEditTarget(null); setEditNote(''); setEditError(null) }}
          onConfirm={confirmEdit}
        >
          <label className="d-flex flex-column gap-1">
            <span className="label">Note referto</span>
            <textarea
              className="ds-input"
              rows={4}
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="Inserisci le note aggiornate"
              disabled={editLoading}
            />
          </label>
          {editError && <div className="label" style={{ color: '#dc2626', marginTop: 8 }}>{editError}</div>}
        </ConfirmModal>
      )}
      {(previewLoading || preview) && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setPreview(null)
            }
          }}
        >
          <div className="ds-card ds-card-body modal-card modal-preview-card">
            <div className="d-flex" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div className="label" style={{ fontWeight: 600 }}>
                Anteprima: {preview?.name || 'Referto'}
              </div>
              <button
                className="ds-btn ds-btn-ghost ds-btn-sm"
                type="button"
                onClick={() => setPreview(null)}
                disabled={previewLoading}
              >
                Chiudi
              </button>
            </div>
            {previewLoading ? (
              <div className="label" style={{ marginTop: 12 }}>Caricamento anteprima...</div>
            ) : preview ? (
              preview.type.startsWith('image/') ? (
                <div className="modal-preview-body">
                  <img src={preview.url} alt={preview.name} className="modal-preview-image" />
                </div>
              ) : (
                <div className="modal-preview-body">
                  <iframe
                    title={`Anteprima ${preview.name}`}
                    src={preview.url}
                    className="modal-preview-frame"
                  />
                </div>
              )
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
