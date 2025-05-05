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
  id: string; // 用户ID
  email: string; // 用户邮箱
  name: string; // 用户名
  password: string; // 用户密码
  avatar?: string; // 用户头像，非必填
  bio?: string; // 用户简介，非必填
  address?: string; // 用户地址，非必填
  field?: string; // 用户领域，非必填
  birthday?: Date; // 用户生日，非必填
  gender?: 'male' | 'female' | 'other'; // 用户性别，非必填
}
