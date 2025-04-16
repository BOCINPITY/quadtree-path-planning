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
  obstacleCount?: number
}

export interface QuadTreeRequest {
  width: number
  height: number
  obstacles: Obstacles[]
  minThreshold: number
}
export function buildQuadTreeFrontend(request: QuadTreeRequest): QuadTreeNode {
  const { width, height, obstacles, minThreshold } = request

  function recursiveBuild(x: number, y: number, w: number, h: number): QuadTreeNode {
    const node: QuadTreeNode = {
      bounds: {
        x,
        y,
        width: w,
        height: h,
        midX: x + w / 2,
        midY: y + h / 2,
      },
      isLeaf: true,
    }

    // 检查当前区域是否包含障碍物
    const containsObstacle = obstacles.some((obstacle) => {
      if (obstacle.type === 'circle') {
        // 圆形障碍物检测
        const circleX = obstacle.x
        const circleY = obstacle.y
        const radius = obstacle.radius!

        // 检测圆形与矩形区域是否相交
        const closestX = Math.max(x, Math.min(circleX, x + w))
        const closestY = Math.max(y, Math.min(circleY, y + h))
        const distanceX = circleX - closestX
        const distanceY = circleY - closestY

        return distanceX * distanceX + distanceY * distanceY < radius * radius
      } else {
        // 矩形障碍物检测
        const rectX = obstacle.x
        const rectY = obstacle.y
        const rectW = obstacle.width!
        const rectH = obstacle.height!

        // AABB碰撞检测
        return rectX < x + w && rectX + rectW > x && rectY < y + h && rectY + rectH > y
      }
    })

    // 如果区域不包含障碍物或已经达到最小分割阈值，则停止分割
    if (!containsObstacle || w <= minThreshold || h <= minThreshold) {
      return node
    }

    // 需要分割
    node.isLeaf = false
    node.children = [
      recursiveBuild(x, y, w / 2, h / 2), // 左上
      recursiveBuild(x + w / 2, y, w / 2, h / 2), // 右上
      recursiveBuild(x, y + h / 2, w / 2, h / 2), // 左下
      recursiveBuild(x + w / 2, y + h / 2, w / 2, h / 2), // 右下
    ]

    return node
  }

  return recursiveBuild(0, 0, width, height)
}
