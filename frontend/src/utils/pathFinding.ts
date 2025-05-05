import type { QuadTreeNode } from './quadTree';
export type HeuristicType = 'manhattan' | 'euclidean' | 'chebyshev' | 'diagonal';

// 定义最小堆类
class PriorityQueue {
    nodes: QuadTreeNode[] = [];

    enqueue(node: QuadTreeNode) {
        this.nodes.push(node);
        this.nodes.sort((a, b) => a.fCost! - b.fCost!);
    }

    dequeue(): QuadTreeNode | undefined {
        return this.nodes.shift();
    }

    isEmpty(): boolean {
        return this.nodes.length === 0;
    }

    includes(node: QuadTreeNode): boolean {
        return this.nodes.includes(node);
    }
}

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
    const openSet = new PriorityQueue();
    openSet.enqueue(start);
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

    while (!openSet.isEmpty()) {
        const current = openSet.dequeue()!;

        // 如果找到终点，回溯路径
        if (current === end) {
            closedSet.push(current);
            const path: QuadTreeNode[] = [];
            let temp = current;
            while (temp) {
                path.push(temp);
                temp = temp.parent!;
            }
            steps.push({
                current,
                openSet: openSet.nodes.slice(),
                closedSet: [...closedSet],
                neighbors: [],
            });
            return {
                path: path.reverse(),
                steps,
            };
        }

        // 加入关闭列表
        closedSet.push(current);

        // 获取当前节点的邻居节点
        const neighbors = getNeighbors(current);
        for (const neighbor of neighbors) {
            if (!neighbor.isWalkable || closedSet.includes(neighbor)) {
                continue;
            }

            const tentativeGCost = current.gCost! + heuristic(current, neighbor, astarHeuristicType);
            if (!openSet.includes(neighbor)) {
                neighbor.parent = current;
                neighbor.gCost = tentativeGCost;
                neighbor.hCost = heuristic(neighbor, end, astarHeuristicType);
                neighbor.fCost = neighbor.gCost + neighbor.hCost;
                openSet.enqueue(neighbor);
            } else if (tentativeGCost < neighbor.gCost!) {
                neighbor.parent = current;
                neighbor.gCost = tentativeGCost;
                neighbor.fCost = neighbor.gCost + neighbor.hCost!;
                // 重新排序优先队列
                openSet.nodes.sort((a, b) => a.fCost! - b.fCost!);
            }
        }

        // 保存当前步骤的状态
        steps.push({
            current,
            openSet: openSet.nodes.slice(),
            closedSet: [...closedSet],
            neighbors,
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
 * @returns 可行走的相邻节点数组。
 */
export const getNeighbors = (node: QuadTreeNode): QuadTreeNode[] => {
  return node.neighbors || [];
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
 * @param astarHeuristicType - 启发式类型，可选值为 'manhattan'、'euclidean'、'chebyshev' 或 'diagonal'。
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
  } else if (astarHeuristicType === 'chebyshev') {
    // 切比雪夫距离
    return Math.max(
      Math.abs(a.bounds.midX - b.bounds.midX),
      Math.abs(a.bounds.midY - b.bounds.midY)
    );
  } else if (astarHeuristicType === 'diagonal') {
    // 对角线距离
    const dx = Math.abs(a.bounds.midX - b.bounds.midX);
    const dy = Math.abs(a.bounds.midY - b.bounds.midY);
    const D = 1;
    const D2 = Math.sqrt(2);
    return D * (dx + dy) + (D2 - 2 * D) * Math.min(dx, dy);
  } else {
    throw new Error('Unsupported heuristic type');
  }
};

/**
 *
 * @param start
 * @param end
 * @param root
 * @returns
 */
export const dijkstra = (
  start: QuadTreeNode,
  end: QuadTreeNode,
  root: QuadTreeNode
): {
  path: QuadTreeNode[] | null;
  steps: {
    current: QuadTreeNode;
    openSet: QuadTreeNode[];
    closedSet: QuadTreeNode[];
    neighbors: QuadTreeNode[];
  }[];
} => {
  // console.log(root)
  const openSet: QuadTreeNode[] = [start];
  const closedSet: QuadTreeNode[] = [];
  const steps: {
    current: QuadTreeNode;
    openSet: QuadTreeNode[];
    closedSet: QuadTreeNode[];
    neighbors: QuadTreeNode[];
  }[] = [];

  if (!start.isWalkable || !end.isWalkable) {
    return { path: null, steps };
  }

  start.gCost = 0;

  while (openSet.length > 0) {
    // 找到 gCost 最小的节点
    let currentIndex = 0;
    for (let i = 0; i < openSet.length; i++) {
      if (openSet[i].gCost! < openSet[currentIndex].gCost!) {
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
      steps.push({
        current,
        openSet: [...openSet],
        closedSet: [...closedSet],
        neighbors: [],
      });
      return {
        path: path.reverse(),
        steps,
      };
    }

    // 从开放列表中移除当前节点，并加入关闭列表
    openSet.splice(currentIndex, 1);
    closedSet.push(current);

    // 获取当前节点的邻居节点
    const neighbors = getNeighbors(current);
    for (const neighbor of neighbors) {
      // 如果邻居节点不可通行或已在关闭列表中，跳过
      if (!neighbor.isWalkable || closedSet.includes(neighbor)) {
        continue;
      }

      // 计算从当前节点到邻居节点的成本
      // 计算从当前节点到邻居节点的实际距离
    const dx = current.bounds.midX - neighbor.bounds.midX;
    const dy = current.bounds.midY - neighbor.bounds.midY;
    const tentativeGCost = current.gCost! + Math.sqrt(dx * dx + dy * dy); // 实际距离计算

      // 如果邻居节点不在开放列表中，或新的路径成本更低，则更新邻居节点
      if (!openSet.includes(neighbor)) {
        openSet.push(neighbor);
      } else if (tentativeGCost >= neighbor.gCost!) {
        continue;
      }

      // 更新邻居节点的成本和父节点
      neighbor.parent = current;
      neighbor.gCost = tentativeGCost;
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
