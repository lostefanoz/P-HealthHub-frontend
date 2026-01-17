import { AuthService } from '../application/services/AuthService'

const authService = new AuthService()

export async function register(data: { email: string; password: string; first_name: string; last_name: string }) {
  return authService.register(data)
}

export async function login(data: { email: string; password: string }) {
  return authService.login(data)
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
