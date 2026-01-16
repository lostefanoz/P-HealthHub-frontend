import { useMemo, useState } from 'react'
import { listAppointments, listDoctors, Doctor } from '../services/appointmentsApi'
import { useQuery } from '@tanstack/react-query'
import { StateBlock } from '../components/StateBlock'

type Appt = { id: number; patient_id: number; doctor_id: number; scheduled_at: string; status: string }

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}
function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

export default function AdminCalendarPage() {
  const [current, setCurrent] = useState<Date>(startOfMonth(new Date()))

  function formatDateRome(value: Date) {
    return value.toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' })
  }

  const monthStart = startOfMonth(current)
  const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0)
  const from = formatDateRome(monthStart)
  const to = formatDateRome(monthEnd)

  const apptsQuery = useQuery({
    queryKey: ['admin-calendar', from, to],
    queryFn: async () => {
      const res = await listAppointments({
        limit: 1000,
        offset: 0,
        status: 'Confirmed',
        scheduled_from: from,
        scheduled_to: to,
      })
      return res.items as Appt[]
    },
    keepPreviousData: true,
    staleTime: 30_000,
  })

  const doctorsQuery = useQuery({
    queryKey: ['admin-calendar-doctors'],
    queryFn: async () => {
      const res = await listDoctors({ limit: 500, offset: 0 })
      return res.items as Doctor[]
    },
    staleTime: 300_000,
  })

  const appts = apptsQuery.data ?? []
  const doctors = doctorsQuery.data ?? []

  const grid = useMemo(() => {
    const first = startOfMonth(current)
    const firstWeekday = (first.getDay() + 6) % 7 // convert Sun=0 to Mon=0
    const totalDays = daysInMonth(current)
    const days: Array<{ date: Date; label: number; inMonth: boolean }> = []
    // previous month padding
    for (let i = 0; i < firstWeekday; i++) {
      const d = new Date(first)
      d.setDate(d.getDate() - (firstWeekday - i))
      days.push({ date: d, label: d.getDate(), inMonth: false })
    }
    // this month
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(current.getFullYear(), current.getMonth(), i)
      days.push({ date: d, label: i, inMonth: true })
    }
    // next month padding to 6x7 grid
    while (days.length % 7 !== 0) {
      const last = days[days.length - 1].date
      const d = new Date(last)
      d.setDate(d.getDate() + 1)
      days.push({ date: d, label: d.getDate(), inMonth: false })
    }
    while (days.length < 42) {
      const last = days[days.length - 1].date
      const d = new Date(last)
      d.setDate(d.getDate() + 1)
      days.push({ date: d, label: d.getDate(), inMonth: false })
    }
    return days
  }, [current])

  function dateKeyRome(iso: string) {
    return new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' })
  }

  function monthKeyRome(d: Date) {
    const y = d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome', year: 'numeric' })
    const m = d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome', month: '2-digit' })
    return `${y}-${m}`
  }

  const todayKey = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' })

  const eventsByDay = useMemo(() => {
    const m = new Map<string, Appt[]>()
    const currentMonthKey = monthKeyRome(current)
    for (const a of appts) {
      const dt = new Date(a.scheduled_at)
      if (monthKeyRome(dt) !== currentMonthKey) continue
      const key = dateKeyRome(a.scheduled_at)
      if (!m.has(key)) m.set(key, [])
      m.get(key)!.push(a)
    }
    for (const [, arr] of m) arr.sort((x, y) => new Date(x.scheduled_at).getTime() - new Date(y.scheduled_at).getTime())
    return m
  }, [appts, current])

  const monthLabel = current.toLocaleDateString('it-IT', { month: 'long', year: 'numeric', timeZone: 'Europe/Rome' })

  function doctorName(id: number) {
    const d = doctors.find(x => x.id === id)
    return d ? `${d.first_name} ${d.last_name}` : '—'
  }

  return (
    <div className="d-flex flex-column" style={{ gap: 16 }}>
      <div className="d-flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Calendario Visite Accettate</h2>
        <div className="d-flex" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="ds-btn ds-btn-ghost" onClick={() => setCurrent(addMonths(current, -1))}>Mese precedente</button>
          <button className="ds-btn ds-btn-ghost" onClick={() => setCurrent(startOfMonth(new Date()))}>Oggi</button>
          <button className="ds-btn ds-btn-ghost" onClick={() => setCurrent(addMonths(current, 1))}>Mese successivo</button>
        </div>
      </div>
      <div className="label" style={{ textTransform: 'capitalize' }}>{monthLabel}</div>

      {(apptsQuery.isLoading || doctorsQuery.isLoading) && <StateBlock tone="loading" message="Caricamento..." />}
      {(apptsQuery.error || doctorsQuery.error) && (
        <StateBlock
          tone="error"
          message={
            (apptsQuery.error as any)?.response?.data?.detail ||
            (doctorsQuery.error as any)?.response?.data?.detail ||
            'Errore nel caricamento del calendario'
          }
        />
      )}

      {!apptsQuery.isLoading && !doctorsQuery.isLoading && !apptsQuery.error && !doctorsQuery.error && (
        <div className="calendar-grid">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
            <div key={d} className="calendar-cell calendar-head label">{d}</div>
          ))}
          {grid.map((g, i) => {
            const key = g.date.toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' })
            const items = eventsByDay.get(key) || []
            const isToday = key === todayKey
            return (
              <div key={i} className={`calendar-cell${g.inMonth ? '' : ' muted'}`}>
                <div className="d-flex" style={{ justifyContent: 'space-between' }}>
                  <span className="label" style={{ opacity: g.inMonth ? 1 : 0.5 }}>{g.label}</span>
                  {isToday && <span className="label" style={{ color: 'var(--accent)' }}>oggi</span>}
                </div>
                <div className="d-flex flex-column" style={{ gap: 4, marginTop: 6 }}>
                  {items.map(a => (
                    <div key={a.id} className="calendar-event">
                      <div style={{ fontWeight: 600 }}>{new Date(a.scheduled_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' })}</div>
                      <div className="label">{doctorName(a.doctor_id)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
