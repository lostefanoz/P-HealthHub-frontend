import { useMemo, useState } from 'react'
import { listAppointments, updateAppointmentStatus, listDoctors, Doctor } from '../services/appointmentsApi'
import { getAppointmentStats, getMetricsSummary } from '../services/adminApi'
import ConfirmModal from '../components/ConfirmModal'
import { statusLabel } from '../utils/status'
import { useQuery } from '@tanstack/react-query'
import { StateBlock } from '../components/StateBlock'

type Appt = { id: number; patient_id: number; doctor_id: number; scheduled_at: string; status: string }

export default function AdminDashboardPage() {
  const [pending, setPending] = useState<null | { id: number; status: 'Confirmed' | 'Rejected' }>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const [a, s, d, m] = await Promise.all([
        listAppointments({ limit: 200, offset: 0 }),
        getAppointmentStats(),
        listDoctors({ limit: 500, offset: 0 }),
        getMetricsSummary(),
      ])
      return { a, s, d, m }
    },
    staleTime: 30_000,
  })

  const appts = data?.a?.items ?? []
  const stats = data?.s ?? null
  const metrics = data?.m ?? null
  const doctors = data?.d?.items ?? []

  const requested = useMemo(() => appts.filter(a => a.status === 'Requested'), [appts])

  async function act(id: number, status: 'Confirmed' | 'Rejected') {
    setPending({ id, status })
  }

  return (
    <div className="d-flex flex-column" style={{ gap: 16 }}>
      {isLoading && <StateBlock tone="loading" message="Caricamento..." />}
      {error && <StateBlock tone="error" message={(error as any)?.response?.data?.detail || 'Errore caricamento dashboard'} />}
      <div className="d-flex" style={{ gap: 16, flexWrap: 'wrap' }}>
        <StatCard title="Ultimi 30 giorni" value={stats ? stats.total : '-'} subtitle="Totale Prenotazioni" variant="total" />
        <StatCard title="Richieste" value={stats ? stats.requested : '-'} subtitle="In attesa" variant="pending" />
        <StatCard title="Accettate" value={stats ? stats.accepted : '-'} subtitle="Confermate" variant="accepted" />
        <StatCard title="Rifiutate" value={stats ? stats.rejected : '-'} subtitle="Respinte" variant="rejected" />
        <StatCard title="P95 API" value={metrics ? `${metrics.p95_ms} ms` : '-'} subtitle="Latenza" variant="total" />
        <StatCard
          title="Errori 5xx"
          value={metrics ? `${metrics.error_rate_pct}%` : '-'}
          subtitle={metrics ? `${metrics.errors_5xx} errori` : 'Error rate'}
          variant={metrics && metrics.errors_5xx > 0 ? 'rejected' : 'accepted'}
        />
      </div>
      <div className="ds-card ds-card-body" style={{ maxWidth: 920, margin: '0 auto' }}>
        <h3 style={{ textAlign: 'center' }}>Richieste di appuntamento</h3>
        <div className="table-responsive app-table-wrap">
          <table className="table table-striped table-hover align-middle app-table app-table-mobile">
          <thead>
            <tr>
              <th>Medico</th>
              <th>Data</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {requested.map(a => (
              <tr key={a.id}>
                <td data-label="Medico">{(() => {
                  const d = doctors.find(x => x.id === a.doctor_id)
                  return d ? `${d.first_name} ${d.last_name}` : '-'
                })()}</td>
                <td data-label="Data">{new Date(a.scheduled_at).toLocaleString('it-IT', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                <td data-label="Azioni">
                  <div className="d-flex" style={{ gap: 8, flexWrap: 'wrap' }}>
                    <button className="ds-btn ds-btn-primary ds-btn-sm" onClick={() => act(a.id, 'Confirmed')}>Accetta</button>
                    <button className="ds-btn ds-btn-danger ds-btn-sm" onClick={() => act(a.id, 'Rejected')}>Rifiuta</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
      {pending && (
        <ConfirmModal
          title="Conferma aggiornamento stato"
          message={`Confermi lo stato '${statusLabel(pending.status)}' per questa richiesta?`}
          confirmLabel="Conferma"
          cancelLabel="Annulla"
          onCancel={() => setPending(null)}
          onConfirm={async () => {
            await updateAppointmentStatus(pending.id, pending.status)
            setPending(null)
            await refetch()
          }}
        />
      )}
    </div>
  )
}

function StatCard({ title, value, subtitle, variant }: { title: string; value: number | string; subtitle: string; variant?: 'total' | 'pending' | 'accepted' | 'rejected' }) {
  const bg =
    variant === 'total' ? '#e2e8f0' :
    variant === 'pending' ? '#fde68a' :
    variant === 'accepted' ? '#bbf7d0' :
    variant === 'rejected' ? '#fecaca' : '#e5e7eb'
  const border = '#cbd5e1'
  return (
    <div className="ds-card ds-card-body" style={{ minWidth: 200, background: bg, borderColor: border }}>
      <div className="label">{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
      <div className="label">{subtitle}</div>
    </div>
  )
}
