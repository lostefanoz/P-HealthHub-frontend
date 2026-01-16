import { http } from '../../services/http'

export type AdminUserDto = { id: number; email: string; first_name: string; last_name: string; is_active: boolean; roles: string[] }
export type AdminSpecialtyDto = { id: number; name: string }
export type AdminDoctorDto = { id: number; email: string; first_name: string; last_name: string; specialties: AdminSpecialtyDto[] }
export type AccessLogDto = { id: number; email: string; timestamp: string; action?: string; reason?: string | null }
export type PagedResult<T> = { items: T[]; total: number }
export type AdminUserCreate = { email: string; password: string; first_name: string; last_name: string; roles: string[]; is_active?: boolean }
export type AdminUserCreateResult = { id: number; email: string; roles: string[]; is_active: boolean }

function readTotal(res: any): number {
  const raw = res.headers?.['x-total-count']
  const parsed = raw ? Number(raw) : NaN
  return Number.isFinite(parsed) ? parsed : res.data?.length ?? 0
}

export class AdminApiClient {
  async listUsers(params?: { q?: string; role?: string; active?: boolean; limit?: number; offset?: number; created_from?: string; created_to?: string }): Promise<PagedResult<AdminUserDto>> {
    const res = await http.get('/admin/users', { params })
    return { items: res.data as AdminUserDto[], total: readTotal(res) }
  }

  async createUser(data: AdminUserCreate) {
    const res = await http.post('/admin/users', data)
    return res.data as AdminUserCreateResult
  }

  async updateUserRoles(userId: number, roles: string[]) {
    const res = await http.put(`/admin/users/${userId}/roles`, { roles })
    return res.data
  }

  async updateUserStatus(userId: number, is_active: boolean) {
    const res = await http.put(`/admin/users/${userId}/status`, { is_active })
    return res.data as { id: number; is_active: boolean }
  }

  async resetUserPassword(userId: number, newPassword: string) {
    const res = await http.post(`/admin/users/${userId}/reset-password`, { new_password: newPassword })
    return res.data as { id: number; email: string }
  }

  async deleteUser(userId: number) {
    const res = await http.delete(`/admin/users/${userId}`)
    return res.data as { id: number; deleted: boolean }
  }

  async getAppointmentStats() {
    const res = await http.get('/admin/stats/appointments')
    return res.data as { since: string; total: number; requested: number; accepted: number; rejected: number }
  }

  async getMetricsSummary() {
    const res = await http.get('/admin/stats/metrics')
    return res.data as { total_requests: number; errors_5xx: number; error_rate_pct: number; p95_ms: number }
  }

  async getAccessLogs(params?: { limit?: number; offset?: number; from_ts?: string; to_ts?: string }): Promise<PagedResult<AccessLogDto>> {
    const res = await http.get('/admin/access-logs', { params })
    return { items: res.data as AccessLogDto[], total: readTotal(res) }
  }

  async listSpecialties(params?: { limit?: number; offset?: number; q?: string }): Promise<PagedResult<AdminSpecialtyDto>> {
    const res = await http.get('/admin/specialties', { params })
    return { items: res.data as AdminSpecialtyDto[], total: readTotal(res) }
  }

  async listDoctors(params?: { limit?: number; offset?: number; q?: string }): Promise<PagedResult<AdminDoctorDto>> {
    const res = await http.get('/admin/doctors', { params })
    return { items: res.data as AdminDoctorDto[], total: readTotal(res) }
  }

  async setDoctorSpecialties(doctorId: number, ids: number[]) {
    const res = await http.put(`/admin/doctors/${doctorId}/specialties`, { specialty_ids: ids })
    return res.data as { id: number; specialties: AdminSpecialtyDto[] }
  }
}
