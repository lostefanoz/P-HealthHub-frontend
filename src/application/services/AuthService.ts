import { AuthApiClient } from '../../infrastructure/api/AuthApiClient'

export class AuthService {
  constructor(private client: AuthApiClient = new AuthApiClient()) {}

  register(data: { email: string; password: string; first_name: string; last_name: string }) {
    return this.client.register(data)
  }

  login(data: { email: string; password: string }) {
    return this.client.login(data)
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
}
