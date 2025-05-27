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
const getCode = async (email: string): Promise<{ message: string }> => {
  try {
    const data = await request.post<{ message: string }>('/auth/getCode', {
      email,
    })
    return data.data
  } catch (error) {
    console.error('Get code error:', error)
    throw error
  }
}
const register = async(email:string,code:string,username:string,password:string) => {
  try {
    const data = await request.post<{ message: string }>('/auth/register', {
      email,
      code,
      username,
      password,
    })
    return data.data
  } catch (error) {
    console.error('Register error:', error)
    throw error
  }
}
export { login,getCode,register }
