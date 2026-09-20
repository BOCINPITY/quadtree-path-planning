export interface Point {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export type NodeState = 'free' | 'blocked' | 'mixed'

export interface QuadNode {
  id: string
  rect: Rect
  depth: number
  state: NodeState
  children: QuadNode[]
}

export interface Edge {
  to: string
  cost: number
}

export interface SearchResult {
  algorithm: 'A*' | 'Dijkstra'
  path: QuadNode[]
  visitedOrder: QuadNode[]
  distance: number
  durationMs: number
  found: boolean
}

export const cellKey = (x: number, y: number) => `${x},${y}`

export const centerOf = (node: QuadNode): Point => ({
  x: node.rect.x + node.rect.width / 2,
  y: node.rect.y + node.rect.height / 2,
})
