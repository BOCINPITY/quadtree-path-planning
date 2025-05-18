/**
 * @typedef {Object} QuadTreeNode
 * @property {boolean} isWalkable - 是否可通行
 * @property {boolean} isLeaf - 是否是叶子节点
 * @property {Object} bounds - 节点的边界
 * @property {number} bounds.x - 边界的 x 坐标
 * @property {number} bounds.y - 边界的 y 坐标
 * @property {number} bounds.width - 边界的宽度
 * @property {number} bounds.height - 边界的高度
 * @property {number} bounds.midX - 边界的中心 x 坐标
 * @property {number} bounds.midY - 边界的中心 y 坐标
 * @property {QuadTreeNode[]} [children] - 子节点
 * @property {QuadTreeNode[]} [neighbors] - 邻居节点
 * @property {QuadTreeNode} [parent] - 父节点
 * @property {number} [gCost] - 从起点到当前节点的成本
 * @property {number} [hCost] - 启发式成本
 * @property {number} [fCost] - 总成本 (gCost + hCost)
 */

/**
 * @typedef {'manhattan' | 'euclidean' | 'chebyshev' | 'diagonal'} HeuristicType
 */

/**
 * 最小堆类
 */
class PriorityQueue {
    constructor() {
        /** @type {QuadTreeNode[]} */
        this.nodes = [];
    }

    /**
     * 将节点加入队列
     * @param {QuadTreeNode} node 
     */
    enqueue(node) {
        this.nodes.push(node);
        this.nodes.sort((a, b) => a.fCost - b.fCost);
    }

    /**
     * 从队列中移除并返回优先级最高的节点
     * @returns {QuadTreeNode | undefined}
     */
    dequeue() {
        return this.nodes.shift();
    }

    /**
     * 检查队列是否为空
     * @returns {boolean}
     */
    isEmpty() {
        return this.nodes.length === 0;
    }

    /**
     * 检查队列中是否包含指定节点
     * @param {QuadTreeNode} node 
     * @returns {boolean}
     */
    includes(node) {
        return this.nodes.includes(node);
    }
}

/**
 * A* 算法
 * @param {QuadTreeNode} start - 起点
 * @param {QuadTreeNode} end - 终点
 * @param {QuadTreeNode} root - 四叉树的根节点
 * @param {HeuristicType} astarHeuristicType - 启发式类型
 * @returns {{
 *   path: QuadTreeNode[] | null,
 *   steps: {
 *     current: QuadTreeNode,
 *     openSet: QuadTreeNode[],
 *     closedSet: QuadTreeNode[],
 *     neighbors: QuadTreeNode[]
 *   }[]
 * }}
 */
function aStar(start, end, root, astarHeuristicType) {
    const openSet = new PriorityQueue();
    openSet.enqueue(start);
    const closedSet = [];
    const steps = [];

    if (!start.isWalkable || !end.isWalkable) {
        return { path: null, steps };
    }

    start.gCost = 0;
    start.hCost = heuristic(start, end, astarHeuristicType);
    start.fCost = start.gCost + start.hCost;

    while (!openSet.isEmpty()) {
        const current = openSet.dequeue();

        if (current === end) {
            closedSet.push(current);
            const path = [];
            let temp = current;
            while (temp) {
                path.push(temp);
                temp = temp.parent;
            }
            steps.push({
                current,
                openSet: [...openSet.nodes],
                closedSet: [...closedSet],
                neighbors: [],
            });
            return { path: path.reverse(), steps };
        }

        closedSet.push(current);

        const neighbors = getNeighbors(current);
        for (const neighbor of neighbors) {
            if (!neighbor.isWalkable || closedSet.includes(neighbor)) {
                continue;
            }

            const tentativeGCost = current.gCost + heuristic(current, neighbor, astarHeuristicType);
            if (!openSet.includes(neighbor)) {
                neighbor.parent = current;
                neighbor.gCost = tentativeGCost;
                neighbor.hCost = heuristic(neighbor, end, astarHeuristicType);
                neighbor.fCost = neighbor.gCost + neighbor.hCost;
                openSet.enqueue(neighbor);
            } else if (tentativeGCost < neighbor.gCost) {
                neighbor.parent = current;
                neighbor.gCost = tentativeGCost;
                neighbor.fCost = neighbor.gCost + neighbor.hCost;
                openSet.nodes.sort((a, b) => a.fCost - b.fCost);
            }
        }

        steps.push({
            current,
            openSet: [...openSet.nodes],
            closedSet: [...closedSet],
            neighbors,
        });
    }

    return { path: null, steps };
}

/**
 * 获取四叉树中某个节点的相邻节点
 * @param {QuadTreeNode} node 
 * @returns {QuadTreeNode[]}
 */
function getNeighbors(node) {
    return node.neighbors || [];
}



/**
 * 根据指定的启发式类型计算两个节点之间的启发式成本
 * @param {QuadTreeNode} a - 起始节点
 * @param {QuadTreeNode} b - 目标节点
 * @param {HeuristicType} astarHeuristicType - 启发式类型
 * @returns {number}
 */
function heuristic(a, b, astarHeuristicType) {
    if (astarHeuristicType === 'manhattan') {
        return Math.abs(a.bounds.midX - b.bounds.midX) + Math.abs(a.bounds.midY - b.bounds.midY);
    } else if (astarHeuristicType === 'euclidean') {
        const dx = a.bounds.midX - b.bounds.midX;
        const dy = a.bounds.midY - b.bounds.midY;
        return Math.sqrt(dx * dx + dy * dy);
    } else if (astarHeuristicType === 'chebyshev') {
        return Math.max(
            Math.abs(a.bounds.midX - b.bounds.midX),
            Math.abs(a.bounds.midY - b.bounds.midY)
        );
    } else if (astarHeuristicType === 'diagonal') {
        const dx = Math.abs(a.bounds.midX - b.bounds.midX);
        const dy = Math.abs(a.bounds.midY - b.bounds.midY);
        const D = 1;
        const D2 = Math.sqrt(2);
        return D * (dx + dy) + (D2 - 2 * D) * Math.min(dx, dy);
    } else {
        throw new Error('Unsupported heuristic type');
    }
}

/**
 * Dijkstra 算法
 * @param {QuadTreeNode} start - 起点
 * @param {QuadTreeNode} end - 终点
 * @param {QuadTreeNode} root - 四叉树的根节点
 * @returns {{
 *   path: QuadTreeNode[] | null,
 *   steps: {
 *     current: QuadTreeNode,
 *     openSet: QuadTreeNode[],
 *     closedSet: QuadTreeNode[],
 *     neighbors: QuadTreeNode[]
 *   }[]
 * }}
 */
function dijkstra(start, end, root) {
    const openSet = [start];
    const closedSet = [];
    const steps = [];

    if (!start.isWalkable || !end.isWalkable) {
        return { path: null, steps };
    }

    start.gCost = 0;

    while (openSet.length > 0) {
        let currentIndex = 0;
        for (let i = 0; i < openSet.length; i++) {
            if (openSet[i].gCost < openSet[currentIndex].gCost) {
                currentIndex = i;
            }
        }
        const current = openSet[currentIndex];

        if (current === end) {
            const path = [];
            let temp = current;
            while (temp) {
                path.push(temp);
                temp = temp.parent;
            }
            steps.push({
                current,
                openSet: [...openSet],
                closedSet: [...closedSet],
                neighbors: [],
            });
            return { path: path.reverse(), steps };
        }

        openSet.splice(currentIndex, 1);
        closedSet.push(current);

        const neighbors = getNeighbors(current);
        for (const neighbor of neighbors) {
            if (!neighbor.isWalkable || closedSet.includes(neighbor)) {
                continue;
            }

            const dx = current.bounds.midX - neighbor.bounds.midX;
            const dy = current.bounds.midY - neighbor.bounds.midY;
            const tentativeGCost = current.gCost + Math.sqrt(dx * dx + dy * dy);

            if (!openSet.includes(neighbor)) {
                openSet.push(neighbor);
            } else if (tentativeGCost >= neighbor.gCost) {
                continue;
            }

            neighbor.parent = current;
            neighbor.gCost = tentativeGCost;
        }

        steps.push({
            current,
            openSet: [...openSet],
            closedSet: [...closedSet],
            neighbors: [...neighbors],
        });
    }

    return { path: null, steps };
}

module.exports = {
    aStar,
    dijkstra,
    getNeighbors,
    heuristic,
};