import { cellKey, type Point } from './types'

export interface MapPreset {
  id: string
  name: string
  description: string
  columns: number
  rows: number
  start: Point
  goal: Point
  blocked: Set<string>
}

const fromCells = (cells: Point[]) => new Set(cells.map(({ x, y }) => cellKey(x, y)))

function corridor(): MapPreset {
  const cells: Point[] = []
  for (let y = 2; y < 18; y += 1) {
    if (y !== 9) cells.push({ x: 10, y })
    if (y !== 13) cells.push({ x: 21, y })
  }
  for (let x = 3; x < 29; x += 1) {
    if (x !== 16) cells.push({ x, y: 6 })
  }
  return {
    id: 'corridor',
    name: '错位通道',
    description: '穿过三道带缺口的墙，观察启发式搜索如何减少扩展节点。',
    columns: 32,
    rows: 20,
    start: { x: 2, y: 16 },
    goal: { x: 29, y: 3 },
    blocked: fromCells(cells),
  }
}

function rooms(): MapPreset {
  const cells: Point[] = []
  for (let x = 5; x < 27; x += 1) {
    if (x !== 8 && x !== 24) cells.push({ x, y: 4 })
    if (x !== 15) cells.push({ x, y: 15 })
  }
  for (let y = 4; y <= 15; y += 1) {
    if (y !== 10) cells.push({ x: 15, y })
  }
  return {
    id: 'rooms',
    name: '连通房间',
    description: '多个房间通过窄门连接，适合检查四叉树邻接关系。',
    columns: 32,
    rows: 20,
    start: { x: 2, y: 2 },
    goal: { x: 29, y: 17 },
    blocked: fromCells(cells),
  }
}

function openField(): MapPreset {
  return {
    id: 'open',
    name: '开放平原',
    description: '没有障碍物的基准地图，整张地图只需要一个自由叶节点。',
    columns: 32,
    rows: 20,
    start: { x: 2, y: 10 },
    goal: { x: 29, y: 10 },
    blocked: new Set(),
  }
}

export const presets: MapPreset[] = [corridor(), rooms(), openField()]
