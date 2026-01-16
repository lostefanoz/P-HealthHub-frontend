import { useMemo, useState } from 'react'

import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext'

import { listAppointments, listDoctors, listSpecialties, AppointmentDto, Doctor, Specialty } from '../services/appointmentsApi'

import { getAppointmentStats, getAccessLogs } from '../services/adminApi'
import { statusLabel } from '../utils/status'

import { IconCalendar, IconShield, IconUser } from '../components/Icon'
import ConfirmModal from '../components/ConfirmModal'

import { useQuery } from '@tanstack/react-query'

import { StateBlock } from '../components/StateBlock'



type Appt = AppointmentDto



export default function HomePage() {

  const { state } = useAuth()

  if (state.step !== 'AUTH') return null



  const u = state.user

  const isPatient = u.roles.includes('Patient')

  const isDoctor = u.roles.includes('Doctor')

  const isAdmin = u.roles.includes('Admin')

  const isSecretary = u.roles.includes('Secretary')



  const navigate = useNavigate()



  const [adminUserQuery, setAdminUserQuery] = useState('')
  const [rejectNoteMessage, setRejectNoteMessage] = useState<string | null>(null)



  const appointmentsQuery = useQuery({

    queryKey: ['home-appointments'],

    queryFn: async () => await listAppointments({ limit: 500, offset: 0 }),

    enabled: isPatient || isDoctor,

    staleTime: 30_000,

  })



  const doctorsQuery = useQuery({

    queryKey: ['home-doctors'],

    queryFn: async () => {

      const [docs, specs] = await Promise.all([

        listDoctors({ limit: 500, offset: 0 }),

        listSpecialties({ limit: 500, offset: 0 }),

      ])

      return { doctors: docs.items, specialties: specs.items }

    },

    enabled: isPatient || isDoctor,

    staleTime: 300_000,

  })



  const adminQuery = useQuery({

    queryKey: ['home-admin'],

    queryFn: async () => {

      const [s, logs] = await Promise.all([getAppointmentStats(), getAccessLogs({ limit: 5, offset: 0 })])

      return { stats: s, logs: logs.items }

    },

    enabled: isAdmin,

    staleTime: 30_000,

  })



  const doctorInfo = useMemo(() => {

    const map: Record<number, { name: string; specialties: string[] }> = {}

    const docs = doctorsQuery.data?.doctors ?? []

    for (const d of docs as Doctor[]) {

      const name = `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim() || d.email

      map[d.id] = {

        name,

        specialties: (d.specialties || []).map((s) => s.name),

      }

    }

    return map

  }, [doctorsQuery.data])



  const specialtyLookup = useMemo(() => {

    const map: Record<number, string> = {}

    const specs = doctorsQuery.data?.specialties ?? []

    for (const s of specs as Specialty[]) {

      map[s.id] = s.name

    }

    return map

  }, [doctorsQuery.data])



  const upcoming = useMemo(() => {

    const items = appointmentsQuery.data?.items ?? []

    return items

      .filter(a => new Date(a.scheduled_at).getTime() >= Date.now())

      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  }, [appointmentsQuery.data])



  const patientAppts = useMemo(

    () => (isPatient ? upcoming.filter(a => a.patient_id === u.id).slice(0, 5) : []),

    [isPatient, upcoming, u.id]

  )

  const isRejectedStatus = (status: string) => {
    const normalized = String(status).toLowerCase().trim()
    return normalized === 'rejected' || normalized === 'rifiutato' || statusLabel(status).toLowerCase().trim() === 'rifiutato'
  }

  const shouldShowRejectNote = (appt: Appt) => isRejectedStatus(appt.status) || Boolean(appt.rejected_note)

  const doctorAppts = useMemo(

    () => (isDoctor ? upcoming.filter(a => a.doctor_id === u.id).slice(0, 5) : []),

    [isDoctor, upcoming, u.id]

  )



  const patientError =

    isPatient

      ? (appointmentsQuery.error as any)?.response?.data?.detail ||

        (doctorsQuery.error as any)?.response?.data?.detail ||

        null

      : null

  const doctorError =

    isDoctor ? (appointmentsQuery.error as any)?.response?.data?.detail || null : null

  const adminError =

    isAdmin ? (adminQuery.error as any)?.response?.data?.detail || null : null



  const displayName = useMemo(() => {

    const full = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()

    return full || u.email

  }, [u.first_name, u.last_name, u.email])



  const getDoctorName = (a: Appt) => doctorInfo[a.doctor_id]?.name || 'N/D'

  const getPatientName = (a: Appt) => {

    const name = `${a.patient_first_name ?? ''} ${a.patient_last_name ?? ''}`.trim()

    return name || `ID ${a.patient_id}`

  }

  const getSpecialtyName = (a: Appt) => {

    if (a.specialty_id && specialtyLookup[a.specialty_id]) return specialtyLookup[a.specialty_id]

    const specs = doctorInfo[a.doctor_id]?.specialties || []

    return specs.length === 1 ? specs[0] : 'N/D'

  }

  const formatEuro = (cents?: number | null) => {

    if (cents == null) return '-'

    return (cents / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })

  }



  return (

    <div className="home-bg">
      <h1 className="sr-only">Dashboard</h1>

      <div className="d-flex flex-column" style={{ gap: 16 }}>

        <div className="d-flex" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap', padding: '8px 0' }}>

            <div />

            <div className="d-flex flex-column" style={{ alignItems: 'flex-end', gap: 8, marginLeft: 'auto' }}>

              <div className="d-flex" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>

                {isPatient && <Link to="/app/prenota-visita" className="ds-btn ds-btn-ghost">Prenota visita</Link>}

                {isDoctor && <Link to="/app/doctor/appuntamenti" className="ds-btn ds-btn-ghost">Appuntamenti</Link>}

                {isSecretary && <Link to="/app/planner" className="ds-btn ds-btn-ghost">Agenda</Link>}

                {isAdmin && <Link to="/app/admin/roles" className="ds-btn ds-btn-ghost">Gestione utenti</Link>}

                {isAdmin && <Link to="/app/admin/doctor-specialties" className="ds-btn ds-btn-ghost">Specialistiche</Link>}

                {isAdmin && <Link to="/app/admin/access-logs" className="ds-btn ds-btn-ghost">Log accessi</Link>}

              </div>

              <Link to="/app/account" className="label">

                Vai al profilo

              </Link>

            </div>

        </div>



        {isPatient && (

          <div className="ds-card ds-card-body">

            <div className="section-header">

              <div className="section-icon" aria-hidden="true"><IconCalendar /></div>

              <h2>Le tue prossime visite</h2>

            </div>

            {(appointmentsQuery.isLoading || doctorsQuery.isLoading) && <StateBlock tone="loading" message="Caricamento..." />}

            {patientError && <StateBlock tone="error" message={patientError} />}

            {!appointmentsQuery.isLoading && !doctorsQuery.isLoading && !patientError && patientAppts.length === 0 && (

              <StateBlock tone="empty" message="Nessuna visita prenotata" />

            )}

            {!appointmentsQuery.isLoading && !doctorsQuery.isLoading && !patientError && patientAppts.length > 0 && (

              <div className="table-responsive app-table-wrap">

                <table className="table table-striped table-hover align-middle app-table app-table-mobile">

                  <thead>

                    <tr>

                      <th>Data</th>

                      <th>Dottore</th>

                      <th>Visita</th>

                      <th>Stato</th>

                    </tr>

                  </thead>

                  <tbody>

                    {patientAppts.map(a => (

                      <tr key={a.id}>

                        <td data-label="Data">{new Date(a.scheduled_at).toLocaleString('it-IT', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>

                        <td data-label="Dottore">{getDoctorName(a)}</td>

                        <td data-label="Visita">{getSpecialtyName(a)}</td>

                        <td data-label="Stato">

                          <div className="status-with-note">

                            <span className="status-pill" data-status={a.status}>

                              {statusLabel(a.status)}

                            </span>

                            <span className="status-note-slot" aria-hidden={!shouldShowRejectNote(a)}>

                              {shouldShowRejectNote(a) && (

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

                    ))}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        )}



        {isDoctor && (

          <div className="ds-card ds-card-body">

            <div className="section-header">

              <div className="section-icon" aria-hidden="true"><IconCalendar /></div>

              <h2>Prossimi appuntamenti</h2>

            </div>

            {appointmentsQuery.isLoading && <StateBlock tone="loading" message="Caricamento..." />}

            {doctorError && <StateBlock tone="error" message={doctorError} />}

            {!appointmentsQuery.isLoading && !doctorError && doctorAppts.length === 0 && (

              <StateBlock tone="empty" message="Nessun appuntamento imminente" />

            )}

            {!appointmentsQuery.isLoading && !doctorError && doctorAppts.length > 0 && (

              <div className="table-responsive app-table-wrap">

                <table className="table table-striped table-hover align-middle app-table app-table-mobile">

                  <thead>

                    <tr>

                      <th>Data</th>

                      <th>Paziente</th>

                      <th>Dottore</th>

                      <th>Visita</th>

                      <th>Prezzo</th>

                      <th>Stato</th>

                    </tr>

                  </thead>

                  <tbody>

                    {doctorAppts.map(a => (

                      <tr key={a.id}>

                        <td data-label="Data">{new Date(a.scheduled_at).toLocaleString('it-IT', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>

                        <td data-label="Paziente">{getPatientName(a)}</td>

                        <td data-label="Dottore">{displayName}</td>

                        <td data-label="Visita">{getSpecialtyName(a)}</td>

                        <td data-label="Prezzo">{formatEuro(a.price_cents)}</td>

                        <td data-label="Stato">

                          <div className="status-with-note">

                            <span className="status-pill" data-status={a.status}>

                              {statusLabel(a.status)}

                            </span>

                            <span className="status-note-slot" aria-hidden={!shouldShowRejectNote(a)}>

                              {shouldShowRejectNote(a) && (

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

                    ))}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        )}



        {isAdmin && (

          <section className="accordion" id="adminOverview">

            <div className="accordion-item">

              <h2 className="accordion-header" id="adminOverviewHeading">

                <button
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#adminOverviewCollapse"
                  aria-expanded="false"
                  aria-controls="adminOverviewCollapse"
                >
                  <span className="d-inline-flex align-items-center gap-2">
                    <span className="section-icon" aria-hidden="true"><IconShield /></span>
                    <span>Panoramica amministratore</span>
                  </span>
                </button>

              </h2>

              <div
                id="adminOverviewCollapse"
                className="accordion-collapse collapse"
                aria-labelledby="adminOverviewHeading"
                data-bs-parent="#adminOverview"
              >

                <div className="accordion-body">

            {adminError && <StateBlock tone="error" message={adminError} />}



            <div className="d-flex" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>

              <form

                className="d-flex"

                style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}

                onSubmit={(e) => {

                  e.preventDefault()

                  const q = adminUserQuery.trim()

                  navigate(q ? `/app/admin/roles?q=${encodeURIComponent(q)}` : '/app/admin/roles')

                }}

              >

                <div className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

                  <span aria-hidden="true"><IconUser size={16} /></span>

                  Cerca utente

                </div>

                <input
                  className="ds-input"
                  style={{ minWidth: 260 }}
                  value={adminUserQuery}
                  onChange={(e) => setAdminUserQuery(e.target.value)}
                  placeholder="Email, nome o cognome"
                  aria-label="Cerca utente per email, nome o cognome"
                />
                <button className="ds-btn ds-btn-ghost" type="submit" disabled={!adminUserQuery.trim()}>

                  Cerca

                </button>

              </form>

              <div style={{ flex: 1 }} />

              <Link className="ds-btn ds-btn-ghost" to="/app/admin/access-logs">

                Vedi tutti i log

              </Link>

            </div>



            {adminQuery.isLoading && <StateBlock tone="loading" message="Caricamento..." />}

            {!adminQuery.isLoading && !adminError && (

              <div className="row g-3">

                <div className="col-12 col-md-4">

                  <div className="bg-white border rounded-3 p-3 h-100">

                    <div className="label">Ultimi 30 giorni</div>

                    <div style={{ fontSize: 24, fontWeight: 700 }}>{adminQuery.data?.stats ? adminQuery.data.stats.total : '-'}</div>

                    <div className="label">Prenotazioni totali</div>

                  </div>

                </div>

                <div className="col-12 col-md-4">

                  <div className="bg-white border rounded-3 p-3 h-100">

                    <div className="label">Stato richieste</div>

                    <div className="label">In attesa: <strong>{adminQuery.data?.stats ? adminQuery.data.stats.requested : '-'}</strong></div>

                    <div className="label">Confermate: <strong>{adminQuery.data?.stats ? adminQuery.data.stats.accepted : '-'}</strong></div>

                    <div className="label">Rifiutate: <strong>{adminQuery.data?.stats ? adminQuery.data.stats.rejected : '-'}</strong></div>

                  </div>

                </div>

                <div className="col-12 col-md-4">

                  <div className="bg-white border rounded-3 p-3 h-100">

                    <div className="label mb-2">Ultimi accessi</div>

                    {adminQuery.data?.logs?.length ? (

                      <ul className="list-group list-group-flush">

                        {adminQuery.data.logs.map(l => (

                          <li key={l.id} className="list-group-item px-0">

                            <div className="label">

                              {l.email} - {new Date(l.timestamp).toLocaleString('it-IT', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}

                            </div>

                          </li>

                        ))}

                      </ul>

                    ) : (

                      <div className="label">Nessun accesso recente</div>

                    )}

                  </div>

                </div>

              </div>

            )}

                </div>

              </div>

            </div>

          </section>

        )}

      </div>

      {rejectNoteMessage && (
        <ConfirmModal
          title="Motivazione rifiuto"
          message={rejectNoteMessage}
          onConfirm={() => setRejectNoteMessage(null)}
          onCancel={() => setRejectNoteMessage(null)}
          footer={
            <button className="ds-btn ds-btn-primary" type="button" onClick={() => setRejectNoteMessage(null)}>
              Chiudi
            </button>
          }
        />
      )}

    </div>

  )

}

