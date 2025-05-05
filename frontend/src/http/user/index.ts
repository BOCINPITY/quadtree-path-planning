
import request from "..";
import type { User } from '@/@types'

//使用泛型工具将User所有的属性都变为可选
type PartialUser = {
  [K in keyof User]?: User[K]
}
export const updateUser  = async (id: string, userData: PartialUser): Promise<User> => {
  try {
    const {data} = await request.put(`/users/${id}`, userData)
    return data
  } catch (error) {
    console.error('Update user error:', error)
    throw error
  }
}

export const updateUserPassword = async (params:{id:string,password:string,oldPassword:string}):Promise<{message: string}> => {
  try {
    const {data} = await request.post(`/users/password`, params)
    return data
  } catch (error) {
    console.error('Update user password error:', error)
    throw error
  }
}

//注销账户
export const deleteUser = async (id: string) => {
  try {
    const {data} = await request.delete(`/users/${id}`)
    return data
  } catch (error) {
    console.error('Delete user error:', error)
    throw error
  }
}
