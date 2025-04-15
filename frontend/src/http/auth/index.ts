import type { User } from '@/@types'
import request from '..'

const login = async (
  email: string,
  password: string,
): Promise<{ message: string; token: string; user: User }> => {
  try {
    const data = await request.post<{ message: string; token: string; user: User }>('/auth/login', {
      email,
      password,
    })
    return data.data
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

export { login }
