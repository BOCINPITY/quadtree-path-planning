<template>
  <div class="container">
    <div class="shapes">
      <div class="left-title">基本障碍物</div>
      <div class="shapes-container">
        <div
          class="shapes-item"
          v-for="shape in componentShapeList"
          :key="shape.name"
          @click="addObstacle(shape.type)"
        >
          <i :class="`icon iconfont ${shape.icon}`"></i>
          <div class="icon-name">{{ shape.name }}</div>
        </div>
      </div>
      <div class="title">我的云端地图</div>
      <div class="map-list">
        <el-select
          v-model="selectedMap"
          placeholder="请选择地图"
          @change="handleSelectMapChange"
        >
          <el-option
            v-for="item in mapList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          ></el-option>
        </el-select>
      </div>
    </div>

    <div class="content">
      <div class="algorithm">
        <el-text size="large">路径规划操作按钮</el-text>
        <el-button class="operation-item" type="primary"> 上一步 </el-button>
        <el-button class="operation-item" type="primary"> 播放 </el-button>
        <el-button class="operation-item" type="warning"> 暂停 </el-button>
        <el-button class="operation-item" type="primary"> 下一步 </el-button>
      </div>
      <div class="play-buttons">
        <el-text size="large">分割操作按钮</el-text>
        <el-button
          class="operation-item"
          type="primary"
          :disabled="currentStep === 0 || !hasAnimationSteps || isPlaying"
        >
          上一步
        </el-button>
        <el-button
          class="operation-item"
          type="success"
          @click="autoPlaySteps"
          :disabled="
            isAnimating || currentStep === animationSteps.length - 1 || !hasAnimationSteps
          "
        >
          播放
        </el-button>

        <el-button
          class="operation-item"
          type="warning"
          @click="togglePause"
          :disabled="!isPlaying || !hasAnimationSteps"
        >
          {{ "暂停" }}
        </el-button>

        <el-button
          class="operation-item"
          type="primary"
          @click="stepForward"
          :disabled="
            currentStep === animationSteps.length - 1 || !hasAnimationSteps || isPlaying
          "
        >
          下一步
        </el-button>
      </div>

      <div class="operation">
        <el-button class="operation-item" type="danger" @click="clearObstacles">
          清空
        </el-button>
        <el-button
          class="operation-item"
          type="primary"
          @click="() => (modalVisiable = true)"
        >
          保存并上传
        </el-button>
        <el-button
          class="operation-item"
          type="success"
          @click="visualizeQuadTreeWithAnimation"
        >
          四叉分割可视化
        </el-button>
        <el-button class="operation-item" type="primary" @click="handlePathFinding">
          寻路规划可视化
        </el-button>
      </div>
      <v-stage
        :config="stageConfig"
        style="background: #fff"
        @click="handleStageClick"
        @contextmenu="handleStageContextMenuClick($event)"
      >
        <v-layer id="baseLayer">
          <v-circle
            v-for="circle in circles"
            :key="circle.id"
            :config="circle"
            @dragstart="handleDragStart(circle)"
            @dragend="handleDragEnd($event, circle)"
            @dragmove="onDragMove($event, circle)"
            @click="setActiveElement(circle)"
            @contextmenu="handleElementContextMenu($event, circle)"
          />
          <v-rect
            v-for="rect in rectangles"
            :key="rect.id"
            :config="rect"
            @dragstart="handleDragStart(rect)"
            @dragend="handleDragEnd($event, rect)"
            @dragmove="onDragMove($event, rect)"
            @click="setActiveElement(rect)"
            @contextmenu="handleElementContextMenu($event, rect)"
          />
        </v-layer>
      </v-stage>
    </div>
    <div class="tool-box right">
      <div class="right-title">工具箱</div>
      <div class="title">地图相关</div>
      <div class="map-props">
        <div class="props-item">
          <div class="label">地图宽度:W</div>
          <el-input type="number" v-model.number="stageConfig.width" />
        </div>
        <div class="props-item">
          <div class="label">地图高度:H</div>
          <el-input type="number" v-model.number="stageConfig.height" />
        </div>
      </div>

      <div class="title">当前选中元素</div>
      <div class="current-element">
        <div class="name">
          {{ getSelectedElementName() }}
        </div>

        <div class="props-item">
          <div class="label">Position:X</div>
          <el-input type="number" v-model.number="selectedElement.x" />
        </div>
        <div class="props-item">
          <div class="label">Position:Y</div>
          <el-input type="number" v-model.number="selectedElement.y" />
        </div>
        <div class="props-item" v-show="selectedElement.type === 'circle'">
          <div class="label">半径</div>
          <el-input type="number" v-model.number="selectedElement.radius" />
        </div>
        <div class="props-item" v-show="selectedElement.type === 'rectangle'">
          <div class="label">宽度</div>
          <el-input type="number" v-model.number="selectedElement.width" />
        </div>
        <div class="props-item" v-show="selectedElement.type === 'rectangle'">
          <div class="label">高度</div>
          <el-input type="number" v-model.number="selectedElement.height" />
        </div>
        <div class="props-item">
          <div class="label">填充颜色</div>
          <el-color-picker v-model.trim="selectedElement.fill" />
        </div>
      </div>
      <div class="title">四叉树分割相关</div>
      <div class="params">
        <div class="props-item center-point">
          <div class="label">分割最小阈值</div>
          <el-input type="number" v-model.number="minThreshold" />
        </div>
        <div class="props-item">
          <div class="label">分割线颜色</div>
          <el-color-picker v-model.trim="dividColor" />
        </div>
        <div class="props-item">
          <div class="label">单步动画时长(秒)</div>
          <el-input-number v-model="animationDuration" :min="0.1" :max="3" :step="0.1" />
        </div>
        <div class="props-item">
          <div class="label">是否显示区域中线点</div>
          <el-switch v-model="showCenterPoint" />
        </div>
        <div class="props-item">
          <div v-if="showCenterPoint">
            <span class="label">中心点半径</span>
            <el-input-number
              v-model="centerPointsConfig.radius"
              :min="1"
              :max="5"
              :step="1"
            />
          </div>
        </div>
        <div class="props-item">
          <div v-if="showCenterPoint">
            <span class="label">中心点颜色</span>
            <el-color-picker v-model.trim="centerPointsConfig.fill" />
          </div>
        </div>
        <div class="props-item">
          <div v-if="showCenterPoint">
            <span class="label">中心点边框颜色</span>
            <el-color-picker v-model.trim="centerPointsConfig.stroke" />
          </div>
        </div>
        <div class="props-item">
          <div v-if="showCenterPoint">
            <span class="label">中心点边框宽度</span>
            <el-input-number
              v-model="centerPointsConfig.strokeWidth"
              :min="1"
              :max="3"
              :step="1"
            />
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="showContextMenu"
      class="custom-context-menu"
      :style="{
        left: `${contextMenuX}px`,
        top: `${contextMenuY}px`,
      }"
    >
      <el-menu class="custom-el-menu">
        <el-menu-item @click="deleteElement(selectedContextElement)">删除</el-menu-item>
        <el-menu-item @click="copyElement(selectedContextElement)">复制</el-menu-item>
      </el-menu>
    </div>

    <div
      v-if="showStageContextMenu"
      class="custom-context-menu"
      :style="{
        left: `${contextMenuX}px`,
        top: `${contextMenuY}px`,
      }"
    >
      <el-menu class="custom-el-menu">
        <el-menu-item @click="setStartPoint">设置起点</el-menu-item>
        <el-menu-item @click="setEndPoint">设置终点</el-menu-item>
      </el-menu>
    </div>
  </div>
  <el-dialog
    v-model="modalVisiable"
    title="地图信息"
    width="20%"
    :close-on-click-modal="false"
    :show-close="false"
    :before-close="handleClose"
  >
    <el-form
      class="map-info-form"
      label-width="80px"
      ref="mapInfoFormRef"
      :model="mapInfo"
      :rules="rules"
    >
      <el-form-item label="地图名称" prop="name">
        <el-input v-model="mapInfo.name" placeholder="请输入地图名称"></el-input>
      </el-form-item>
      <el-form-item label="地图描述" prop="description">
        <el-input
          type="textarea"
          v-model="mapInfo.description"
          placeholder="请输入地图描述"
        ></el-input>
      </el-form-item>
      <div class="modal-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave(mapInfoFormRef)">保存</el-button>
      </div>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import type { IComponentShapeType } from "@/@types/";
import { componentShapeList } from "@/utils/shapeIcons";
import Konva from "konva";
import type { QuadTreeNode } from "@/utils/quadTree";
import type { GetMapListDto } from "@/http/map";
import { createMap, getMapList } from "@/http/map";
import type { FormInstance } from "element-plus";
import type { Obstacles, SelectedObstaclesDto } from "@/@types/dto";
import { buildQuadTreeFrontend } from "@/utils/quadTree";
import { ElMessage } from "element-plus";
import { gsap } from "gsap";
import { v4 as uuidv4 } from "uuid";
import startIcon from "@/assets/images/startpoint.png";
import endIcon from "@/assets/images/endpoint.png";
const startPoint = ref<{ x: number; y: number } | null>(null);
const endPoint = ref<{ x: number; y: number } | null>(null);
const startShape = ref<Konva.Image | null>(null);
const endShape = ref<Konva.Image | null>(null);
// 定义图片对象
const startImageObj = new window.Image();
const endImageObj = new window.Image();
const showContextMenu = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const selectedContextElement = ref<Obstacles | null>(null);
//路径图形
const pathShape = ref<Konva.Line | null>(null);
const showCenterPoint = ref(false);
const centerPointsConfig = ref<Konva.CircleConfig>({
  radius: 2,
  fill: "#0077ff",
  stroke: "#000",
  strokeWidth: 1,
});
const showStageContextMenu = ref(false);
const mapInfoFormRef = ref<FormInstance>();
const tempLayer = ref(new Konva.Layer());
const persistentLayer = new Konva.Layer();
const mapList = ref<GetMapListDto[]>();
const modalVisiable = ref(false);
const animationDuration = ref(0.5);
const rules = {
  name: [{ required: true, message: "地图名称不能为空", trigger: "blur" }],
  description: [{ required: true, message: "地图描述不能为空", trigger: "blur" }],
};
const animationSteps = ref<QuadTreeNode[]>([]);
const currentStep = ref(0);
const isAnimating = ref(false);
const isPlaying = ref(false);
const isPaused = ref(false);
const generateId = () => {
  return uuidv4();
};
const heuristic = (a: QuadTreeNode, b: QuadTreeNode) => {
  return (
    Math.abs(a.bounds.midX - b.bounds.midX) + Math.abs(a.bounds.midY - b.bounds.midY)
  );
};
const findNodeContainingPoint = (
  root: QuadTreeNode,
  x: number,
  y: number
): QuadTreeNode | null => {
  if (!root.isLeaf) {
    for (const child of root.children!) {
      const node = findNodeContainingPoint(child, x, y);
      if (node) {
        return node;
      }
    }
  } else {
    const bounds = root.bounds;
    if (
      x >= bounds.x &&
      x <= bounds.x + bounds.width &&
      y >= bounds.y &&
      y <= bounds.y + bounds.height
    ) {
      return root;
    }
  }
  return null;
};

// 获取相邻节点
const getNeighbors = (node: QuadTreeNode, root: QuadTreeNode): QuadTreeNode[] => {
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
};

// A* 路径规划算法
const aStar = (
  start: QuadTreeNode,
  end: QuadTreeNode,
  root: QuadTreeNode
): QuadTreeNode[] | null => {
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
};

const handlePathFinding = () => {
  if (!startPoint.value || !endPoint.value) {
    ElMessage.warning("请先设置起点和终点");
    return;
  }

  const { width, height } = stageConfig.value;
  const quadTree = buildQuadTreeFrontend({
    width,
    height,
    obstacles: obstacles.value,
    minThreshold: minThreshold.value,
  });

  const startNode = findNodeContainingPoint(
    quadTree,
    startPoint.value.x,
    startPoint.value.y
  );
  const endNode = findNodeContainingPoint(quadTree, endPoint.value.x, endPoint.value.y);

  if (startNode && endNode) {
    const path = aStar(startNode, endNode, quadTree);
    if (path) {
      console.log("找到路径:", path);
      // 可以在这里将路径可视化
      visualizePath(path); // 调用可视化路径方法
    } else {
      console.log("未找到路径");
      ElMessage.warning("未找到可行路径");
    }
  }
};
// 可视化路径方法
const visualizePath = (path: QuadTreeNode[]) => {
  const stage = Konva.stages[0];
  if (!stage) return;

  const baseLayer = stage.getLayers().find((layer) => layer.id() === "baseLayer");
  if (!baseLayer) return;

  // 清除之前的路径图形
  if (pathShape.value) {
    pathShape.value.destroy();
  }

  // 生成路径点数组
  const points: number[] = [];
  path.forEach((node) => {
    points.push(node.bounds.midX, node.bounds.midY);
  });

  // 创建路径图形
  pathShape.value = new Konva.Line({
    points,
    stroke: "blue",
    strokeWidth: 3,
    lineCap: "round",
    lineJoin: "round",
  });

  // 将路径图形添加到 baseLayer 并绘制
  baseLayer.add(pathShape.value as Konva.Line);
  baseLayer.batchDraw();
};
const handleClose = () => (modalVisiable.value = false);
// 处理元素右键点击事件，显示菜单
const handleElementContextMenu = (
  e: Konva.KonvaEventObject<MouseEvent>,
  el: Obstacles | null = null
) => {
  e.evt.preventDefault();
  if (el) {
    setActiveElement(el);
    selectedContextElement.value = el;
  } else {
    selectedContextElement.value = null;
  }
  contextMenuX.value = e.evt.clientX;
  contextMenuY.value = e.evt.clientY;
  showContextMenu.value = true;
};
// 删除元素
const deleteElement = (element: Obstacles | null) => {
  if (element) {
    const index = obstacles.value.findIndex((item) => item.id === element.id);
    if (index !== -1) {
      obstacles.value.splice(index, 1);
    }
    showContextMenu.value = false;
  }
}; // 复制元素
const copyElement = (element: Obstacles | null) => {
  console.log("copy le");
  if (element) {
    const newElement = {
      ...element,
      id: generateId(),
      x: element.x + 10, // 稍微偏移避免重叠
      y: element.y + 10,
    };
    obstacles.value.push(newElement);
    showContextMenu.value = false;
  }
};

const handleSelectMapChange = async (id: number) => {
  clearCanvans();
  const obstaclesData = mapList.value?.find((item) => item.id === id)?.obstacles;
  if (obstaclesData) {
    obstacles.value = obstaclesData.map((v) => ({
      ...v,
      draggable: true,
      isDraging: false,
      isActive: false,
    }));
  }
};

const hasAnimationSteps = computed(() => animationSteps.value.length > 0);

const handleSave = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (valid) {
      const { name, description } = mapInfo.value;
      const params = {
        name,
        description,
        width: stageConfig.value.width,
        height: stageConfig.value.height,
        obstacles: [...obstacles.value],
        minThreshold: minThreshold.value,
        dividColor: dividColor.value,
      };
      await createMap(params);
      ElMessage({
        type: "success",
        message: "地图保存成功",
      });
      mapList.value = await getMapList();
      modalVisiable.value = false;
    }
  });
};

const stageConfig = ref({
  width: 820,
  height: 580,
});

const mapInfo = ref<{ name: string; description: string }>({ name: "", description: "" });
const selectedMap = ref<number>();

onMounted(async () => {
  mapList.value = await getMapList();
  Konva.stages[0]?.add(persistentLayer);
  // 加载图片
  startImageObj.src = startIcon;
  endImageObj.src = endIcon;
});

/**
 *
 * @param event 鼠标点击事件
 * @description 点击空白区域时，清除选中元素
 */
const handleStageClick = (event: Konva.KonvaEventObject<MouseEvent>) => {
  if (event.target === event.target.getStage()) {
    clearActiveElement();
    resetSelectedElement();
    showContextMenu.value = false;
    showStageContextMenu.value = false;
  }
};
const handleStageContextMenuClick = (event: Konva.KonvaEventObject<MouseEvent>) => {
  // 检查是否点击的是舞台空白处
  if (event.target === event.target.getStage()) {
    event.evt.preventDefault(); // 阻止浏览器默认右键菜单
    contextMenuX.value = event.evt.clientX;
    contextMenuY.value = event.evt.clientY;
    showStageContextMenu.value = true;
    showContextMenu.value = false; // 确保其他菜单隐藏
  }
};
const setStartPoint = () => {
  const stage = Konva.stages[0];
  if (stage) {
    const pos = stage.getPointerPosition();
    if (pos) {
      startPoint.value = { x: pos.x, y: pos.y };
      if (startShape.value) {
        startShape.value.destroy();
      }
      startShape.value = new Konva.Image({
        //图标的最下边中心点为坐标原点
        x: pos.x,
        y: pos.y,
        image: startImageObj,
        width: startImageObj.width,
        height: startImageObj.height,

        name: "startPoint",
      });
      const baseLayer = stage.getLayers().find((layer) => {
        if (layer.id() === "baseLayer") {
          return layer as Konva.Layer;
        }
      });

      baseLayer?.add(startShape.value as Konva.Image);
      baseLayer?.batchDraw();
    }
  }
  showStageContextMenu.value = false;
  showContextMenu.value = false;
};
// 设置终点
const setEndPoint = () => {
  const stage = Konva.stages[0];
  if (stage) {
    const pos = stage.getPointerPosition();
    if (pos) {
      endPoint.value = { x: pos.x, y: pos.y };
      if (endShape.value) {
        endShape.value.destroy();
      }
      endShape.value = new Konva.Image({
        x: pos.x - endImageObj.width / 2, // 使图标中心对准点击位置
        y: pos.y - endImageObj.height / 2,
        image: endImageObj,
        width: endImageObj.width,
        height: endImageObj.height,

        name: "endPoint",
      });
      const baseLayer = stage.getLayers().find((layer) => {
        if (layer.id() === "baseLayer") {
          return layer as Konva.Layer;
        }
      });
      baseLayer?.add(endShape.value as Konva.Image);
      baseLayer?.batchDraw();
    }
  }
  showStageContextMenu.value = false;
  showContextMenu.value = false;
};
const minThreshold = ref<number>(20);
const dividColor = ref<string>("#0077ff");

const selectedElement = ref<SelectedObstaclesDto>({
  id: "",
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  radius: 0,
  fill: "#000",
  stroke: "#0077ff",
  strokeWidth: 2,
  type: "",
  isActive: false,
  isDraging: false,
  draggable: true,
});

const obstacles = ref<Obstacles[]>([]);

const circles = computed(() => obstacles.value.filter((item) => item.type === "circle"));
const rectangles = computed(() =>
  obstacles.value.filter((item) => item.type === "rectangle")
);

const getSelectedElementName = () => {
  const matchedItem = componentShapeList.find(
    (item) => item.type === selectedElement.value.type
  );
  return matchedItem?.name || "当前无选中障碍物";
};

const autoPlaySteps = async () => {
  if (isPlaying.value) return;
  isPlaying.value = true;
  isPaused.value = false;

  while (currentStep.value < animationSteps.value.length - 1 && !isPaused.value) {
    await stepForward();
    await new Promise((resolve) => {
      if (!isAnimating.value) resolve(true);
      const check = setInterval(() => {
        if (!isAnimating.value) {
          clearInterval(check);
          resolve(true);
        }
      }, 100);
    });
  }
  if (!isPaused.value) {
    ElMessage({
      type: "success",
      message: "分割完成",
    });
  }
  isPlaying.value = false;
};
// 监听 selectedElement 的变化
watch(
  selectedElement,
  (newValue) => {
    if (newValue.id) {
      const index = obstacles.value.findIndex((item) => item.id === newValue.id);
      if (index !== -1) {
        obstacles.value[index] = {
          ...obstacles.value[index],
          x: newValue.x,
          y: newValue.y,
          width: newValue.width,
          height: newValue.height,
          radius: newValue.radius,
          fill: newValue.fill,
          stroke: newValue.stroke,
          strokeWidth: newValue.strokeWidth,
          isDraging: newValue.isDraging,
          isActive: newValue.isActive,
        };
      }
    }
  },
  { deep: true }
);
const togglePause = () => {
  isPaused.value = !isPaused.value;
  if (!isPaused.value && currentStep.value < animationSteps.value.length - 1) {
    autoPlaySteps();
  }
};
const setActiveElement = (el: Obstacles) => {
  clearActiveElement();
  const element = obstacles.value.find((item) => item.id === el.id);
  if (element) {
    element.isDraging = true;
    element.stroke = "#0077ff";
    element.strokeWidth = 4;
    element.isActive = true;
    selectedElement.value = { ...element };
  }
};
const clearActiveElement = () => {
  obstacles.value.map((item) => {
    if (item.isActive) {
      item.isDraging = false;
      item.stroke = "#000";
      item.strokeWidth = 0;
      item.isActive = false;
    }
  });
};

const handleDragStart = (el: Obstacles) => {
  setActiveElement(el);
};

const handleDragEnd = (event: Konva.KonvaEventObject<DragEvent>, el: Obstacles) => {
  //更新obstacles的位置信息
  const shape = event.target;
  const { x, y } = shape.getAbsolutePosition();
  const { id } = shape.attrs;
  const index = obstacles.value.findIndex((item) => item.id === id);
  if (index !== -1) {
    obstacles.value[index] = {
      ...obstacles.value[index],
      x,
      y,
    };
  }
  //清除选中状态
  clearActiveElement();
};
/**
 * @description: 重置选中元素
 * @return void
 */
const resetSelectedElement = () => {
  selectedElement.value = {
    id: "",
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    radius: 0,
    fill: "#000",
    stroke: "#000",
    strokeWidth: 0,
    type: "",
    isActive: false,
    isDraging: false,
    draggable: true,
  };
};

/**
 * @description: 移动障碍物,更新obstacles的位置信息
 */
const onDragMove = (event: Konva.KonvaEventObject<DragEvent>, el: Obstacles) => {
  setActiveElement(el);
  const shape = event.target;
  const { x, y } = shape.getAbsolutePosition();
  const { id } = shape.attrs;
  const index = obstacles.value.findIndex((item) => item.id === id);
  if (index !== -1) {
    obstacles.value[index] = {
      ...obstacles.value[index],
      x,
      y,
    };
    selectedElement.value = {
      ...obstacles.value[index],
    };
  }
};

const allObstacles = computed<Obstacles[]>(() => {
  return [...circles.value, ...rectangles.value];
});

const generateQuadTreeSteps = (root: QuadTreeNode): QuadTreeNode[] => {
  const steps: QuadTreeNode[] = [];
  const queue: QuadTreeNode[] = [root];

  while (queue.length > 0) {
    const node = queue.shift()!;
    steps.push({ ...node });
    if (!node.isLeaf && node.children) {
      queue.push(...node.children);
    }
  }
  return steps;
};

const stepForward = () => {
  return new Promise<void>((resolve) => {
    if (currentStep.value < animationSteps.value.length - 1) {
      currentStep.value++;
      visualizeCurrentStep().then(resolve);
    } else {
      resolve();
    }
  });
};

const stepBackward = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
    visualizeCurrentStep();
  }
};

const visualizeQuadTreeWithAnimation = () => {
  clearCanvans();
  const { width, height } = stageConfig.value;
  const quadTree = buildQuadTreeFrontend({
    width,
    height,
    obstacles: allObstacles.value,
    minThreshold: minThreshold.value,
  });

  animationSteps.value = generateQuadTreeSteps(quadTree);
  currentStep.value = 0;
  isPlaying.value = false;
  isPaused.value = false;
  visualizeCurrentStep();
};

const createDividingLine = (points: number[], color: string) => {
  return new Konva.Line({
    points,
    stroke: color,
    strokeWidth: 1,
  });
};

const createCenterPoint = (x: number, y: number, isLeaf: boolean) => {
  return new Konva.Circle({
    x,
    y,
    radius: centerPointsConfig.value.radius,
    fill: isLeaf ? centerPointsConfig.value.fill : "red",
    stroke: centerPointsConfig.value.stroke,
    strokeWidth: centerPointsConfig.value.strokeWidth,
  });
};

const visualizeCurrentStep = async () => {
  return new Promise<void>((resolve) => {
    if (isAnimating.value) return;

    const stage = Konva.stages[0];
    tempLayer.value.destroyChildren();
    stage?.add(tempLayer.value as Konva.Layer);

    const currentNode = animationSteps.value[currentStep.value];
    if (!currentNode) {
      resolve();
      return;
    }

    const { bounds, isLeaf } = currentNode;
    const { x, y, width, height, midX, midY } = bounds;

    isAnimating.value = true;

    const tl = gsap.timeline();
    const currentLayer = currentStep.value === 0 ? persistentLayer : tempLayer.value;

    if (!isLeaf) {
      const hLine = createDividingLine([x, midY, x, midY], dividColor.value);
      currentLayer.add(hLine);
      tl.to(hLine.points(), {
        duration: animationDuration.value,
        endArray: [x, midY, x + width, midY],
        onUpdate: () => hLine.getLayer()?.batchDraw() as void,
      });

      const vLine = createDividingLine([midX, y, midX, y], dividColor.value);
      currentLayer.add(vLine);
      tl.to(
        vLine.points(),
        {
          duration: animationDuration.value,
          endArray: [midX, y, midX, y + height],
          onUpdate: () => vLine.getLayer()?.batchDraw() as void,
        },
        "<"
      );
    }
    if (showCenterPoint.value) {
      const centerPoint = createCenterPoint(midX, midY, isLeaf);
      currentLayer.add(centerPoint);
      tl.fromTo(
        centerPoint,
        { radius: 0 },
        { radius: 3, duration: animationDuration.value / 2 },
        "<0.1"
      );
    }

    tl.eventCallback("onComplete", () => {
      isAnimating.value = false;
      tempLayer.value.destroyChildren();
      drawPersistentElements();
      resolve();
    });
  });
};

const drawPersistentElements = () => {
  persistentLayer.destroyChildren();
  animationSteps.value.slice(0, currentStep.value + 1).forEach((node) => {
    const { bounds, isLeaf } = node;
    const { midX, midY } = bounds;

    if (!isLeaf) {
      persistentLayer.add(
        createDividingLine(
          [bounds.x, midY, bounds.x + bounds.width, midY],
          dividColor.value
        )
      );
      persistentLayer.add(
        createDividingLine(
          [midX, bounds.y, midX, bounds.y + bounds.height],
          dividColor.value
        )
      );
    }
    if (showCenterPoint.value) {
      persistentLayer.add(createCenterPoint(midX, midY, isLeaf));
    }
  });

  if (!persistentLayer.getParent() && Konva.stages[0]) {
    Konva.stages[0].add(persistentLayer);
  }
};

const clearCanvans = () => {
  const stage = Konva.stages[0];
  if (stage) {
    stage.getLayers().forEach((layer) => {
      if (
        layer.id() !== "baseLayer" &&
        layer !== persistentLayer &&
        layer !== tempLayer.value
      ) {
        layer.destroy();
      }
    });
    stage.batchDraw();
  }
};

const initializeState = () => {
  obstacles.value = [];
  animationSteps.value = [];
  currentStep.value = 0;
  dividColor.value = "#0077ff";
  minThreshold.value = 20;
  resetSelectedElement();
  clearCanvans();
  persistentLayer.destroyChildren();
  tempLayer.value.destroyChildren();
};

const clearObstacles = () => {
  initializeState();
};

const addObstacle = (type: IComponentShapeType) => {
  let newObstacle: Obstacles;
  const commonProps = {
    fill: "#000",
    stroke: "#000",
    strokeWidth: 0,
    id: generateId(),
    draggable: true, // 添加 draggable 属性
    isDraging: false, // 添加 isDraging 属性
    isActive: false,
  };
  if (type === "circle") {
    newObstacle = {
      ...commonProps,
      type,
      radius: 50,
      x: 100,
      y: 100,
    };
    obstacles.value.push(newObstacle);
  } else if (type === "rectangle") {
    newObstacle = {
      ...commonProps,
      type,
      width: 100,
      height: 100,
      x: 200,
      y: 150,
    };
    obstacles.value.push(newObstacle);
  }
};
</script>

<style scoped>
.title {
  font-size: 16px;
  padding: 5px;
  text-align: center;
  background-color: var(--primary-color);
  font-weight: 500;
}
.right-title,
.left-title {
  text-align: left;
  background-color: #3f3f3f;
  font-size: 18px;
  font-weight: bold;
  padding: 20px;
}
.left {
  border-right: 1px solid var(--border-color);
}
.map-list {
  display: flex;
  margin: 10px;
  flex-direction: column;
  gap: 10px;
  background-color: white;
  padding: 10px;
  border-radius: 16px;
}
.right {
  border-left: 1px solid var(--border-color);
}
.map-info-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.map-info-form .modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
.container {
  background-color: #f0f0f0;
  color: white;
  font-size: 14px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  display: flex;
  flex-direction: row;
}
.container .shapes {
  max-width: 200px;
  display: flex;
  flex-direction: column;
}
.container .shapes .shapes-container {
  display: flex;
  flex-wrap: wrap;
}
.container .shapes .shapes-container .shapes-item {
  color: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 75px;
  height: 75px;
  margin: 10px;
  border-radius: 4px;
  cursor: pointer;
}
.container .shapes .shapes-container .shapes-item .icon {
  font-size: 48px;
}
.container .shapes .shapes-container .shapes-item .icon-name {
  font-size: 12px;
  margin-top: 5px;
}
.container .shapes .shapes-container .shapes-item:hover {
  transition: all 0.5s;
  background-color: var(--link-hover-color);
  border: 1px solid var(--border-color);
}
.container .content {
  background-color: #c7e9ff;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 960px;
  min-height: 800px;
  position: relative;
}
.container .content .play-buttons {
  background-color: #fff;
  position: absolute;
  z-index: 1000;
  top: 0px;
  padding: 10px;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  right: 0;
  display: flex;
  gap: 10px;
  flex-direction: column;
}
.container .content .algorithm {
  background-color: #fff;
  position: absolute;
  z-index: 1000;
  top: 0px;
  padding: 10px;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  left: 0;
  display: flex;
  gap: 10px;
  flex-direction: column;
}
.container .content .operation-item {
  padding: 10px;
  font-size: 16px;
  margin: 10px;
}
.container .content .operation {
  position: absolute;
  z-index: 1000;
  right: 0;
  bottom: 0;
  display: flex;
}
.container .tool-box {
  min-width: 300px;
  background-color: #f0f0f0;
  display: flex;
  flex-direction: column;
}
.container .tool-box .props-item {
  color: #000;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.container .tool-box .props-item .label {
  min-width: 100px;
  font-size: 14px;
  margin-right: 10px;
}
.container .tool-box .map-props,
.container .tool-box .params,
.container .tool-box .current-element {
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: start;
  gap: 10px;
  margin: 10px;
  padding: 10px;
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  max-height: 300px;
  overflow-y: scroll;
}
.container .tool-box .map-props .name,
.container .tool-box .params .name,
.container .tool-box .current-element .name {
  text-align: center;
  color: #000;
}
.shape {
  cursor: pointer;
  padding: 10px;
  margin: 5px 0;
  background-color: var(--primary-color);
  border: 1px solid #ccc;
  text-align: center;
  border-radius: 4px;
}
.shape:hover {
  background-color: #d0d0d0;
}
/* 自定义右键菜单容器样式 */
.custom-context-menu {
  position: absolute;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  min-width: 120px;
  height: 5rem;
}

/* 自定义 Element Plus 菜单样式 */
.custom-el-menu {
  border: none;
  background: transparent;
}

.custom-el-menu .el-menu-item {
  height: 40px;
  line-height: 40px;
  padding: 0 20px;
  color: #333333;
  font-size: 14px;
}

.custom-el-menu .el-menu-item:hover {
  background-color: #f5f7fa;
  color: #409eff;
}
</style>
