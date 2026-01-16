import { AppointmentsApiClient, AppointmentDto, DoctorDto, PagedResult, SpecialtyDto } from '../../infrastructure/api/AppointmentsApiClient'

export class AppointmentsService {
  constructor(private client: AppointmentsApiClient = new AppointmentsApiClient()) {}

  listAppointments(params?: {
    limit?: number
    offset?: number
    status?: string
    scheduled_from?: string
    scheduled_to?: string
    report_archived?: boolean
  }): Promise<PagedResult<AppointmentDto>> {
    return this.client.listAppointments(params)
  }

  createAppointment(data: { doctor_id: number; scheduled_at: string; specialty_id?: number; note?: string }) {
    return this.client.createAppointment(data)
  }

  listDoctors(params?: { specialty_id?: number; limit?: number; offset?: number }): Promise<PagedResult<DoctorDto>> {
    return this.client.listDoctors(params)
  }

  updateAppointmentStatus(id: number, status: 'Confirmed' | 'Rejected' | 'Completed' | 'Cancelled', note?: string) {
    return this.client.updateAppointmentStatus(id, status, note)
  }

  deleteAppointment(id: number) {
    return this.client.deleteAppointment(id)
  }

  archiveAppointmentReport(id: number) {
    return this.client.archiveAppointmentReport(id)
  }

  notifyAppointment(id: number, channel: 'email' | 'sms', kind: 'reminder' | 'cancellation') {
    return this.client.notifyAppointment(id, channel, kind)
  }

  listSpecialties(params?: { limit?: number; offset?: number }): Promise<PagedResult<SpecialtyDto>> {
    return this.client.listSpecialties(params)
  }
}
