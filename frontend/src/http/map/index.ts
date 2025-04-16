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
}

export const createMap = (data: CreateMapDto) => {
  return request.post('/maps', data)
}

export const getMapList = async(): Promise<GetMapListDto[]> => {
  const { data } = await request.get('/maps')
  return data
}
