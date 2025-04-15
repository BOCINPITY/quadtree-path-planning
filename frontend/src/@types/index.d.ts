export type IComponentShapeType =
  | 'rectangle' // 矩形
  | 'circle' // 圆形
export interface IComponentShape {
  name: string
  icon: string
  type: IComponentShapeType
}

export interface CircleConfig {
  type: 'circle'
  x: number
  y: number
  radius: number
  fill: string
  stroke: string
  strokeWidth: number
  draggable: boolean
  isDragging: boolean
}

export interface INode {
  type?: IComponentShapeType | undefined
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  fill: string
  stroke: string
  strokeWidth: number
  draggable: boolean
  isDragging: boolean
}

export interface RectangleConfig {
  type: 'rectangle'
  x: number
  y: number
  width: number
  height: number
  fill: string
  stroke: string
  strokeWidth: number
  draggable: boolean
  isDragging: boolean
}
type Obstacles = CircleConfig | RectangleConfig

//地图相关
export interface MapData {
  name?: string
  width: number
  height: number
  obstacles: (CircleConfig | RectangleConfig)[]
  start?: { x: number; y: number }
  end?: { x: number; y: number }
}

export interface ResponseData<T> {
  message: string
  data: T
  code?: number
}
export interface QTMapResponse {
  _id: string
  width: number
  height: number
  obstacles: Array<{
    _id: string
    shape: IComponentShapeType
    x: number
    y: number
    radius?: number
    width?: number
    height?: number
    fill: string
    stroke: string
    strokeWidth: number
  }>
}

export interface QTMapListItem {
  _id: string
  width: number
  height: number
}

export interface User {
  id: string
  email: string
  name: string
}
