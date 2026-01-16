export function statusLabel(status: string): string {
  switch (status) {
    case 'Requested': return 'Richiesto'
    case 'Confirmed': return 'Confermato'
    case 'Rejected': return 'Rifiutato'
    case 'Completed': return 'Completato'
    case 'Cancelled': return 'Annullato'
    default: return status
  }
}

