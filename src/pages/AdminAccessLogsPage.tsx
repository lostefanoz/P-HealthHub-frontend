import { useState } from 'react'
import { getAccessLogs } from '../services/adminApi'
import { http } from '../services/http'
import { PaginationBar } from '../components/PaginationBar'
import { useQuery } from '@tanstack/react-query'
import { StateBlock } from '../components/StateBlock'

type AccessLog = {
  id: number
  email: string
  timestamp: string
  action?: string
  reason?: string | null
}

export default function AdminAccessLogsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['access-logs', page, pageSize, fromDate, toDate],
    queryFn: async () => {
      const res = await getAccessLogs({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        from_ts: fromDate || undefined,
        to_ts: toDate || undefined,
      })
      return res
    },
    staleTime: 30_000,
    keepPreviousData: true,
  })

  const resolvedLogs = data?.items || []
  const resolvedTotal = data?.total || 0
  const reasonLabels: Record<string, string> = {
    bad_password: 'Password errata',
    inactive: 'Account disabilitato',
    locked: 'Account bloccato',
  }
  const formatOutcome = (log: AccessLog) => {
    if (log.action === 'login_failed') {
      const reason = log.reason ? (reasonLabels[log.reason] || log.reason) : ''
      return reason ? `Fallito (${reason})` : 'Fallito'
    }
    return 'OK'
  }
  const outcomeStatus = (log: AccessLog) => (log.action === 'login_failed' ? 'LoginFailed' : 'LoginOk')

  return (
    <div className="d-flex flex-column" style={{ gap: 16 }}>
      <div className="d-flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Log di Accesso</h2>
        <div className="d-flex" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="ds-btn ds-btn-ghost" type="button" onClick={() => refetch()}>Ricarica</button>
          <a className="ds-btn ds-btn-ghost" href={http.defaults.baseURL + '/admin/access-logs/file'} target="_blank" rel="noreferrer">
            Apri file
          </a>
        </div>
      </div>
      <div className="d-flex" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <div className="label">Da</div>
          <input
            className="ds-input ds-input-sm"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            aria-label="Da"
          />
        </div>
        <div>
          <div className="label">A</div>
          <input
            className="ds-input ds-input-sm"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            aria-label="A"
          />
        </div>
        <button className="ds-btn ds-btn-ghost ds-btn-sm" type="button" onClick={() => { setFromDate(''); setToDate('') }}>
          Reset date
        </button>
      </div>

      {isLoading && <StateBlock tone="loading" message="Caricamento..." />}
      {error && <StateBlock tone="error" message={(error as any)?.response?.data?.detail || 'Errore nel caricamento dei log di accesso'} />}

      {!isLoading && !error && (
        <div className="ds-card ds-card-body">
          <div className="table-responsive app-table-wrap strong-table-wrap">
            <table className="table table-striped table-hover align-middle app-table app-table-mobile strong-table">
              <thead>
                <tr>
                  <th>Data / ora</th>
                  <th>Utente</th>
                  <th>Esito</th>
                </tr>
              </thead>
              <tbody>
                {resolvedLogs.length === 0 && (
                  <tr>
                    <td colSpan={3} className="label">Nessun accesso recente</td>
                  </tr>
                )}
                {resolvedLogs.map((l) => (
                  <tr key={l.id}>
                    <td data-label="Data / ora">{new Date(l.timestamp).toLocaleString('it-IT', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                    <td data-label="Utente">{l.email}</td>
                    <td data-label="Esito">
                      <span className="status-pill" data-status={outcomeStatus(l)}>
                        {formatOutcome(l)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar page={page} pageSize={pageSize} total={resolvedTotal} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      )}
    </div>
  )
}
