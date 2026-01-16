import { AuthService } from '../application/services/AuthService'

const authService = new AuthService()

export async function register(data: { email: string; password: string; first_name: string; last_name: string }) {
  return authService.register(data)
}

export async function login(data: { email: string; password: string }) {
  return authService.login(data)
}

export async function verifyOtp(data: { email: string; code: string; method?: 'totp' | 'email' }) {
  return authService.verifyOtp(data)
}

export async function me() {
  return authService.me()
}

export async function logout() {
  return authService.logout()
}

export async function changeMyPassword(data: { old_password: string; new_password: string }) {
  return authService.changeMyPassword(data)
}

export async function getMfaProvisioning() {
  return authService.getMfaProvisioning()
}

export async function regenerateMfaSecret() {
  return authService.regenerateMfaSecret()
}

export async function listMfaDevices() {
  return authService.listMfaDevices()
}

export async function addMfaDevice(data: { name: string; code?: string }) {
  return authService.addMfaDevice(data)
}

export async function deleteMfaDevice(id: number) {
  return authService.deleteMfaDevice(id)
}

export async function getMfaStatus() {
  return authService.getMfaStatus()
}

export async function setMfaEnabled(data: { enabled: boolean; password?: string }) {
  return authService.setMfaEnabled(data)
}

export async function sendMfaChallenge(data: { email: string; method: 'email' }) {
  return authService.sendMfaChallenge(data)
}
