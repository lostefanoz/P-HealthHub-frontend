import { AuthApiClient } from '../../infrastructure/api/AuthApiClient'

export class AuthService {
  constructor(private client: AuthApiClient = new AuthApiClient()) {}

  register(data: { email: string; password: string; first_name: string; last_name: string }) {
    return this.client.register(data)
  }

  login(data: { email: string; password: string }) {
    return this.client.login(data)
  }

  verifyOtp(data: { email: string; code: string; method?: 'totp' | 'email' }) {
    return this.client.verifyOtp(data)
  }

  me() {
    return this.client.me()
  }

  logout() {
    return this.client.logout()
  }

  changeMyPassword(data: { old_password: string; new_password: string }) {
    return this.client.changeMyPassword(data)
  }

  getMfaProvisioning() {
    return this.client.getMfaProvisioning()
  }

  regenerateMfaSecret() {
    return this.client.regenerateMfaSecret()
  }

  listMfaDevices() {
    return this.client.listMfaDevices()
  }

  addMfaDevice(data: { name: string; code?: string }) {
    return this.client.addMfaDevice(data)
  }

  deleteMfaDevice(id: number) {
    return this.client.deleteMfaDevice(id)
  }

  getMfaStatus() {
    return this.client.getMfaStatus()
  }

  setMfaEnabled(data: { enabled: boolean; password?: string }) {
    return this.client.setMfaEnabled(data)
  }

  sendMfaChallenge(data: { email: string; method: 'email' }) {
    return this.client.sendMfaChallenge(data)
  }
}
