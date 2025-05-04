import type { IComponentShapeType } from '.'

export interface ObstaclesDto {
  id?: string
  x: number
  y: number
  radius?: number
  width?: number
  height?: number
  fill: string
  stroke: string
  strokeWidth: number
  type: IComponentShapeType
}
export interface Obstacles extends ObstaclesDto {
  draggable: boolean
  isDragging: boolean
  isActive: boolean
}

export interface SelectedObstaclesDto extends Obstacles {
  type: IComponentShapeType | ''
}
