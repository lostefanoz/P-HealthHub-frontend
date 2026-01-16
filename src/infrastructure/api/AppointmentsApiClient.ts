import { http } from '../../services/http'

export type AppointmentDto = {
  id: number
  patient_id: number
  doctor_id: number
  scheduled_at: string
  status: string
  created_at?: string | null
  note?: string | null
  rejected_note?: string | null
  specialty_id?: number | null
  price_cents?: number | null
  patient_first_name?: string | null
  patient_last_name?: string | null
  has_report?: boolean | null
  report_archived?: boolean | null
}

export type SpecialtyDto = { id: number; name: string }
export type DoctorDto = { id: number; email: string; first_name: string; last_name: string; specialties?: SpecialtyDto[] }
export type PagedResult<T> = { items: T[]; total: number }

function readTotal(res: any): number {
  const raw = res.headers?.['x-total-count']
  const parsed = raw ? Number(raw) : NaN
  return Number.isFinite(parsed) ? parsed : res.data?.length ?? 0
}

export class AppointmentsApiClient {
  async listAppointments(params?: {
    limit?: number
    offset?: number
    status?: string
    scheduled_from?: string
    scheduled_to?: string
    report_archived?: boolean
  }): Promise<PagedResult<AppointmentDto>> {
    const res = await http.get('/appointments/', { params })
    return { items: res.data as AppointmentDto[], total: readTotal(res) }
  }

  async createAppointment(data: { doctor_id: number; scheduled_at: string; specialty_id?: number; note?: string }) {
    const res = await http.post('/appointments/', data)
    return res.data
  }

  async listDoctors(params?: { specialty_id?: number; limit?: number; offset?: number }): Promise<PagedResult<DoctorDto>> {
    const res = await http.get('/appointments/doctors', { params })
    return { items: res.data as DoctorDto[], total: readTotal(res) }
  }

  async updateAppointmentStatus(
    id: number,
    status: 'Confirmed' | 'Rejected' | 'Completed' | 'Cancelled',
    note?: string
  ) {
    const payload = note ? { status, note } : { status }
    const res = await http.put(`/appointments/${id}/status`, payload)
    return res.data
  }

  async deleteAppointment(id: number) {
    const res = await http.delete(`/appointments/${id}`)
    return res.data as { id: number; deleted: boolean }
  }

  async archiveAppointmentReport(id: number) {
    const res = await http.post(`/appointments/${id}/archive-report`)
    return res.data as { appointment_id: number; archived_reports: number }
  }

  async notifyAppointment(id: number, channel: 'email' | 'sms', kind: 'reminder' | 'cancellation') {
    const res = await http.post(`/appointments/${id}/notify`, { channel, kind })
    return res.data as { id: number; channel: string; kind: string }
  }

  async listSpecialties(params?: { limit?: number; offset?: number }): Promise<PagedResult<SpecialtyDto>> {
    const res = await http.get('/appointments/specialties', { params })
    return { items: res.data as SpecialtyDto[], total: readTotal(res) }
  }
}
