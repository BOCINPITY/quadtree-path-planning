import Konva from 'konva'

// 四叉树节点的数据结构
interface QuadTreeNode {
  x: number
  y: number
  width: number
  height: number
  centerX: number
  centerY: number
  isLeaf: boolean
  children?: QuadTreeNode[]
  obstacles: Obstacles[]
  depth?: number
}

// 障碍物接口
export interface Obstacles {
  id?: string
  x: number
  y: number
  radius?: number
  width?: number
  height?: number
  fill: string
  stroke: string
  strokeWidth: number
  type: string
  draggable: boolean
  isDraging: boolean
}

// 动画控制器
export class QuadTreeAnimator {
  private stage: Konva.Stage
  private layer: Konva.Layer
  private rootNode: QuadTreeNode
  private currentStep: number
  private animationId: number | null
  private isPlaying: boolean

  constructor(stage: Konva.Stage,layer:Konva.Layer, rootNode: QuadTreeNode) {
    this.stage = stage

    this.layer = layer
    this.stage.add(this.layer)

    this.rootNode = rootNode
    this.currentStep = 0
    this.animationId = null
    this.isPlaying = false

    // 初始化舞台
    this.initStage()
  }

  // 初始化舞台，绘制根节点和障碍物
  private initStage() {
    // 绘制根节点
    this.drawNode(this.rootNode)

    // 绘制障碍物
    this.drawObstacles(this.rootNode.obstacles)

    // 绘制根节点的中心点
    this.drawCenterPoint(this.rootNode)
  }

  // 绘制节点
  private drawNode(node: QuadTreeNode) {
    const rect = new Konva.Rect({
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      stroke: 'rgba(0, 0, 0, 0.2)',
      strokeWidth: 1,
      dash: [2, 2],
    })

    this.layer.add(rect)
  }

  // 绘制障碍物
  private drawObstacles(obstacles: Obstacles[]) {
    obstacles.forEach((obstacle) => {
      if (obstacle.radius !== undefined) {
        // 绘制圆形障碍物
        const circle = new Konva.Circle({
          x: obstacle.x,
          y: obstacle.y,
          radius: obstacle.radius,
          fill: obstacle.fill,
          stroke: obstacle.stroke,
          strokeWidth: obstacle.strokeWidth,
        })
        this.layer.add(circle)
      } else if (obstacle.width !== undefined && obstacle.height !== undefined) {
        // 绘制矩形障碍物
        const rect = new Konva.Rect({
          x: obstacle.x,
          y: obstacle.y,
          width: obstacle.width,
          height: obstacle.height,
          fill: obstacle.fill,
          stroke: obstacle.stroke,
          strokeWidth: obstacle.strokeWidth,
        })
        this.layer.add(rect)
      }
    })
  }

  // 绘制节点中心点
  private drawCenterPoint(node: QuadTreeNode) {
    const group = new Konva.Group()

    // 绘制中心点
    const centerCircle = new Konva.Circle({
      x: node.centerX,
      y: node.centerY,
      radius: 3,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 1,
    })

    // 添加坐标文本
    const text = new Konva.Text({
      x: node.centerX + 5,
      y: node.centerY - 5,
      text: `${node.centerX.toFixed(0)}, ${node.centerY.toFixed(0)}`,
      fontSize: 10,
      fontFamily: 'Arial',
      fill: 'black',
    })

    group.add(centerCircle)
    group.add(text)
    this.layer.add(group)
  }

  // 开始动画
  public startAnimation() {
    if (!this.isPlaying) {
      this.isPlaying = true
      this.animate()
    }
  }

  // 暂停动画
  public pauseAnimation() {
    this.isPlaying = false
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  // 重置动画
  public resetAnimation() {
    this.pauseAnimation()
    this.currentStep = 0
    this.layer.destroyChildren() // 清空图层
    this.initStage() // 重新初始化舞台
  }

  // 动画核心逻辑
  private animate() {
    if (this.currentStep === 0) {
      // 第一步：显示根节点
      this.drawNode(this.rootNode)
      this.drawCenterPoint(this.rootNode)
    } else {
      // 后续步骤：递归分割节点
      this.animateStep(this.rootNode, this.currentStep)
    }

    this.currentStep++
    this.animationId = requestAnimationFrame(() => this.animate())
  }

  // 递归动画步骤
  private animateStep(node: QuadTreeNode, step: number) {
    if (!node.children || node.children.length === 0) {
      return
    }

    // 绘制子节点
    for (const child of node.children) {
      this.drawNode(child)
      this.drawCenterPoint(child)
      this.drawObstacles(child.obstacles)
    }

    // 递归处理子节点
    for (const child of node.children) {
      this.animateStep(child, step)
    }
  }
}
