import { http } from '../../services/http'

export class AuthApiClient {
  async register(data: { email: string; password: string; first_name: string; last_name: string }) {
    return http.post('/auth/register', data)
  }

  async login(data: { email: string; password: string }) {
    return http.post('/auth/login', data)
  }

  async verifyOtp(data: { email: string; code: string; method?: 'totp' | 'email' }) {
    const res = await http.post('/auth/mfa/verify', data)
    return res.data
  }

  async me() {
    const res = await http.get('/auth/me')
    return res.data
  }

  async logout() {
    const res = await http.post('/auth/logout')
    return res.data
  }

  async changeMyPassword(data: { old_password: string; new_password: string }) {
    const res = await http.put('/auth/me/password', data)
    return res.data
  }

  async getMfaProvisioning() {
    const res = await http.get('/auth/mfa/provisioning')
    return res.data as { otpauth_uri: string; secret: string; issuer: string }
  }

  async regenerateMfaSecret() {
    const res = await http.post('/auth/mfa/regenerate')
    return res.data as { otpauth_uri: string; secret: string; issuer: string }
  }

  async listMfaDevices() {
    const res = await http.get('/auth/mfa/devices')
    return res.data as Array<{ id: number; name: string; added_at: string; verified: boolean }>
  }

  async addMfaDevice(data: { name: string; code?: string }) {
    const res = await http.post('/auth/mfa/devices', data)
    return res.data as { id: number; name: string; added_at: string; verified: boolean }
  }

  async deleteMfaDevice(id: number) {
    const res = await http.delete(`/auth/mfa/devices/${id}`)
    return res.data as { status: string }
  }

  async getMfaStatus() {
    const res = await http.get('/auth/mfa/status')
    return res.data as { enabled: boolean; devices: number }
  }

  async setMfaEnabled(data: { enabled: boolean; password?: string }) {
    const res = await http.put('/auth/mfa/enable', data)
    return res.data as { enabled: boolean }
  }

  async sendMfaChallenge(data: { email: string; method: 'email' }) {
    const res = await http.post('/auth/mfa/challenge', data)
    return res.data
  }
}
