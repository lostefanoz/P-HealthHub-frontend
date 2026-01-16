type TableCell = HTMLTableCellElement

const getHeaders = (table: HTMLTableElement) =>
  Array.from(table.querySelectorAll('thead th')).map(th => (th.textContent || '').trim())

const applyTableLabels = (root: ParentNode) => {
  const tables = Array.from(root.querySelectorAll('table.table')) as HTMLTableElement[]
  tables.forEach(table => {
    const headers = getHeaders(table)
    if (headers.length === 0) return
    const rows = Array.from(table.querySelectorAll('tbody tr'))
    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td')) as TableCell[]
      cells.forEach((cell, index) => {
        if (cell.colSpan > 1) {
          cell.removeAttribute('data-label')
          return
        }
        const label = headers[index] || ''
        if (label) {
          cell.setAttribute('data-label', label)
        } else {
          cell.removeAttribute('data-label')
        }
      })
    })
  })
}

export const setupTableLabels = () => {
  if (typeof document === 'undefined') return () => {}
  let rafId = 0
  const schedule = () => {
    if (rafId) return
    rafId = window.requestAnimationFrame(() => {
      rafId = 0
      applyTableLabels(document)
    })
  }
  const observer = new MutationObserver(schedule)
  observer.observe(document.body, { childList: true, subtree: true })
  schedule()
  return () => {
    observer.disconnect()
    if (rafId) window.cancelAnimationFrame(rafId)
  }
}
