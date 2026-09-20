import { cellKey, centerOf, type Edge, type Point, type QuadNode, type Rect } from './types'

function blockedCount(rect: Rect, blocked: ReadonlySet<string>): number {
  let count = 0
  for (let y = rect.y; y < rect.y + rect.height; y += 1) {
    for (let x = rect.x; x < rect.x + rect.width; x += 1) {
      if (blocked.has(cellKey(x, y))) count += 1
    }
  }
  return count
}

function splitRect(rect: Rect): Rect[] {
  const left = Math.floor(rect.width / 2)
  const right = rect.width - left
  const top = Math.floor(rect.height / 2)
  const bottom = rect.height - top

  if (rect.width === 1 && rect.height === 1) return []
  if (rect.width === 1) {
    return [
      { x: rect.x, y: rect.y, width: 1, height: top },
      { x: rect.x, y: rect.y + top, width: 1, height: bottom },
    ].filter((part) => part.height > 0)
  }
  if (rect.height === 1) {
    return [
      { x: rect.x, y: rect.y, width: left, height: 1 },
      { x: rect.x + left, y: rect.y, width: right, height: 1 },
    ].filter((part) => part.width > 0)
  }

  return [
    { x: rect.x, y: rect.y, width: left, height: top },
    { x: rect.x + left, y: rect.y, width: right, height: top },
    { x: rect.x, y: rect.y + top, width: left, height: bottom },
    { x: rect.x + left, y: rect.y + top, width: right, height: bottom },
  ].filter((part) => part.width > 0 && part.height > 0)
}

export function buildQuadTree(
  columns: number,
  rows: number,
  blocked: ReadonlySet<string>,
): QuadNode {
  let sequence = 0

  const build = (rect: Rect, depth: number): QuadNode => {
    const count = blockedCount(rect, blocked)
    const area = rect.width * rect.height
    const state = count === 0 ? 'free' : count === area ? 'blocked' : 'mixed'
    const node: QuadNode = {
      id: `q${sequence++}`,
      rect,
      depth,
      state,
      children: [],
    }

    if (state === 'mixed') {
      node.children = splitRect(rect).map((part) => build(part, depth + 1))
    }
    return node
  }

  return build({ x: 0, y: 0, width: columns, height: rows }, 0)
}

export function collectLeaves(root: QuadNode): QuadNode[] {
  if (root.children.length === 0) return [root]
  return root.children.flatMap(collectLeaves)
}

export function collectNodes(root: QuadNode): QuadNode[] {
  return [root, ...root.children.flatMap(collectNodes)]
}

export function findNode(root: QuadNode, id: string): QuadNode | null {
  if (root.id === id) return root
  for (const child of root.children) {
    const match = findNode(child, id)
    if (match) return match
  }
  return null
}

export function findNodePath(root: QuadNode, id: string): QuadNode[] | null {
  if (root.id === id) return [root]
  for (const child of root.children) {
    const childPath = findNodePath(child, id)
    if (childPath) return [root, ...childPath]
  }
  return null
}

export function findLeaf(root: QuadNode, point: Point): QuadNode | null {
  const contains = (node: QuadNode) =>
    point.x >= node.rect.x &&
    point.x < node.rect.x + node.rect.width &&
    point.y >= node.rect.y &&
    point.y < node.rect.y + node.rect.height

  if (!contains(root)) return null
  if (root.children.length === 0) return root
  for (const child of root.children) {
    const leaf = findLeaf(child, point)
    if (leaf) return leaf
  }
  return null
}

function overlapLength(a0: number, a1: number, b0: number, b1: number): number {
  return Math.max(0, Math.min(a1, b1) - Math.max(a0, b0))
}

export function shareEdge(a: QuadNode, b: QuadNode): boolean {
  const ar = a.rect
  const br = b.rect
  const verticalTouch =
    (ar.x + ar.width === br.x || br.x + br.width === ar.x) &&
    overlapLength(ar.y, ar.y + ar.height, br.y, br.y + br.height) > 0
  const horizontalTouch =
    (ar.y + ar.height === br.y || br.y + br.height === ar.y) &&
    overlapLength(ar.x, ar.x + ar.width, br.x, br.x + br.width) > 0
  return verticalTouch || horizontalTouch
}

export function buildLeafGraph(leaves: QuadNode[]): Map<string, Edge[]> {
  const freeLeaves = leaves.filter((leaf) => leaf.state === 'free')
  const graph = new Map<string, Edge[]>(freeLeaves.map((leaf) => [leaf.id, []]))

  const leftEdges = new Map<string, QuadNode>()
  const topEdges = new Map<string, QuadNode>()

  for (const leaf of freeLeaves) {
    const { x, y, width, height } = leaf.rect
    for (let offset = 0; offset < height; offset += 1) leftEdges.set(`${x},${y + offset}`, leaf)
    for (let offset = 0; offset < width; offset += 1) topEdges.set(`${x + offset},${y}`, leaf)
  }

  const connected = new Set<string>()
  const connect = (a: QuadNode, b: QuadNode | undefined) => {
    if (!b || a.id === b.id) return
    const pair = a.id < b.id ? `${a.id}:${b.id}` : `${b.id}:${a.id}`
    if (connected.has(pair)) return
    connected.add(pair)
    const ac = centerOf(a)
    const bc = centerOf(b)
    const cost = Math.hypot(ac.x - bc.x, ac.y - bc.y)
    graph.get(a.id)?.push({ to: b.id, cost })
    graph.get(b.id)?.push({ to: a.id, cost })
  }

  for (const leaf of freeLeaves) {
    const { x, y, width, height } = leaf.rect
    for (let offset = 0; offset < height; offset += 1) {
      connect(leaf, leftEdges.get(`${x + width},${y + offset}`))
    }
    for (let offset = 0; offset < width; offset += 1) {
      connect(leaf, topEdges.get(`${x + offset},${y + height}`))
    }
  }
  return graph
}
