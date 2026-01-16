import { useEffect, useId, useState } from 'react'
import { adminListDoctors, adminListSpecialties, adminSetDoctorSpecialties, AdminDoctor, AdminSpecialty } from '../services/adminApi'
import ConfirmModal from '../components/ConfirmModal'
import { PaginationBar } from '../components/PaginationBar'
import { useQuery } from '@tanstack/react-query'
import { StateBlock } from '../components/StateBlock'

export default function AdminDoctorSpecialtiesPage() {
  const [doctors, setDoctors] = useState<AdminDoctor[]>([])
  const [specialties, setSpecialties] = useState<AdminSpecialty[]>([])
  const [q, setQ] = useState('')
  const [openFor, setOpenFor] = useState<number | null>(null)
  const [confirm, setConfirm] = useState<null | { doctor: AdminDoctor; nextIds: number[] }>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const popoverBaseId = useId()

  useEffect(() => {
    setPage(1)
  }, [q])

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-doctors', q, page, pageSize],
    queryFn: async () => {
      const [docs, specs] = await Promise.all([
        adminListDoctors({ limit: pageSize, offset: (page - 1) * pageSize, q: q || undefined }),
        adminListSpecialties({ limit: 500, offset: 0 }),
      ])
      return { docs, specs }
    },
    keepPreviousData: true,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (data) {
      setDoctors(data.docs.items)
      setTotal(data.docs.total)
      setSpecialties(data.specs.items)
    }
  }, [data])

  useEffect(() => {
    if (openFor == null) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenFor(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openFor])

  async function toggleSpecialty(doctorId: number, specId: number) {
    const d = doctors.find(x => x.id === doctorId)!
    const has = d.specialties.some(s => s.id === specId)
    const nextIds = has ? d.specialties.filter(s => s.id !== specId).map(s => s.id) : [...d.specialties.map(s => s.id), specId]
    setConfirm({ doctor: d, nextIds })
  }

  async function runConfirm() {
    const c = confirm
    if (!c) return
    await adminSetDoctorSpecialties(c.doctor.id, c.nextIds)
    setDoctors(doctors.map(x => x.id === c.doctor.id ? { ...x, specialties: specialties.filter(s => c.nextIds.includes(s.id)) } : x))
    setConfirm(null)
  }

  if (isLoading) return <StateBlock tone="loading" message="Caricamento..." />
  if (error) return <StateBlock tone="error" message={(error as any)?.response?.data?.detail || 'Errore caricamento dati'} />

  return (
    <div className="ds-card ds-card-body">
      <h2>Gestione Specialistiche Medici</h2>
      <div className="d-flex" style={{ gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 240 }}>
          <div className="label">Ricerca</div>
          <input
            className="ds-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Email, nome o cognome"
            aria-label="Cerca per email, nome o cognome"
          />
        </div>
        <button className="ds-btn ds-btn-ghost ds-btn-sm" type="button" onClick={() => setQ('')} disabled={!q}>
          Reset
        </button>
      </div>
      <div className="table-responsive app-table-wrap strong-table-wrap">
        <table className="table table-striped table-hover align-middle app-table app-table-mobile strong-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Nome</th>
              <th>Specialistiche</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map(d => (
              <tr key={d.id}>
                <td data-label="Email">{d.email}</td>
                <td data-label="Nome">{d.first_name} {d.last_name}</td>
                <td data-label="Specialistiche">
                  <div className="d-flex flex-column" style={{ position: 'relative' }}>
                    <button
                      className="ds-btn ds-btn-ghost"
                      type="button"
                      aria-expanded={openFor === d.id}
                      aria-controls={`${popoverBaseId}-${d.id}`}
                      onClick={() => setOpenFor(openFor === d.id ? null : d.id)}
                    >
                      {d.specialties.length ? d.specialties.map(s => s.name).join(', ') : 'Nessuna'}
                    </button>
                    {openFor === d.id && (
                      <div
                        id={`${popoverBaseId}-${d.id}`}
                        className="ds-card ds-card-body popover-card"
                        style={{ position: 'absolute', top: '110%', left: 0, zIndex: 10, minWidth: 280 }}
                      >
                        <div className="d-flex flex-column">
                          {specialties.map(s => (
                            <label key={s.id} className="d-flex" style={{ gap: 6, alignItems: 'center' }}>
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={!!d.specialties.find(x => x.id === s.id)}
                                onChange={() => toggleSpecialty(d.id, s.id)}
                              />
                              <span>{s.name}</span>
                          </label>
                          ))}
                          <div className="d-flex" style={{ justifyContent: 'flex-end' }}>
                            <button className="ds-btn ds-btn-ghost ds-btn-sm" type="button" onClick={() => setOpenFor(null)}>Chiudi</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationBar page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
      {confirm && (
        <ConfirmModal
          title="Conferma aggiornamento specialistiche"
          message={`Confermi aggiornamento specialistiche per ${confirm.doctor.email}?`}
          confirmLabel="Conferma"
          cancelLabel="Annulla"
          onCancel={() => setConfirm(null)}
          onConfirm={runConfirm}
        />
      )}
    </div>
  )
}
