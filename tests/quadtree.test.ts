import { describe, expect, it } from 'vitest'
import { buildLeafGraph, buildQuadTree, collectLeaves, collectNodes, findLeaf, findNodePath, shareEdge } from '../src/core/quadtree'
import { searchPath } from '../src/core/pathfinding'
import { cellKey, type QuadNode } from '../src/core/types'

describe('quadtree', () => {
  it('covers an odd-sized map without losing cells', () => {
    const tree = buildQuadTree(7, 5, new Set([cellKey(3, 2)]))
    const leaves = collectLeaves(tree)
    const area = leaves.reduce((sum, node) => sum + node.rect.width * node.rect.height, 0)
    expect(area).toBe(35)
    expect(findLeaf(tree, { x: 3.5, y: 2.5 })?.state).toBe('blocked')
    expect(findLeaf(tree, { x: 0.5, y: 0.5 })?.state).toBe('free')
  })

  it('detects shared edges across differently sized leaves', () => {
    const a = node('a', 0, 0, 2, 4)
    const b = node('b', 2, 1, 1, 1)
    const diagonal = node('c', 2, 4, 1, 1)
    expect(shareEdge(a, b)).toBe(true)
    expect(shareEdge(a, diagonal)).toBe(false)
  })

  it('returns the root-to-leaf path for tree inspection', () => {
    const tree = buildQuadTree(8, 8, new Set([cellKey(6, 6)]))
    const leaf = findLeaf(tree, { x: 6.5, y: 6.5 })!
    const path = findNodePath(tree, leaf.id)!

    expect(path[0]).toBe(tree)
    expect(path.at(-1)).toBe(leaf)
    expect(path.map((node) => node.depth)).toEqual(path.map((_, index) => index))
    expect(collectNodes(tree).length).toBeGreaterThan(collectLeaves(tree).length)
  })
})

describe('pathfinding', () => {
  it('A* and Dijkstra produce the same shortest distance', () => {
    const blocked = new Set<string>()
    for (let y = 0; y < 8; y += 1) if (y !== 4) blocked.add(cellKey(4, y))
    const tree = buildQuadTree(10, 8, blocked)
    const leaves = collectLeaves(tree).filter((leaf) => leaf.state === 'free')
    const graph = buildLeafGraph(leaves)
    const start = findLeaf(tree, { x: 1.5, y: 1.5 })!
    const goal = findLeaf(tree, { x: 8.5, y: 6.5 })!
    const astar = searchPath('A*', start, goal, leaves, graph)
    const dijkstra = searchPath('Dijkstra', start, goal, leaves, graph)

    expect(astar.found).toBe(true)
    expect(dijkstra.found).toBe(true)
    expect(astar.distance).toBeCloseTo(dijkstra.distance, 8)
    expect(astar.visitedOrder.length).toBeLessThanOrEqual(dijkstra.visitedOrder.length)
  })

  it('does not mutate nodes between repeated searches', () => {
    const tree = buildQuadTree(8, 8, new Set([cellKey(4, 4)]))
    const leaves = collectLeaves(tree).filter((leaf) => leaf.state === 'free')
    const graph = buildLeafGraph(leaves)
    const start = findLeaf(tree, { x: 0.5, y: 0.5 })!
    const goal = findLeaf(tree, { x: 7.5, y: 7.5 })!
    const first = searchPath('A*', start, goal, leaves, graph)
    const second = searchPath('A*', start, goal, leaves, graph)

    expect(second.path.map((item) => item.id)).toEqual(first.path.map((item) => item.id))
    expect(leaves.every((item) => !('parent' in item) && !('gCost' in item))).toBe(true)
  })
})

function node(id: string, x: number, y: number, width: number, height: number): QuadNode {
  return { id, rect: { x, y, width, height }, depth: 0, state: 'free', children: [] }
}
