import type { Obstacles } from '@/@types/dto';

// 四叉树节点的数据结构
export interface QuadTreeNode {
  // 节点的边界矩形
  x: number;
  y: number;
  width: number;
  height: number;

  // 节点边界矩形的中心点
  centerX: number;
  centerY: number;

  // 是否是叶子节点
  isLeaf: boolean;

  // 子节点（如果有）
  children?: QuadTreeNode[];

  // 当前节点包含的障碍物
  obstacles: Obstacles[];

  // 节点深度（可选）
  depth?: number;
}

// 构建四叉树的函数
export function buildQuadTree(
  width: number,
  height: number,
  minThreshold: number,
  obstacles: Obstacles[]
): QuadTreeNode {
  // 初始化根节点
  const rootNode: QuadTreeNode = {
    x: 0,
    y: 0,
    width,
    height,
    centerX: width / 2,
    centerY: height / 2,
    isLeaf: true,
    obstacles: [],
    depth: 0
  };

  // 将所有障碍物添加到根节点
  rootNode.obstacles = [...obstacles];

  // 递归构建四叉树
  divideNode(rootNode, minThreshold);

  return rootNode;
}

// 递归分割节点的函数
function divideNode(node: QuadTreeNode, minThreshold: number): void {
  // 如果节点尺寸小于最小阈值，不再分割
  if (node.width <= minThreshold || node.height <= minThreshold) {
    return;
  }

  // 检查节点是否包含障碍物
  if (node.obstacles.length === 0) {
    return;
  }

  // 标记为非叶子节点
  node.isLeaf = false;

  // 计算子节点的尺寸
  const childWidth = node.width / 2;
  const childHeight = node.height / 2;

  // 创建四个子节点
  const children: QuadTreeNode[] = [
    // 左上
    {
      x: node.x,
      y: node.y,
      width: childWidth,
      height: childHeight,
      centerX: node.x + childWidth / 2,
      centerY: node.y + childHeight / 2,
      isLeaf: true,
      obstacles: [],
      depth: (node.depth || 0) + 1
    },
    // 右上
    {
      x: node.x + childWidth,
      y: node.y,
      width: childWidth,
      height: childHeight,
      centerX: node.x + childWidth * 1.5,
      centerY: node.y + childHeight / 2,
      isLeaf: true,
      obstacles: [],
      depth: (node.depth || 0) + 1
    },
    // 左下
    {
      x: node.x,
      y: node.y + childHeight,
      width: childWidth,
      height: childHeight,
      centerX: node.x + childWidth / 2,
      centerY: node.y + childHeight * 1.5,
      isLeaf: true,
      obstacles: [],
      depth: (node.depth || 0) + 1
    },
    // 右下
    {
      x: node.x + childWidth,
      y: node.y + childHeight,
      width: childWidth,
      height: childHeight,
      centerX: node.x + childWidth * 1.5,
      centerY: node.y + childHeight * 1.5,
      isLeaf: true,
      obstacles: [],
      depth: (node.depth || 0) + 1
    }
  ];

  node.children = children;

  // 将障碍物分配到子节点
  for (const obstacle of node.obstacles) {
    for (const child of children) {
      if (isObstacleInRect(obstacle, child)) {
        child.obstacles.push(obstacle);
        break; // 障碍物只能属于一个子节点
      }
    }
  }

  // 递归处理子节点
  for (const child of children) {
    divideNode(child, minThreshold);
  }

  // 清空父节点的障碍物列表
  node.obstacles = [];
}

// 判断障碍物是否完全在矩形内
function isObstacleInRect(obstacle: Obstacles, rect: QuadTreeNode): boolean {
  // 处理圆形障碍物
  if (obstacle.radius !== undefined) {
    const left = obstacle.x - obstacle.radius;
    const right = obstacle.x + obstacle.radius;
    const top = obstacle.y - obstacle.radius;
    const bottom = obstacle.y + obstacle.radius;

    // 检查圆形是否完全在矩形内
    return (
      left >= rect.x &&
      right <= rect.x + rect.width &&
      top >= rect.y &&
      bottom <= rect.y + rect.height
    );
  }

  // 处理矩形障碍物
  if (obstacle.width !== undefined && obstacle.height !== undefined) {
    const left = obstacle.x;
    const right = obstacle.x + obstacle.width;
    const top = obstacle.y;
    const bottom = obstacle.y + obstacle.height;

    // 检查矩形是否完全在矩形内
    return (
      left >= rect.x &&
      right <= rect.x + rect.width &&
      top >= rect.y &&
      bottom <= rect.y + rect.height
    );
  }

  // 如果障碍物类型不支持，则认为不在矩形内
  return false;
}
