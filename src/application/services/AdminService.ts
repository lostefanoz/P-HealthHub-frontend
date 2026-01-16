import { AdminApiClient, AdminDoctorDto, AdminSpecialtyDto, AdminUserDto, AccessLogDto, PagedResult } from '../../infrastructure/api/AdminApiClient'

export class AdminService {
  constructor(private client: AdminApiClient = new AdminApiClient()) {}

  listUsers(params?: { q?: string; role?: string; active?: boolean; limit?: number; offset?: number; created_from?: string; created_to?: string }): Promise<PagedResult<AdminUserDto>> {
    return this.client.listUsers(params)
  }

  updateUserRoles(userId: number, roles: string[]) {
    return this.client.updateUserRoles(userId, roles)
  }

  updateUserStatus(userId: number, is_active: boolean) {
    return this.client.updateUserStatus(userId, is_active)
  }

  resetUserPassword(userId: number, newPassword: string) {
    return this.client.resetUserPassword(userId, newPassword)
  }

  deleteUser(userId: number) {
    return this.client.deleteUser(userId)
  }

  getAppointmentStats() {
    return this.client.getAppointmentStats()
  }

  getMetricsSummary() {
    return this.client.getMetricsSummary()
  }

  getAccessLogs(params?: { limit?: number; offset?: number; from_ts?: string; to_ts?: string }): Promise<PagedResult<AccessLogDto>> {
    return this.client.getAccessLogs(params)
  }

  listSpecialties(params?: { limit?: number; offset?: number; q?: string }): Promise<PagedResult<AdminSpecialtyDto>> {
    return this.client.listSpecialties(params)
  }

  listDoctors(params?: { limit?: number; offset?: number; q?: string }): Promise<PagedResult<AdminDoctorDto>> {
    return this.client.listDoctors(params)
  }

  setDoctorSpecialties(doctorId: number, ids: number[]) {
    return this.client.setDoctorSpecialties(doctorId, ids)
  }
}
