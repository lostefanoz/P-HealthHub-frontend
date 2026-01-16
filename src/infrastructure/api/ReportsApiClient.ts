import { http } from '../../services/http'

export type ReportDto = {
  id: number
  appointment_id: number
  appointment_scheduled_at?: string | null
  doctor_id?: number | null
  doctor_first_name?: string | null
  doctor_last_name?: string | null
  patient_id?: number | null
  patient_first_name?: string | null
  patient_last_name?: string | null
  specialty_id?: number | null
  specialty_name?: string | null
  original_filename?: string | null
  content_type?: string | null
  sha256?: string | null
  size_bytes?: number | null
  note?: string | null
  uploaded_at: string
  uploaded_by_user_id: number
  archived_at?: string | null
  deleted_at?: string | null
  deleted_note?: string | null
  deleted_by_user_id?: number | null
}

export type PagedResult<T> = { items: T[]; total: number }

function readTotal(res: any): number {
  const raw = res.headers?.['x-total-count']
  const parsed = raw ? Number(raw) : NaN
  return Number.isFinite(parsed) ? parsed : res.data?.length ?? 0
}

export class ReportsApiClient {
  async listReports(params?: {
    appointment_id?: number
    archived_only?: boolean
    q?: string
    limit?: number
    offset?: number
    uploaded_from?: string
    uploaded_to?: string
  }): Promise<PagedResult<ReportDto>> {
    const res = await http.get('/reports/', { params })
    return { items: res.data as ReportDto[], total: readTotal(res) }
  }

  async uploadReport(data: { appointment_id: number; note?: string; file?: File | null }) {
    const form = new FormData()
    form.append('appointment_id', String(data.appointment_id))
    if (data.note) form.append('note', data.note)
    if (data.file) form.append('file', data.file)
    const res = await http.post('/reports/', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    return res.data as ReportDto
  }

  async previewReport(reportId: number) {
    const res = await http.get(`/reports/${reportId}/preview`, { responseType: 'blob' })
    return res.data as Blob
  }

  async downloadReport(reportId: number) {
    const res = await http.get(`/reports/${reportId}/download`, { responseType: 'blob' })
    return res.data as Blob
  }

  async deleteReportWithNote(reportId: number, note: string) {
    const form = new FormData()
    form.append('note', note)
    const res = await http.post(`/reports/${reportId}/delete`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    return res.data as ReportDto
  }

  async updateReportNote(reportId: number, note: string) {
    const form = new FormData()
    form.append('note', note)
    const res = await http.put(`/reports/${reportId}/note`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    return res.data as ReportDto
  }
}
