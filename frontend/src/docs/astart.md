# 基于四叉树结构的 A* 寻路算法思路
## 一、整体概述
在地图编辑器中，利用四叉树对地图进行空间划分，结合 A* 算法实现高效的路径规划。四叉树将地图划分为不同层次的节点，每个节点代表一个矩形区域，通过判断节点内是否存在障碍物来确定该区域是否可通行。A* 算法则基于四叉树节点，在可通行区域中搜索从起点到终点的最短路径。

## 二、四叉树构建
### 1. 节点定义
四叉树节点包含以下关键信息：

- bounds ：节点所代表矩形区域的边界信息，包括 x 、 y 坐标， width 和 height 尺寸，以及 midX 和 midY 中心点坐标。
- isLeaf ：标记节点是否为叶子节点。
- children ：若不是叶子节点，存储四个子节点。
- obstacleCount ：节点内包含的障碍物数量。
- isWalkable ：根据障碍物数量判断节点是否可通行。
- gCost 、 hCost 、 fCost ：A* 算法所需的代价信息。
- parent ：A* 算法中用于回溯路径的父节点。
### 2. 构建过程
- 输入地图的宽度、高度、障碍物列表和最小分割阈值。
- 递归地将地图区域分割为四个子区域，直到满足以下条件之一停止分割：
  - 区域内没有障碍物。
  - 区域尺寸小于最小分割阈值。
  - 四个子节点都包含障碍物（避免无意义的分割）。
## 三、A* 寻路算法
### 1. 启发函数
使用曼哈顿距离作为启发函数，计算节点到目标节点的预估代价。公式为：

```typescript
const heuristic = (a: QuadTreeNode, b: QuadTreeNode) => {
  return Math.abs(a.bounds.midX - b.bounds.midX) + Math.abs(a.bounds.midY - b.bounds.midY);
};
 ```
```

### 2. 查找包含指定点的节点
通过递归遍历四叉树，找到包含起点和终点的节点。

```typescript
const findNodeContainingPoint = (root: QuadTreeNode, x: number, y: number): QuadTreeNode | null => {
  if (!root.isLeaf) {
    for (const child of root.children!) {
      const node = findNodeContainingPoint(child, x, y);
      if (node) {
        return node;
      }
    }
  } else {
    const bounds = root.bounds;
    if (x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height) {
      return root;
    }
  }
  return null;
};
 ```
```

### 3. 获取相邻节点
对于当前节点，根据其位置和四叉树结构，找出其上下左右四个方向的相邻可通行节点。

```typescript
function getNeighbors(node: QuadTreeNode, root: QuadTreeNode): QuadTreeNode[] {
  const neighbors: QuadTreeNode[] = [];
  const bounds = node.bounds;
  const directions = [
    { dx: -1, dy: 0 }, // 左
    { dx: 1, dy: 0 }, // 右
    { dx: 0, dy: -1 }, // 上
    { dx: 0, dy: 1 }, // 下
  ];

  for (const dir of directions) {
    const neighborX = bounds.midX + dir.dx * bounds.width;
    const neighborY = bounds.midY + dir.dy * bounds.height;
    const neighbor = findNodeContainingPoint(root, neighborX, neighborY);
    if (neighbor && neighbor.isWalkable) {
      neighbors.push(neighbor);
    }
  }
  return neighbors;
}
 ```
```

### 4. A* 算法核心逻辑
- 初始化开放列表 openSet 和关闭列表 closedSet ，将起点加入开放列表。
- 循环处理开放列表，直到找到终点或开放列表为空：
  - 从开放列表中选择 fCost 最小的节点作为当前节点。
  - 若当前节点是终点，通过回溯父节点生成路径。
  - 将当前节点从开放列表移除，加入关闭列表。
  - 遍历当前节点的相邻节点，更新其代价信息并加入开放列表。
```typescript
function aStar(start: QuadTreeNode, end: QuadTreeNode, root: QuadTreeNode): QuadTreeNode[] | null {
  const openSet: QuadTreeNode[] = [start];
  const closedSet: QuadTreeNode[] = [];

  start.gCost = 0;
  start.hCost = heuristic(start, end);
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

    if (current === end) {
      const path: QuadTreeNode[] = [];
      let temp = current;
      while (temp) {
        path.push(temp);
        temp = temp.parent!;
      }
      return path.reverse();
    }

    openSet.splice(currentIndex, 1);
    closedSet.push(current);

    const neighbors = getNeighbors(current, root);
    for (const neighbor of neighbors) {
      if (closedSet.includes(neighbor)) {
        continue;
      }

      const tentativeGCost = current.gCost! + heuristic(current, neighbor);
      if (!openSet.includes(neighbor)) {
        openSet.push(neighbor);
      } else if (tentativeGCost >= neighbor.gCost!) {
        continue;
      }

      neighbor.parent = current;
      neighbor.gCost = tentativeGCost;
      neighbor.hCost = heuristic(neighbor, end);
      neighbor.fCost = neighbor.gCost + neighbor.hCost;
    }
  }

  return null;
}
 ```
```

## 四、路径规划流程
1. 获取地图的宽度、高度、障碍物列表和最小分割阈值，构建四叉树。
2. 确定起点和终点的坐标，找到包含起点和终点的四叉树节点。
3. 调用 A* 算法在四叉树节点中搜索路径。
4. 若找到路径，可将路径可视化展示；若未找到，提示用户。
```typescript
const handlePathFinding = () => {
  const { width, height } = stageConfig.value;
  const quadTree = buildQuadTreeFrontend({
    width,
    height,
    obstacles: obstacles.value,
    minThreshold: minThreshold.value,
  });

  const startNode = findNodeContainingPoint(quadTree, startPoint.x, startPoint.y);
  const endNode = findNodeContainingPoint(quadTree, endPoint.x, endPoint.y);

  if (startNode && endNode) {
    const path = aStar(startNode, endNode, quadTree);
    if (path) {
      console.log("找到路径:", path);
      // 可以在这里将路径可视化
    } else {
      console.log("未找到路径");
    }
  }
};
 ```
```

## 五、优势与应用场景
### 优势
- 空间划分高效 ：四叉树能根据地图的障碍物分布动态划分空间，减少不必要的计算。
- 路径搜索快速 ：A* 算法结合启发函数，能快速找到最短路径。
### 应用场景
- 游戏中的角色寻路。
- 机器人导航。
- 地图编辑器中的路径规划功能。