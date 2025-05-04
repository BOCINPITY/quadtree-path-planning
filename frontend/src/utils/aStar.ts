import type { QuadTreeNode } from './quadTree';
export type HeuristicType = 'manhattan' | 'euclidean';
export const aStar = (
  start: QuadTreeNode,
  end: QuadTreeNode,
  root: QuadTreeNode,
  astarHeuristicType: HeuristicType
): {
  path: QuadTreeNode[] | null; // 最终路径
  steps: {
    current: QuadTreeNode; // 当前节点
    openSet: QuadTreeNode[]; // 当前开放列表
    closedSet: QuadTreeNode[]; // 当前关闭列表
    neighbors: QuadTreeNode[]; // 当前节点的邻居节点
  }[]; // 每一步的状态
} => {
  const openSet: QuadTreeNode[] = [start];
  const closedSet: QuadTreeNode[] = [];
  const steps: {
    current: QuadTreeNode;
    openSet: QuadTreeNode[];
    closedSet: QuadTreeNode[];
    neighbors: QuadTreeNode[];
  }[] = [];

  // 如果起点或终点不可通行，直接返回
  if (!start.isWalkable || !end.isWalkable) {
    return {
      path: null,
      steps,
    };
  }

  start.gCost = 0;
  start.hCost = heuristic(start, end, astarHeuristicType);
  start.fCost = start.gCost + start.hCost;

  while (openSet.length > 0) {
    // 找到 fCost 最小的节点
    let currentIndex = 0;
    for (let i = 0; i < openSet.length; i++) {
      if (openSet[i].fCost! < openSet[currentIndex].fCost!) {
        currentIndex = i;
      }
    }
    const current = openSet[currentIndex];

    // 如果找到终点，回溯路径
    if (current === end) {
      const path: QuadTreeNode[] = [];
      let temp = current;
      while (temp) {
        path.push(temp);
        temp = temp.parent!;
      }
      return {
        path: path.reverse(),
        steps,
      };
    }

    // 从开放列表中移除当前节点，并加入关闭列表
    openSet.splice(currentIndex, 1);
    closedSet.push(current);

    // 获取当前节点的邻居节点
    const neighbors = getNeighbors(current, root);
    for (const neighbor of neighbors) {
      // 如果邻居节点不可通行或已在关闭列表中，跳过
      if (!neighbor.isWalkable || closedSet.includes(neighbor)) {
        continue;
      }

      // 计算从当前节点到邻居节点的成本
      const tentativeGCost = current.gCost! + heuristic(current, neighbor, astarHeuristicType);

      // 如果邻居节点不在开放列表中，或新的路径成本更低，则更新邻居节点
      if (!openSet.includes(neighbor)) {
        openSet.push(neighbor);
      } else if (tentativeGCost >= neighbor.gCost!) {
        continue;
      }

      // 更新邻居节点的成本和父节点
      neighbor.parent = current;
      neighbor.gCost = tentativeGCost;
      neighbor.hCost = heuristic(neighbor, end, astarHeuristicType);
      neighbor.fCost = neighbor.gCost + neighbor.hCost;
    }

    // 保存当前步骤的状态
    steps.push({
      current,
      openSet: [...openSet],
      closedSet: [...closedSet],
      neighbors: [...neighbors],
    });
  }

  // 如果未找到路径
  return {
    path: null,
    steps,
  };
};
/**
 * 获取四叉树中某个节点的相邻节点。
 *
 * @param node - 要查找相邻节点的当前节点。
 * @param root - 四叉树结构的根节点。
 * @returns 可行走的相邻节点数组。
 */
export const getNeighbors = (node: QuadTreeNode, root: QuadTreeNode): QuadTreeNode[] => {
  const neighbors: QuadTreeNode[] = [];
  const bounds = node.bounds;

  // 定义四个方向
  const directions = [
    { dx: -1, dy: 0 }, // 左
    { dx: 1, dy: 0 }, // 右
    { dx: 0, dy: -1 }, // 上
    { dx: 0, dy: 1 }, // 下
  ];

  for (const dir of directions) {
    const neighborX = bounds.midX + dir.dx * bounds.width;
    const neighborY = bounds.midY + dir.dy * bounds.height;

    // 查找邻居节点
    const neighbor = findNodeContainingPoint(root, neighborX, neighborY);
    if (neighbor && neighbor.isWalkable) {
      neighbors.push(neighbor);
    }
  }

  return neighbors;
};

/**
 * 查找四叉树中包含特定点的节点。
 *
 * @param root - 四叉树结构的根节点。
 * @param x - 点的 x 坐标。
 * @param y - 点的 y 坐标。
 * @returns 包含该点的节点，如果不存在则返回 null。
 */
export const findNodeContainingPoint = (
  root: QuadTreeNode,
  x: number,
  y: number
): QuadTreeNode | null => {
  if (root.isLeaf) {
    const bounds = root.bounds;
    if (
      x >= bounds.x &&
      x <= bounds.x + bounds.width &&
      y >= bounds.y &&
      y <= bounds.y + bounds.height &&
      root.isWalkable // 确保节点可通行
    ) {
      return root;
    }
    return null;
  }

  for (const child of root.children || []) {
    const node = findNodeContainingPoint(child, x, y);
    if (node) {
      return node;
    }
  }

  return null;
};

/**
 * 根据指定的启发式类型计算两个节点之间的启发式成本。
 *
 * @param a - 起始节点。
 * @param b - 目标节点。
 * @param astarHeuristicType - 使用的启发式类型（'manhattan' 或 'euclidean'）。
 * @returns 两个节点之间的启发式成本。
 */
export const heuristic = (
  a: QuadTreeNode,
  b: QuadTreeNode,
  astarHeuristicType: HeuristicType
): number => {
  if (astarHeuristicType === 'manhattan') {
    // 曼哈顿距离
    return (
      Math.abs(a.bounds.midX - b.bounds.midX) + Math.abs(a.bounds.midY - b.bounds.midY)
    );
  } else if (astarHeuristicType === 'euclidean') {
    // 欧几里得距离
    const dx = a.bounds.midX - b.bounds.midX;
    const dy = a.bounds.midY - b.bounds.midY;
    return Math.sqrt(dx * dx + dy * dy);
  } else {
    throw new Error('Unsupported heuristic type');
  }
};
