import request from '../index'
import type { ObstaclesDto } from '@/@types/dto'

export interface CreateMapDto {
  name: string
  description: string
  minThreshold: number
  dividColor: string
  width: number
  height: number
  isOpenSource:number
  obstacles?: ObstaclesDto[]
  startPoint?: { x: number; y: number }
  endPoint?: { x: number; y: number }
}
export interface GetMapListDto {
  id: number
  name: string
  description: string
  minThreshold: number
  dividColor: string
  width: number
  height: number
  obstacles?: ObstaclesDto[]
  isOpenSource: 0 | 1
  startPoint?: { x: number; y: number }
  endPoint?: { x: number; y: number }
  createdAt: Date
  updatedAt: Date
}

export interface OpenSourceMap extends GetMapListDto {
  user:{
      id:number,
      name: string,
      email: string,
      avatar: string,
      bio: string,
      address: string,
      field: string,
      birthday: string,
      gender: string,
  }
}

export const createMap = (data: CreateMapDto) => {
  return request.post('/maps', data)
}

export const getMapList = async(): Promise<GetMapListDto[]> => {
  const { data } = await request.get('/maps')
  return data
}
export const deletMapById = async(id: number) => {
  const { data } = await request.delete(`/maps/${id}`)
  return data
}

export const updateMapById = async(id: number, data: CreateMapDto) => {
  const { data: res } = await request.put(`/maps/${id}`, data)
  return res
}

export const getMapById = async(id: number): Promise<GetMapListDto> => {
  const { data } = await request.get(`/maps/${id}`)
  return data
}


export const getOpenSourceMapList = async(): Promise<OpenSourceMap[]> => {
  const { data:res } = await request.get('/maps/open-source')
  return res
}
