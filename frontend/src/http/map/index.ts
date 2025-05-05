import request from '../index'
import type { ObstaclesDto } from '@/@types/dto'

export interface CreateMapDto {
  name: string
  description: string
  minThreshold: number
  dividColor: string
  width: number
  height: number
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
  startPoint?: { x: number; y: number }
  endPoint?: { x: number; y: number }
  createdAt: Date
  updatedAt: Date
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
