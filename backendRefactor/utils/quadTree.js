

/**
 * @typedef {Object} QuadTreeNode
 * @property {Object} bounds - 节点的边界
 * @property {number} bounds.x - 边界的 x 坐标
 * @property {number} bounds.y - 边界的 y 坐标
 * @property {number} bounds.width - 边界的宽度
 * @property {number} bounds.height - 边界的高度
 * @property {number} bounds.midX - 边界的中心 x 坐标
 * @property {number} bounds.midY - 边界的中心 y 坐标
 * @property {boolean} isLeaf - 是否是叶子节点
 * @property {QuadTreeNode[]} [children] - 子节点
 * @property {number} obstacleCount - 障碍物数量
 * @property {boolean} isWalkable - 是否可通行
 * @property {number} [gCost] - 从起点到当前节点的成本
 * @property {number} [hCost] - 启发式成本
 * @property {number} [fCost] - 总成本 (gCost + hCost)
 * @property {QuadTreeNode} [parent] - 父节点
 * @property {QuadTreeNode[]} [neighbors] - 邻居节点
 */

/**
 * @typedef {Object} QuadTreeRequest
 * @property {number} width - 四叉树的宽度
 * @property {number} height - 四叉树的高度
 * @property {Obstacles[]} obstacles - 障碍物数组
 * @property {number} minThreshold - 最小分割阈值
 * @property {number} obstacleRatioThreshold - 障碍物比例阈值
 */

/**
 * @typedef {Object} Obstacles
 * @property {'circle'|'rectangle'} type - 障碍物类型
 * @property {number} x - 障碍物的 x 坐标
 * @property {number} y - 障碍物的 y 坐标
 * @property {number} [radius] - 圆形障碍物的半径
 * @property {number} [width] - 矩形障碍物的宽度
 * @property {number} [height] - 矩形障碍物的高度
 */

/**
 * 计算某个区域内的障碍物覆盖面积
 * @param {Obstacles[]} obstacles - 障碍物数组
 * @param {Object} bounds - 区域边界
 * @param {number} bounds.x - 区域的 x 坐标
 * @param {number} bounds.y - 区域的 y 坐标
 * @param {number} bounds.width - 区域的宽度
 * @param {number} bounds.height - 区域的高度
 * @returns {number} 障碍物覆盖的总面积
 */
function calculateObstacleAreaInBounds(obstacles, bounds) {
    return obstacles.reduce((totalArea, obstacle) => {
        if (obstacle.type === 'circle') {
            const circleX = obstacle.x;
            const circleY = obstacle.y;
            const radius = obstacle.radius;
            const closestX = Math.max(bounds.x, Math.min(circleX, bounds.x + bounds.width));
            const closestY = Math.max(bounds.y, Math.min(circleY, bounds.y + bounds.height));
            const distanceX = circleX - closestX;
            const distanceY = circleY - closestY;
            const isInside = distanceX * distanceX + distanceY * distanceY < radius * radius;
            return isInside ? totalArea + Math.PI * radius * radius : totalArea;
        } else {
            const rectX = obstacle.x;
            const rectY = obstacle.y;
            const rectW = obstacle.width;
            const rectH = obstacle.height;
            const overlapWidth = Math.max(0, Math.min(bounds.x + bounds.width, rectX + rectW) - Math.max(bounds.x, rectX));
            const overlapHeight = Math.max(0, Math.min(bounds.y + bounds.height, rectY + rectH) - Math.max(bounds.y, rectY));
            return totalArea + overlapWidth * overlapHeight;
        }
    }, 0);
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

/**
 * 构建四叉树
 * @param {QuadTreeRequest} request - 四叉树构建请求
 * @returns {QuadTreeNode} 四叉树的根节点
 */
function buildQuadTreeFrontend(request) {
    const { width, height, obstacles, minThreshold, obstacleRatioThreshold } = request;
    const allLeafNodes = [];

    /**
     * 递归构建四叉树
     * @param {number} x - 当前区域的 x 坐标
     * @param {number} y - 当前区域的 y 坐标
     * @param {number} w - 当前区域的宽度
     * @param {number} h - 当前区域的高度
     * @returns {QuadTreeNode} 构建的四叉树节点
     */
    function recursiveBuild(x, y, w, h) {
        const bounds = { x, y, width: w, height: h, midX: x + w / 2, midY: y + h / 2 };
        const obstacleArea = calculateObstacleAreaInBounds(obstacles, bounds);
        const totalArea = w * h;
        const obstacleRatio = obstacleArea / totalArea;

        const node = {
            bounds,
            isLeaf: true,
            obstacleCount: obstacleArea,
            isWalkable: obstacleRatio <= obstacleRatioThreshold,
        };

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
        ];
        node.isLeaf = false;
        node.children = children;
        return node;
    }

    const root = recursiveBuild(0, 0, width, height);

    // 为所有叶子节点计算邻居节点
    for (const node of allLeafNodes) {
        const neighbors = [];
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
 * 查找四叉树中包含特定点的节点
 * @param {QuadTreeNode} root - 四叉树的根节点
 * @param {number} x - 点的 x 坐标
 * @param {number} y - 点的 y 坐标
 * @returns {QuadTreeNode | null}
 */
function findNodeContainingPoint(root, x, y) {
    if (root.isLeaf) {
        const bounds = root.bounds;
        if (
            x >= bounds.x &&
            x <= bounds.x + bounds.width &&
            y >= bounds.y &&
            y <= bounds.y + bounds.height &&
            root.isWalkable
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
}
module.exports = {
    buildQuadTreeFrontend,
    calculateObstacleAreaInBounds,
    findNodeContainingPoint,
};