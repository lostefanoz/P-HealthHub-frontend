import { http } from '../../services/http'

export class AuthApiClient {
  async register(data: { email: string; password: string; first_name: string; last_name: string }) {
    return http.post('/auth/register', data)
  }

  async login(data: { email: string; password: string }) {
    return http.post('/auth/login', data)
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
}
