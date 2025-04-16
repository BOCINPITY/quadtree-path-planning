// 四叉树节点的数据结构
function createQuadTreeNode(x, y, width, height, obstacles, depth = 0) {
  return {
    x,
    y,
    width,
    height,
    centerX: x + width / 2,
    centerY: y + height / 2,
    isLeaf: true,
    obstacles: obstacles || [],
    depth
  };
}


// 动画控制器
class QuadTreeAnimator {
  constructor(containerId, rootNode) {
    this.stage = new Konva.Stage({
      container: containerId,
      width: rootNode.width,
      height: rootNode.height
    });

    this.layer = new Konva.Layer();
    this.stage.add(this.layer);

    this.rootNode = rootNode;
    this.currentStep = 0;
    this.animationId = null;
    this.isPlaying = false;

    this.initStage();
  }

  initStage() {
    this.drawNode(this.rootNode);
    this.drawObstacles(this.rootNode.obstacles);
    this.drawCenterPoint(this.rootNode);
  }

  drawNode(node) {
    const rect = new Konva.Rect({
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      stroke: 'rgba(0, 0, 0, 0.2)',
      strokeWidth: 1,
      dash: [2, 2]
    });

    this.layer.add(rect);
  }

  drawObstacles(obstacles) {
    obstacles.forEach(obstacle => {
      if (obstacle.radius !== undefined) {
        const circle = new Konva.Circle({
          x: obstacle.x,
          y: obstacle.y,
          radius: obstacle.radius,
          fill: obstacle.fill,
          stroke: obstacle.stroke,
          strokeWidth: obstacle.strokeWidth
        });
        this.layer.add(circle);
      } else if (obstacle.width !== undefined && obstacle.height !== undefined) {
        const rect = new Konva.Rect({
          x: obstacle.x,
          y: obstacle.y,
          width: obstacle.width,
          height: obstacle.height,
          fill: obstacle.fill,
          stroke: obstacle.stroke,
          strokeWidth: obstacle.strokeWidth
        });
        this.layer.add(rect);
      }
    });
  }

  drawCenterPoint(node) {
    const group = new Konva.Group();

    const centerCircle = new Konva.Circle({
      x: node.centerX,
      y: node.centerY,
      radius: 3,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 1
    });

    const text = new Konva.Text({
      x: node.centerX + 5,
      y: node.centerY - 5,
      text: `${node.centerX.toFixed(0)}, ${node.centerY.toFixed(0)}`,
      fontSize: 10,
      fontFamily: 'Arial',
      fill: 'black'
    });

    group.add(centerCircle);
    group.add(text);
    this.layer.add(group);
  }

  startAnimation() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.animate();
    }
  }

  pauseAnimation() {
    this.isPlaying = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  resetAnimation() {
    this.pauseAnimation();
    this.currentStep = 0;
    this.layer.destroyChildren();
    this.initStage();
  }

  animate() {
    if (this.currentStep === 0) {
      this.drawNode(this.rootNode);
      this.drawCenterPoint(this.rootNode);
    } else {
      this.animateStep(this.rootNode, this.currentStep);
    }

    this.currentStep++;
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  animateStep(node, step) {
    if (!node.children || node.children.length === 0) {
      return;
    }

    for (const child of node.children) {
      this.drawNode(child);
      this.drawCenterPoint(child);
      this.drawObstacles(child.obstacles);
    }

    for (const child of node.children) {
      this.animateStep(child, step);
    }
  }
}

// 构建四叉树
function buildQuadTree(width, height, minThreshold, obstacles) {
  const rootNode = createQuadTreeNode(0, 0, width, height, [...obstacles]);

  divideNode(rootNode, minThreshold);

  return rootNode;
}

// 递归分割节点
function divideNode(node, minThreshold) {
  if (node.width <= minThreshold || node.height <= minThreshold) {
    return;
  }

  if (node.obstacles.length === 0) {
    return;
  }

  node.isLeaf = false;

  const childWidth = node.width / 2;
  const childHeight = node.height / 2;

  const children = [
    createQuadTreeNode(node.x, node.y, childWidth, childHeight, [], (node.depth || 0) + 1),
    createQuadTreeNode(node.x + childWidth, node.y, childWidth, childHeight, [], (node.depth || 0) + 1),
    createQuadTreeNode(node.x, node.y + childHeight, childWidth, childHeight, [], (node.depth || 0) + 1),
    createQuadTreeNode(node.x + childWidth, node.y + childHeight, childWidth, childHeight, [], (node.depth || 0) + 1)
  ];

  node.children = children;

  for (const obstacle of node.obstacles) {
    for (const child of children) {
      if (isObstacleInRect(obstacle, child)) {
        child.obstacles.push(obstacle);
        break;
      }
    }
  }

  node.obstacles = [];

  for (const child of children) {
    divideNode(child, minThreshold);
  }
}

// 判断障碍物是否完全在矩形内
function isObstacleInRect(obstacle, rect) {
  if (obstacle.radius !== undefined) {
    const left = obstacle.x - obstacle.radius;
    const right = obstacle.x + obstacle.radius;
    const top = obstacle.y - obstacle.radius;
    const bottom = obstacle.y + obstacle.radius;

    return (
      left >= rect.x &&
      right <= rect.x + rect.width &&
      top >= rect.y &&
      bottom <= rect.y + rect.height
    );
  }

  if (obstacle.width !== undefined && obstacle.height !== undefined) {
    const left = obstacle.x;
    const right = obstacle.x + obstacle.width;
    const top = obstacle.y;
    const bottom = obstacle.y + obstacle.height;

    return (
      left >= rect.x &&
      right <= rect.x + rect.width &&
      top >= rect.y &&
      bottom <= rect.y + rect.height
    );
  }

  return false;
}

// 创建四叉树
const obstacles = [
  {
    x: 100,
    y: 100,
    radius: 30,
    fill: 'red',
    stroke: 'black',
    strokeWidth: 2,
    type: 'circle',
    draggable: false,
    isDraging: false
  },
  {
    x: 400,
    y: 300,
    width: 100,
    height: 50,
    fill: 'blue',
    stroke: 'black',
    strokeWidth: 2,
    type: 'rect',
    draggable: false,
    isDraging: false
  }
];

const quadTreeRoot = buildQuadTree(800, 600, 100, obstacles);

// 创建动画器
const animator = new QuadTreeAnimator('container', quadTreeRoot);

// 添加控制按钮
document.getElementById('start-btn').addEventListener('click', () => {
  animator.startAnimation();
});

document.getElementById('pause-btn').addEventListener('click', () => {
  animator.pauseAnimation();
});

document.getElementById('reset-btn').addEventListener('click', () => {
  animator.resetAnimation();
});
