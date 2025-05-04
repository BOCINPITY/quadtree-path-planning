import type { Obstacles } from '@/@types/dto'
import { findNodeContainingPoint } from './pathFinding';

// 四叉树节点定义，添加 neighbors 属性
export interface QuadTreeNode {
  bounds: {
    x: number
    y: number
    width: number
    height: number
    midX: number
    midY: number
  }
  isLeaf: boolean
  children?: QuadTreeNode[]
  obstacleCount: number
  isWalkable: boolean
  gCost?: number
  hCost?: number
  fCost?: number
  parent?: QuadTreeNode
  neighbors?: QuadTreeNode[] // 存储邻居节点
}

export interface QuadTreeRequest {
  width: number
  height: number
  obstacles: Obstacles[]
  minThreshold: number
  obstacleRatioThreshold: number
}

// 辅助函数：计算某个区域内的障碍物覆盖面积
function calculateObstacleAreaInBounds(obstacles: Obstacles[], bounds: {
  x: number
  y: number
  width: number
  height: number
}): number {
  return obstacles.reduce((totalArea, obstacle) => {
    if (obstacle.type === 'circle') {
      const circleX = obstacle.x
      const circleY = obstacle.y
      const radius = obstacle.radius!
      const closestX = Math.max(bounds.x, Math.min(circleX, bounds.x + bounds.width))
      const closestY = Math.max(bounds.y, Math.min(circleY, bounds.y + bounds.height))
      const distanceX = circleX - closestX
      const distanceY = circleY - closestY
      const isInside = distanceX * distanceX + distanceY * distanceY < radius * radius
      return isInside ? totalArea + Math.PI * radius * radius : totalArea
    } else {
      const rectX = obstacle.x
      const rectY = obstacle.y
      const rectW = obstacle.width!
      const rectH = obstacle.height!
      const overlapWidth = Math.max(0, Math.min(bounds.x + bounds.width, rectX + rectW) - Math.max(bounds.x, rectX))
      const overlapHeight = Math.max(0, Math.min(bounds.y + bounds.height, rectY + rectH) - Math.max(bounds.y, rectY))
      return totalArea + overlapWidth * overlapHeight
    }
  }, 0)
}

// 定义八个方向，包括斜向
const directions = [
  { dx: -1, dy: 0 }, // 左
  { dx: 1, dy: 0 }, // 右
  { dx: 0, dy: -1 }, // 上
  { dx: 0, dy: 1 }, // 下
  { dx: -1, dy: -1 }, // 左上
  { dx: 1, dy: -1 }, // 右上
  { dx: -1, dy: 1 }, // 左下
  { dx: 1, dy: 1 }, // 右下
];

export function buildQuadTreeFrontend(request: QuadTreeRequest): QuadTreeNode {
  const { width, height, obstacles, minThreshold, obstacleRatioThreshold } = request
  const allLeafNodes: QuadTreeNode[] = [];

  function recursiveBuild(x: number, y: number, w: number, h: number): QuadTreeNode {
    const bounds = {
      x,
      y,
      width: w,
      height: h,
      midX: x + w / 2,
      midY: y + h / 2,
    }
    const obstacleArea = calculateObstacleAreaInBounds(obstacles, bounds)
    const totalArea = w * h
    const obstacleRatio = obstacleArea / totalArea

    const node: QuadTreeNode = {
      bounds,
      isLeaf: true,
      obstacleCount: obstacleArea,
      isWalkable: obstacleRatio <= obstacleRatioThreshold,
    }

    // 如果区域不包含障碍物或已经达到最小分割阈值，则停止分割
    if (obstacleArea === 0 || w <= minThreshold || h <= minThreshold || obstacleRatio < 0.01) {
      allLeafNodes.push(node);
      return node;
    }

    // 尝试分割
    const children = [
      recursiveBuild(x, y, w / 2, h / 2), // 左上
      recursiveBuild(x + w / 2, y, w / 2, h / 2), // 右上
      recursiveBuild(x, y + h / 2, w / 2, h / 2), // 左下
      recursiveBuild(x + w / 2, y + h / 2, w / 2, h / 2), // 右下
    ]
    node.isLeaf = false
    node.children = children
    return node
  }

  const root = recursiveBuild(0, 0, width, height);

  // 为所有叶子节点计算邻居节点
  for (const node of allLeafNodes) {
    const neighbors: QuadTreeNode[] = [];
    const bounds = node.bounds;

    for (const dir of directions) {
      const neighborX = bounds.midX + dir.dx * bounds.width;
      const neighborY = bounds.midY + dir.dy * bounds.height;

      // 查找邻居节点
      const neighbor = findNodeContainingPoint(root, neighborX, neighborY);
      if (neighbor && neighbor.isWalkable) {
        neighbors.push(neighbor);
      }
    }

    node.neighbors = neighbors;
  }

  return root;
}

/**
 *
 * @param root 四叉树的根节点
 * @description 四叉树的遍历函数，返回所有叶子节点，遍历
 * @returns 所有叶子节点的数组
 */
export const flattenQuadTree = (root: QuadTreeNode): QuadTreeNode[] => {
  const nodes: QuadTreeNode[] = [];
  const traverse = (node: QuadTreeNode) => {
    if (node.isLeaf) {
      nodes.push(node);
    } else if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  };
  traverse(root);
  return nodes;
};
