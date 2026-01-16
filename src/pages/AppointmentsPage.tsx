import { useEffect, useMemo, useState } from 'react'
import { DatePicker } from '@mui/x-date-pickers'
import { DigitalClock } from '@mui/x-date-pickers/DigitalClock'
import { format } from 'date-fns'
import Tooltip from '@mui/material/Tooltip'
import { createAppointment, listAppointments, listDoctors, listSpecialties, Doctor, Specialty } from '../services/appointmentsApi'
import { useAuth } from '../auth/AuthContext'
import ConfirmModal from '../components/ConfirmModal'
import FormSelect from '../components/FormSelect'
import { statusLabel } from '../utils/status'
import { listReports, previewReport, downloadReport, ReportDto } from '../services/reportsApi'
import { IconDownload, IconEye } from '../components/Icon'
import { PaginationBar } from '../components/PaginationBar'
import { useQuery } from '@tanstack/react-query'
import { StateBlock } from '../components/StateBlock'

type Appt = {
  id: number
  patient_id: number
  doctor_id: number
  scheduled_at: string
  status: string
  price_cents?: number | null
  specialty_id?: number | null
  rejected_note?: string | null
}

export default function AppointmentsPage() {
  const { state } = useAuth()
  const isPatient = state.step === 'AUTH' && state.user.roles.includes('Patient')

  const [items, setItems] = useState<Appt[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([])
  const [specialtyId, setSpecialtyId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [pendingConfirm, setPendingConfirm] = useState<string | null>(null)
  const [reportsByAppointment, setReportsByAppointment] = useState<Record<number, ReportDto[]>>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [rejectNoteMessage, setRejectNoteMessage] = useState<string | null>(null)
  const currentStep = !specialtyId ? 1 : !doctorId ? 2 : !selectedDate ? 3 : !selectedTime ? 4 : 5
  const steps = [
    { id: 1, title: 'Specialistica', desc: 'Scegli l’area' },
    { id: 2, title: 'Medico', desc: 'Seleziona il professionista' },
    { id: 3, title: 'Giorno', desc: 'Scegli la data' },
    { id: 4, title: 'Orario', desc: 'Scegli l’ora' },
    { id: 5, title: 'Conferma', desc: 'Prenota la visita' },
  ] as const

  const doctorNameById = useMemo(() => {
    const m = new Map<number, string>()
    for (const d of allDoctors) m.set(d.id, `${d.first_name} ${d.last_name}`.trim())
    return m
  }, [allDoctors])
  const specialtyNameById = useMemo(() => {
    const m = new Map<number, string>()
    for (const s of specialties) m.set(s.id, s.name)
    return m
  }, [specialties])

  function formatEuro(cents: number | null | undefined) {
    if (cents == null) return '-'
    return (cents / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
  }

  function formatRomeDateTime(iso: string) {
    return new Date(iso).toLocaleString('it-IT', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  function formatRomeHourFromIso(iso: string) {
    const fmt = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', hour12: false })
    return `${fmt.format(new Date(iso))}:00`
  }

  function formatRomeHourFromDate(date: Date) {
    const fmt = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', hour12: false })
    return `${fmt.format(date)}:00`
  }

  function getRomeNowParts() {
    const parts = new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date())
    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
    const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
    return { hour, minute }
  }

  function averagePriceCentsForSpecialtyName(name: string) {
    const m: Record<string, number> = {
      Cardiologia: 13000,
      Ortopedia: 12000,
      Dermatologia: 11000,
      Neurologia: 14000,
      Pediatria: 10000,
      Oculistica: 9000,
      Ginecologia: 12000,
      Psichiatria: 15000,
    }
    return m[name] ?? 10000
  }

  function isoDateRome(d: Date) {
    return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' })
  }

  function easterSunday(year: number) {
    // Anonymous Gregorian algorithm
    const a = year % 19
    const b = Math.floor(year / 100)
    const c = year % 100
    const d = Math.floor(b / 4)
    const e = b % 4
    const f = Math.floor((b + 8) / 25)
    const g = Math.floor((b - f + 1) / 3)
    const h = (19 * a + b - d - g + 15) % 30
    const i = Math.floor(c / 4)
    const k = c % 4
    const l = (32 + 2 * e + 2 * i - h - k) % 7
    const m = Math.floor((a + 11 * h + 22 * l) / 451)
    const month = Math.floor((h + l - 7 * m + 114) / 31)
    const day = ((h + l - 7 * m + 114) % 31) + 1
    return new Date(Date.UTC(year, month - 1, day))
  }

  function holidayKeysForYear(year: number) {
    const fixed = [
      `${year}-01-01`,
      `${year}-01-06`,
      `${year}-04-25`,
      `${year}-05-01`,
      `${year}-06-02`,
      `${year}-08-15`,
      `${year}-11-01`,
      `${year}-12-08`,
      `${year}-12-25`,
      `${year}-12-26`,
    ]
    const easter = easterSunday(year)
    const easterKey = easter.toISOString().slice(0, 10)
    const easterMonday = new Date(easter)
    easterMonday.setUTCDate(easterMonday.getUTCDate() + 1)
    const easterMondayKey = easterMonday.toISOString().slice(0, 10)
    return new Set([...fixed, easterKey, easterMondayKey])
  }

  function isBookableDay(iso: string) {
    if (!iso) return false
    const d = new Date(`${iso}T00:00:00`)
    const weekday = d.getDay() // 0=Sun
    if (weekday === 0) return false
    const year = Number(iso.slice(0, 4))
    return !holidayKeysForYear(year).has(iso)
  }

  const todayIso = useMemo(() => isoDateRome(new Date()), [])

  const selectedSpecialty = useMemo(() => specialties.find(s => String(s.id) === specialtyId) || null, [specialties, specialtyId])
  const computedPriceCents = useMemo(
    () => (selectedSpecialty ? averagePriceCentsForSpecialtyName(selectedSpecialty.name) : null),
    [selectedSpecialty]
  )

  const busyTimes = useMemo(() => {
    if (!selectedDate) return new Set<string>()
    const s = new Set<string>()
    for (const a of items) {
      if (a.status === 'Cancelled') continue
      if (doctorId && String(a.doctor_id) !== doctorId) continue
      const iso = a.scheduled_at.slice(0, 10)
      if (iso !== selectedDate) continue
      s.add(formatRomeHourFromIso(a.scheduled_at))
    }
    return s
  }, [items, selectedDate, doctorId])

  const openTimes = useMemo(() => {
    const slots: string[] = []
    for (let h = 9; h <= 19; h++) slots.push(`${String(h).padStart(2, '0')}:00`)
    return slots
  }, [])

  const availableTimes = useMemo(() => {
    return openTimes.filter((t) => {
      if (busyTimes.has(t)) return false
      if (selectedDate !== todayIso) return true
      const { hour, minute } = getRomeNowParts()
      const slotHour = Number(t.split(':')[0])
      if (slotHour < hour) return false
      if (slotHour === hour && minute > 0) return false
      return true
    })
  }, [openTimes, busyTimes, selectedDate, todayIso])

  const busyTimesList = useMemo(() => Array.from(busyTimes).sort(), [busyTimes])
  const busyTimesLabel = useMemo(() => {
    if (busyTimesList.length === 0) return ''
    const max = 6
    const shown = busyTimesList.slice(0, max)
    const extra = busyTimesList.length - shown.length
    return extra > 0 ? `${shown.join(', ')} +${extra}` : shown.join(', ')
  }, [busyTimesList])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, fromDate, toDate])

  const apptsQuery = useQuery({
    queryKey: ['appointments', page, pageSize, statusFilter, fromDate, toDate],
    queryFn: async () =>
      listAppointments({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        status: statusFilter || undefined,
        scheduled_from: fromDate || undefined,
        scheduled_to: toDate || undefined,
      }),
    enabled: isPatient,
    keepPreviousData: true,
    staleTime: 30_000,
  })

  const specsQuery = useQuery({
    queryKey: ['specialties'],
    queryFn: async () => listSpecialties({ limit: 500, offset: 0 }),
    enabled: isPatient,
    staleTime: 5 * 60_000,
  })

  const docsQuery = useQuery({
    queryKey: ['doctors', specialtyId],
    queryFn: async () =>
      listDoctors({
        specialty_id: specialtyId ? Number(specialtyId) : undefined,
        limit: 500,
        offset: 0,
      }),
    enabled: isPatient,
    staleTime: 5 * 60_000,
  })

  const reportsQuery = useQuery({
    queryKey: ['reports-by-appt'],
    queryFn: async () => listReports({ limit: 500, offset: 0 }),
    enabled: isPatient,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (apptsQuery.data) {
      setItems(apptsQuery.data.items)
      setTotal(apptsQuery.data.total)
    }
  }, [apptsQuery.data])

  useEffect(() => {
    if (specsQuery.data) {
      setSpecialties(specsQuery.data.items)
    }
  }, [specsQuery.data])

  useEffect(() => {
    if (docsQuery.data) {
      setAllDoctors(docsQuery.data.items)
      setDoctors(docsQuery.data.items)
      setDoctorId('')
      setSelectedDate('')
      setSelectedTime('')
    }
  }, [docsQuery.data, specialtyId])

  useEffect(() => {
    if (reportsQuery.data) {
      const grouped: Record<number, ReportDto[]> = {}
      for (const r of reportsQuery.data.items) {
        if (!grouped[r.appointment_id]) grouped[r.appointment_id] = []
        grouped[r.appointment_id].push(r)
      }
      setReportsByAppointment(grouped)
    }
  }, [reportsQuery.data])

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!specialtyId) return setError('Seleziona una specialistica.')
    if (!doctorId) return setError('Seleziona un medico.')
    if (!selectedDate || !selectedTime) return setError('Seleziona giorno e orario.')
    if (!isBookableDay(selectedDate)) return setError('Il giorno selezionato non è prenotabile (domenica/festività).')

    const scheduled_at = `${selectedDate}T${selectedTime}:00`
    const d = allDoctors.find(d => String(d.id) === doctorId)
    const name = d ? `${d.first_name} ${d.last_name}` : 'il medico selezionato'
    setPendingConfirm(`Confermi prenotazione visita con ${name} il ${formatRomeDateTime(scheduled_at)}? Prezzo indicativo: ${formatEuro(computedPriceCents)}`)
  }

  async function confirmCreate() {
    if (!pendingConfirm) return
    setError(null)
    try {
      const scheduled_at = `${selectedDate}T${selectedTime}:00`
      await createAppointment({ doctor_id: Number(doctorId), scheduled_at, specialty_id: Number(specialtyId) })
      setPendingConfirm(null)
      setDoctorId('')
      setSpecialtyId('')
      setSelectedDate('')
      setSelectedTime('')
      await apptsQuery.refetch()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Errore creazione appuntamento')
    }
  }

  if (!isPatient) {
    return (
      <div className="ds-card ds-card-body">
        <h2>Prenota visita</h2>
        <div className="label">Solo i pazienti possono prenotare visite.</div>
      </div>
    )
  }

  return (
    <div className="ds-card ds-card-body">
      <h2>Prenota visita</h2>
      <div className="booking-steps" role="list" aria-label="Step prenotazione visita">
        {steps.map((step) => {
          const state = step.id < currentStep ? 'done' : step.id === currentStep ? 'active' : 'pending'
          return (
            <div key={step.id} className="booking-step" data-state={state} role="listitem">
              <div className="booking-step-number" aria-hidden="true">{step.id}</div>
              <div>
                <div className="booking-step-title">{step.title}</div>
                <div className="booking-step-desc">{step.desc}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="d-flex" style={{ gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
        <div className="ds-card ds-card-body" style={{ flex: 1, minWidth: 320 }}>
          <div className="label" style={{ marginBottom: 6 }}>1) Seleziona specialistica</div>
          <FormSelect value={specialtyId} onChange={setSpecialtyId} required aria-label="Specialistica">
            <option value="" disabled>Seleziona specialistica</option>
            {specialties.map(s => (
              <option key={s.id} value={String(s.id)}>{s.name}</option>
            ))}
          </FormSelect>
          {!specialtyId && (
            <div className="ds-badge" style={{ marginTop: 8 }}>
              <span className="ds-badge-dot" aria-hidden="true" />
              Seleziona una specialistica per sbloccare medico, data e orario.
            </div>
          )}

          <div className="label" style={{ marginTop: 12, marginBottom: 6 }}>2) Seleziona medico</div>
          <FormSelect value={doctorId} onChange={setDoctorId} required disabled={!specialtyId} aria-label="Medico">
            <option value="" disabled>Seleziona medico</option>
            {doctors.map(d => (
              <option key={d.id} value={String(d.id)}>{d.first_name} {d.last_name}</option>
            ))}
          </FormSelect>
          {specialtyId && !doctorId && (
            <div className="ds-badge" style={{ marginTop: 8 }}>
              <span className="ds-badge-dot" aria-hidden="true" />
              Seleziona un medico per scegliere data e orario.
            </div>
          )}

          <div className="label" style={{ marginTop: 12, marginBottom: 6 }}>Prezzo indicativo</div>
          <div style={{ fontSize: 20, fontWeight: 750 }}>{formatEuro(computedPriceCents)}</div>
          <div className="label">Visite da lunedì a sabato, 09:00–20:00 (durata 1 ora).</div>
        </div>

        <div className="ds-card ds-card-body" style={{ flex: 2, minWidth: 340 }}>
          <div className="label">3) Seleziona giorno</div>
          <DatePicker
            value={selectedDate ? new Date(`${selectedDate}T00:00:00`) : null}
            onChange={(value) => {
              if (!value) {
                setSelectedDate('')
                setSelectedTime('')
                return
              }
              const iso = isoDateRome(value)
              setSelectedDate(iso)
              setSelectedTime('')
            }}
            disabled={!doctorId}
            disablePast
            shouldDisableDate={(value) => {
              const iso = isoDateRome(value)
              return iso < todayIso || !isBookableDay(iso)
            }}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
                placeholder: 'Seleziona la data',
              },
            }}
          />
          {selectedDate && (
            <div className="ds-badge" style={{ marginTop: 8 }}>
              <span className="ds-badge-dot" aria-hidden="true" />
              Posti disponibili: {availableTimes.length}
            </div>
          )}
          {doctorId && !selectedDate && (
            <div className="ds-badge" style={{ marginTop: 8 }}>
              <span className="ds-badge-dot" aria-hidden="true" />
              Seleziona una data per vedere gli orari disponibili.
            </div>
          )}

          <div className="label" style={{ marginTop: 14 }}>4) Seleziona orario</div>
          <Tooltip
            title={busyTimesList.length ? `Orari occupati: ${busyTimesList.join(', ')}` : ''}
            placement="top"
            arrow
            disableHoverListener={!busyTimesList.length}
          >
            <div>
              <DigitalClock
                value={selectedTime ? new Date(`1970-01-01T${selectedTime}:00`) : null}
                onChange={(value) => {
                  if (!value) {
                    setSelectedTime('')
                    return
                  }
                  setSelectedTime(format(value, 'HH:00'))
                }}
                disabled={!selectedDate || !doctorId}
                timeStep={60}
                skipDisabled
                minTime={new Date(1970, 0, 1, 9, 0, 0, 0)}
                maxTime={new Date(1970, 0, 1, 19, 0, 0, 0)}
                shouldDisableTime={(value, clockType) => {
                  if (!selectedDate) return true
                  if (clockType !== 'hours') return false
                  const timeKey = value instanceof Date
                    ? formatRomeHourFromDate(value)
                    : `${String(value).padStart(2, '0')}:00`
                  if (selectedDate === todayIso) {
                    const { hour, minute } = getRomeNowParts()
                    const slotHour = Number(timeKey.split(':')[0])
                    if (slotHour < hour) return true
                    if (slotHour === hour && minute > 0) return true
                  }
                  return busyTimes.has(timeKey)
                }}
                sx={{
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '4px 0',
                  maxHeight: 180,
                  backgroundColor: 'var(--surface)',
                }}
              />
            </div>
          </Tooltip>
          {selectedDate && availableTimes.length === 0 && (
            <div className="label" style={{ marginTop: 8 }}>
              Nessun orario disponibile per la data selezionata.
            </div>
          )}
          {selectedDate && !selectedTime && availableTimes.length > 0 && (
            <div className="ds-badge" style={{ marginTop: 8 }}>
              <span className="ds-badge-dot" aria-hidden="true" />
              Seleziona un orario disponibile per completare la prenotazione.
            </div>
          )}
          {selectedDate && busyTimesList.length > 0 && (
            <div className="ds-badge" style={{ marginTop: 8, flexWrap: 'wrap' }}>
              <span className="ds-badge-dot" aria-hidden="true" />
              Orari occupati: {busyTimesLabel}
            </div>
          )}

<form onSubmit={onCreate} className="d-flex" style={{ marginTop: 14, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button className="ds-btn ds-btn-primary" disabled={!specialtyId || !doctorId || !selectedDate || !selectedTime}>
              Prenota visita
            </button>
          </form>
        </div>
      </div>

      <div className="spacer"></div>
      {error && <StateBlock tone="error" message={error} />}
      {apptsQuery.isLoading && <StateBlock tone="loading" message="Caricamento..." />}
      {apptsQuery.error && !error && <StateBlock tone="error" message={(apptsQuery.error as any)?.response?.data?.detail || 'Errore caricamento appuntamenti'} />}

      <div className="d-flex" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 10 }}>
        <div>
          <label className="label" htmlFor="patient-appts-status">Stato</label>
          <FormSelect id="patient-appts-status" value={statusFilter} onChange={setStatusFilter} aria-label="Filtro stato" className="ds-input-sm">
            <option value="">Tutti</option>
            <option value="Requested">Richiesto</option>
            <option value="Confirmed">Confermato</option>
            <option value="Rejected">Rifiutato</option>
            <option value="Completed">Completato</option>
            <option value="Cancelled">Annullato</option>
          </FormSelect>
        </div>
        <div>
          <div className="label">Da</div>
          <input className="ds-input ds-input-sm" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div>
          <div className="label">A</div>
          <input className="ds-input ds-input-sm" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <button className="ds-btn ds-btn-ghost ds-btn-sm" type="button" onClick={() => { setStatusFilter(''); setFromDate(''); setToDate('') }} disabled={!statusFilter && !fromDate && !toDate}>
          Reset filtri
        </button>
      </div>

      <div className="table-responsive app-table-wrap">
        <table className="table table-striped table-hover align-middle app-table app-table-mobile">
          <thead>
            <tr>
              <th>Medico</th>
              <th>Specialistica</th>
              <th>Data</th>
              <th>Prezzo</th>
                <th className="table-center">Stato</th>
              <th>Referto</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="label">Nessuna prenotazione</td>
              </tr>
            ) : (
              items.map(a => (
                <tr key={a.id}>
                  <td data-label="Medico">{(() => {
                    const d = allDoctors.find(x => x.id === a.doctor_id)
                    return d ? `${d.first_name} ${d.last_name}` : '-'
                  })()}</td>
                  <td data-label="Specialistica">
                    {a.specialty_id ? (specialtyNameById.get(a.specialty_id) || '-') : '-'}
                  </td>
                  <td data-label="Data">{formatRomeDateTime(a.scheduled_at)}</td>
                  <td data-label="Prezzo">{formatEuro(a.price_cents)}</td>
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
                  <td data-label="Referto">
                    {(reportsByAppointment[a.id] || []).filter(r => !r.deleted_at).length ? (
                      <div className="d-flex" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {(reportsByAppointment[a.id] || []).filter(r => !r.deleted_at).map(r => (
                          <div key={r.id} className="d-flex" style={{ gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                            <button
                              className="ds-btn ds-btn-ghost ds-btn-sm report-action-btn"
                              type="button"
                              aria-label="Anteprima"
                              onClick={async () => {
                                try {
                                  const blob = await previewReport(r.id)
                                  const url = URL.createObjectURL(blob)
                                  window.open(url, '_blank', 'noopener,noreferrer')
                                  setTimeout(() => URL.revokeObjectURL(url), 60_000)
                                } catch (e: any) {
                                  setError(e?.response?.data?.detail || 'Errore anteprima referto')
                                }
                              }}
                            >
                              <span className="btn-icon" aria-hidden="true">
                                <IconEye size={18} />
                              </span>
                            </button>
                            <button
                              className="ds-btn ds-btn-ghost ds-btn-sm report-action-btn"
                              type="button"
                              aria-label="Download"
                              onClick={async () => {
                                try {
                                  const blob = await downloadReport(r.id)
                                  const url = URL.createObjectURL(blob)
                                  const aEl = document.createElement('a')
                                  aEl.href = url
                                  aEl.download = r.original_filename || `referto-${r.id}`
                                  document.body.appendChild(aEl)
                                  aEl.click()
                                  aEl.remove()
                                  setTimeout(() => URL.revokeObjectURL(url), 60_000)
                                } catch (e: any) {
                                  setError(e?.response?.data?.detail || 'Errore download referto')
                                }
                              }}
                            >
                              <span className="btn-icon" aria-hidden="true">
                                <IconDownload size={18} />
                              </span>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="label">Non disponibile</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <PaginationBar page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />

      {pendingConfirm && (
        <ConfirmModal
          title="Conferma prenotazione"
          message={pendingConfirm}
          confirmLabel="Conferma"
          cancelLabel="Annulla"
          onCancel={() => setPendingConfirm(null)}
          onConfirm={confirmCreate}
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

