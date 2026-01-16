import { AdminService } from '../application/services/AdminService'
import type { AdminDoctorDto, AdminSpecialtyDto, AdminUserDto, AccessLogDto, PagedResult } from '../infrastructure/api/AdminApiClient'

const adminService = new AdminService()

export type AdminUser = AdminUserDto
export type AdminSpecialty = AdminSpecialtyDto
export type AdminDoctor = AdminDoctorDto
export type AccessLog = AccessLogDto
export type { PagedResult }

export async function listUsers(params?: { q?: string; role?: string; active?: boolean; limit?: number; offset?: number; created_from?: string; created_to?: string }) {
  return adminService.listUsers(params)
}

export async function updateUserRoles(userId: number, roles: string[]) {
  return adminService.updateUserRoles(userId, roles)
}

export async function updateUserStatus(userId: number, is_active: boolean) {
  return adminService.updateUserStatus(userId, is_active)
}

export async function adminResetUserPassword(userId: number, newPassword: string) {
  return adminService.resetUserPassword(userId, newPassword)
}

export async function adminDeleteUser(userId: number) {
  return adminService.deleteUser(userId)
}

export async function getAppointmentStats() {
  return adminService.getAppointmentStats()
}

export async function getMetricsSummary() {
  return adminService.getMetricsSummary()
}

export async function getAccessLogs(params?: { limit?: number; offset?: number; from_ts?: string; to_ts?: string }) {
  return adminService.getAccessLogs(params)
}

export async function adminListSpecialties(params?: { limit?: number; offset?: number; q?: string }) {
  return adminService.listSpecialties(params)
}

export async function adminListDoctors(params?: { limit?: number; offset?: number; q?: string }) {
  return adminService.listDoctors(params)
}

export async function adminSetDoctorSpecialties(doctorId: number, ids: number[]) {
  return adminService.setDoctorSpecialties(doctorId, ids)
}
