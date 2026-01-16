import React from 'react'

type Props = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

const PAGE_SIZES = [10, 20, 50, 100]

export function PaginationBar({ page, pageSize, total, onPageChange, onPageSizeChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages
  return (
    <div className="ds-pagination">
      <div className="ds-pagination-info">
        Pagina {page} di {totalPages} · Totale {total}
      </div>
      <div className="ds-pagination-actions">
        <button className="btn btn-outline-secondary btn-sm" disabled={!canPrev} onClick={() => onPageChange(page - 1)}>
          Precedente
        </button>
        <button className="btn btn-outline-secondary btn-sm" disabled={!canNext} onClick={() => onPageChange(page + 1)}>
          Successiva
        </button>
        {onPageSizeChange ? (
          <select
            className="form-select form-select-sm"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{ maxWidth: 110 }}
            aria-label="Elementi per pagina"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}/pag
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </div>
  )
}
