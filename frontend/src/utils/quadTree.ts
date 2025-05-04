import type { Obstacles } from '@/@types/dto'

// 四叉树节点定义
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
  isWalkable: boolean // 新增属性，判断节点是否可通行
  gCost?: number // A* 算法中的 g 值
  hCost?: number // A* 算法中的 h 值
  fCost?: number // A* 算法中的 f 值
  parent?: QuadTreeNode // A* 算法中的父节点
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

export function buildQuadTreeFrontend(request: QuadTreeRequest): QuadTreeNode {
  const { width, height, obstacles, minThreshold, obstacleRatioThreshold } = request

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
      obstacleCount: obstacleArea, // 使用障碍物面积代替数量
      isWalkable: obstacleRatio <= obstacleRatioThreshold,
    }

    // 如果区域不包含障碍物或已经达到最小分割阈值，则停止分割
    if (obstacleArea === 0 || w <= minThreshold || h <= minThreshold || obstacleRatio < 0.01) {
      return node
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

  return recursiveBuild(0, 0, width, height)
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
      node.children.forEach(traverse);
    }
  };
  traverse(root);
  return nodes;
};
