export const ROLE_LABELS: Record<string, string> = {
  Admin: 'Amministratore',
  Doctor: 'Dottore',
  Patient: 'Paziente',
  Secretary: 'Segretaria/o',
}

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}
