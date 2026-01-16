import { AppointmentsService } from '../application/services/AppointmentsService'
import type { AppointmentDto, DoctorDto, SpecialtyDto, PagedResult } from '../infrastructure/api/AppointmentsApiClient'

const appointmentsService = new AppointmentsService()

export type { AppointmentDto, PagedResult }
export type Specialty = SpecialtyDto
export type Doctor = DoctorDto

export async function listAppointments(params?: {
  limit?: number
  offset?: number
  status?: string
  scheduled_from?: string
  scheduled_to?: string
  report_archived?: boolean
}) {
  return appointmentsService.listAppointments(params)
}

export async function createAppointment(data: { doctor_id: number; scheduled_at: string; specialty_id?: number; note?: string }) {
  return appointmentsService.createAppointment(data)
}

export async function listDoctors(params?: { specialty_id?: number; limit?: number; offset?: number }) {
  return appointmentsService.listDoctors(params)
}

export async function updateAppointmentStatus(
  id: number,
  status: 'Confirmed' | 'Rejected' | 'Completed' | 'Cancelled',
  note?: string
) {
  return appointmentsService.updateAppointmentStatus(id, status, note)
}

export async function deleteAppointment(id: number) {
  return appointmentsService.deleteAppointment(id)
}

export async function archiveAppointmentReport(id: number) {
  return appointmentsService.archiveAppointmentReport(id)
}

export async function notifyAppointment(id: number, channel: 'email' | 'sms', kind: 'reminder' | 'cancellation') {
  return appointmentsService.notifyAppointment(id, channel, kind)
}

export async function listSpecialties(params?: { limit?: number; offset?: number }) {
  return appointmentsService.listSpecialties(params)
}
