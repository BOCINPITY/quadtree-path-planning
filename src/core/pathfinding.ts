import { centerOf, type Edge, type QuadNode, type SearchResult } from './types'

type Algorithm = SearchResult['algorithm']

interface QueueItem {
  id: string
  priority: number
}

class MinQueue {
  private items: QueueItem[] = []

  push(item: QueueItem) {
    this.items.push(item)
    this.items.sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))
  }

  pop(): QueueItem | undefined {
    return this.items.shift()
  }

  get empty() {
    return this.items.length === 0
  }
}

const heuristic = (a: QuadNode, b: QuadNode) => {
  const ac = centerOf(a)
  const bc = centerOf(b)
  return Math.hypot(ac.x - bc.x, ac.y - bc.y)
}

export function searchPath(
  algorithm: Algorithm,
  start: QuadNode,
  goal: QuadNode,
  leaves: QuadNode[],
  graph: ReadonlyMap<string, Edge[]>,
): SearchResult {
  const startedAt = performance.now()
  const nodes = new Map(leaves.map((node) => [node.id, node]))
  const frontier = new MinQueue()
  const distance = new Map<string, number>([[start.id, 0]])
  const previous = new Map<string, string>()
  const settled = new Set<string>()
  const visitedOrder: QuadNode[] = []

  frontier.push({ id: start.id, priority: 0 })

  while (!frontier.empty) {
    const currentItem = frontier.pop()
    if (!currentItem || settled.has(currentItem.id)) continue
    const current = nodes.get(currentItem.id)
    if (!current) continue

    settled.add(current.id)
    visitedOrder.push(current)
    if (current.id === goal.id) break

    for (const edge of graph.get(current.id) ?? []) {
      if (settled.has(edge.to)) continue
      const candidate = (distance.get(current.id) ?? Infinity) + edge.cost
      if (candidate >= (distance.get(edge.to) ?? Infinity)) continue

      distance.set(edge.to, candidate)
      previous.set(edge.to, current.id)
      const next = nodes.get(edge.to)
      const estimate = algorithm === 'A*' && next ? heuristic(next, goal) : 0
      frontier.push({ id: edge.to, priority: candidate + estimate })
    }
  }

  const found = settled.has(goal.id)
  const path: QuadNode[] = []
  if (found) {
    let cursor: string | undefined = goal.id
    while (cursor) {
      const node = nodes.get(cursor)
      if (node) path.push(node)
      if (cursor === start.id) break
      cursor = previous.get(cursor)
    }
    path.reverse()
  }

  return {
    algorithm,
    path,
    visitedOrder,
    distance: found ? (distance.get(goal.id) ?? 0) : 0,
    durationMs: performance.now() - startedAt,
    found,
  }
}
