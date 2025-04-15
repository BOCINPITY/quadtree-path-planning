import request from '../index'
import type { MapData, QTMapListItem } from '@/@types'

interface CircleDto {
  x: number
  y: number
  radius: number
  fill: string
  stroke: string
  strokeWidth: number
  shape: 'circle'
  _id?: string
}
interface RectangleDto {
  x: number
  y: number
  width: number
  height: number
  fill: string
  stroke: string
  strokeWidth: number
  shape: 'rectangle'
  _id?: string
}
interface MapDto {
  name?: string
  width: number
  height: number
  obstacles: {
    circle: CircleDto[]
    rectangle: RectangleDto[]
  }
  start?: { x: number; y: number }
  end?: { x: number; y: number }
}

export const createMap = (data: MapDto) => {
  return request.post<MapData>('/maps', data)
}

export const getMapList = () => {
  return request.get('/maps')
}
