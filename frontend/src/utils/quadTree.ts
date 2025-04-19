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
}

// 辅助函数：计算某个区域内的障碍物数量
function countObstaclesInBounds(obstacles: Obstacles[], bounds: {
  x: number
  y: number
  width: number
  height: number
}): number {
  return obstacles.filter((obstacle) => {
    if (obstacle.type === 'circle') {
      const circleX = obstacle.x
      const circleY = obstacle.y
      const radius = obstacle.radius!
      const closestX = Math.max(bounds.x, Math.min(circleX, bounds.x + bounds.width))
      const closestY = Math.max(bounds.y, Math.min(circleY, bounds.y + bounds.height))
      const distanceX = circleX - closestX
      const distanceY = circleY - closestY
      return distanceX * distanceX + distanceY * distanceY < radius * radius
    } else {
      const rectX = obstacle.x
      const rectY = obstacle.y
      const rectW = obstacle.width!
      const rectH = obstacle.height!
      return rectX < bounds.x + bounds.width && rectX + rectW > bounds.x && rectY < bounds.y + bounds.height && rectY + rectH > bounds.y
    }
  }).length
}

export function buildQuadTreeFrontend(request: QuadTreeRequest): QuadTreeNode {
  const { width, height, obstacles, minThreshold } = request

  function recursiveBuild(x: number, y: number, w: number, h: number): QuadTreeNode {
    const bounds = {
      x,
      y,
      width: w,
      height: h,
      midX: x + w / 2,
      midY: y + h / 2,
    }
    const obstacleCount = countObstaclesInBounds(obstacles, bounds)
    const node: QuadTreeNode = {
      bounds,
      isLeaf: true,
      obstacleCount,
      isWalkable: obstacleCount === 0 // 无障碍物则可通行
    }

    // 如果区域不包含障碍物或已经达到最小分割阈值，则停止分割
    if (obstacleCount === 0 || w <= minThreshold || h <= minThreshold) {
      return node
    }

    // 尝试分割
    const children = [
      recursiveBuild(x, y, w / 2, h / 2), // 左上
      recursiveBuild(x + w / 2, y, w / 2, h / 2), // 右上
      recursiveBuild(x, y + h / 2, w / 2, h / 2), // 左下
      recursiveBuild(x + w / 2, y + h / 2, w / 2, h / 2), // 右下
    ];

    const totalChildObstacleCount = children.reduce((sum, child) => sum + child.obstacleCount, 0)

    // 如果子节点的障碍物总数等于当前节点的障碍物数量，且每个子节点都有障碍物，说明可能是一个大障碍物横跨了四个象限，此时不分割
    if (totalChildObstacleCount === obstacleCount && children.every(child => child.obstacleCount > 0)) {
      return node;
    } else {
      // 否则继续分割
      node.isLeaf = false;
      node.children = children;
      return node;
    }
  }

  return recursiveBuild(0, 0, width, height);
}
