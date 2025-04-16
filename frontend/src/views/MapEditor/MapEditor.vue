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
          >四叉分割可视化</el-button
        >
        <el-button
          class="operation-item"
          type="warning"
          @click="stepBackward"
          :disabled="currentStep === 0"
          >上一步</el-button
        >
        <el-button
          class="operation-item"
          type="success"
          @click="stepForward"
          :disabled="currentStep === animationSteps.length - 1"
          >下一步</el-button
        >
      </div>
      <v-stage :config="stageConfig" style="background: #fff">
        <v-layer id="baseLayer">
          <v-circle
            v-for="circle in circles"
            :key="circle.id"
            :config="circle"
            @dragstart="handleDragStart(circle)"
            @dragend="handleDragEnd(circle)"
            @dragmove="onDragMove($event, circle)"
            @click="selectObstacle(circle)"
          />
          <v-rect
            v-for="rect in rectangles"
            :key="rect.id"
            :config="rect"
            @dragstart="handleDragStart(rect)"
            @dragend="handleDragEnd(rect)"
            @dragmove="onDragMove($event, rect)"
            @click="selectObstacle(rect)"
          />
        </v-layer>
      </v-stage>
    </div>
    <div class="tool-box right">
      <div class="right-title">工具箱</div>
      <div class="title">地图相关</div>
      <div class="map-props">
        <div class="props-item">
          <div class="label">地图高度:W</div>
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
          {{
            componentShapeList.filter((item: any) => item.type === selectedElement.type)[0]?.name
              ? componentShapeList.filter((item: any) => item.type === selectedElement.type)[0]
                  ?.name
              : '当前无选中障碍物'
          }}
        </div>

        <div class="props-item">
          <div class="label">Position:X</div>
          <el-input
            type="number"
            v-model.number="selectedElement.x"
            @input="updateSelectedElement"
          />
        </div>
        <div class="props-item">
          <div class="label">Position:Y</div>
          <el-input
            type="number"
            v-model.number="selectedElement.y"
            @input="updateSelectedElement"
          />
        </div>
        <div class="props-item" v-show="selectedElement.type === 'circle'">
          <div class="label">半径</div>
          <el-input
            type="number"
            v-model.number="selectedElement.radius"
            @input="updateSelectedElement"
          />
        </div>
        <div class="props-item" v-show="selectedElement.type === 'rectangle'">
          <div class="label">宽度</div>
          <el-input
            type="number"
            v-model.number="selectedElement.width"
            @input="updateSelectedElement"
          />
        </div>
        <div class="props-item" v-show="selectedElement.type === 'rectangle'">
          <div class="label">高度</div>
          <el-input
            type="number"
            v-model.number="selectedElement.height"
            @input="updateSelectedElement"
          />
        </div>
        <div class="props-item">
          <div class="label">填充颜色</div>
          <el-color-picker
            v-model.trim="selectedElement.fill"
            @change="updateSelectedElement"
          />
        </div>
      </div>
      <div class="title">四叉树分割相关</div>
      <div class="params">
        <div class="props-item">
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
      </div>
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
import { ref, onMounted, computed } from "vue";
import type { IComponentShapeType } from "@/@types/";
import { componentShapeList } from "@/utils/shapeIcons";
import Konva from "konva";
import type { QuadTreeNode } from "@/utils/quadTree";
import type { GetMapListDto } from "@/http/map";
import type { IFrame } from "konva/lib/types";
import { createMap, getMapList } from "@/http/map";
import type { FormInstance } from "element-plus";
import type { Obstacles } from "@/@types/dto";
import { QuadTreeAnimator } from "@/utils/QuadTreeAnimator";
import { buildQuadTreeFrontend } from "@/utils/quadTree";
import { gsap } from "gsap";
const mapInfoFormRef = ref<FormInstance>();
const tempLayer = ref(new Konva.Layer()); // 用于临时动画的图层
const persistentLayer = new Konva.Layer(); // 持久化图层
const mapList = ref<GetMapListDto[]>();
const modalVisiable = ref(false);
const animationDuration = ref(0.5); // 动画持续时间（秒）
const rules = {
  name: [{ required: true, message: "地图名称不能为空", trigger: "blur" }],
  description: [{ required: true, message: "地图描述不能为空", trigger: "blur" }],
};
const animationSteps = ref<QuadTreeNode[]>([]); // 存储每一步的分割状态
const currentStep = ref(0); // 当前步骤索引
const isAnimating = ref(false); // 是否正在动画中
const handleClose = () => (modalVisiable.value = false);
const handleSelectMapChange = async (id: number) => {
  //清空障碍物
  clearCanvans();
  //加载地图信息
  const obstaclesData = mapList.value?.find((item) => item.id === id)?.obstacles;
  if (obstaclesData) {
    obstacles.value = [
      ...obstaclesData.map((v) => ({ ...v, draggable: true, isDraging: false })),
    ];
  }
};

/**
 * 保存地图
 * @param formEl
 * @returns
 */
const handleSave = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
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
    } else {
      console.log("error submit!!", fields);
    }
  });
};
const stageConfig = ref({
  width: 820,
  height: 580,
});
const mapInfo = ref<{ name: string; description: string }>({ name: "", description: "" });
const selectedMap = ref<number>();
//加载我的地图列表
onMounted(async () => {
  const data = await getMapList();
  mapList.value = data;
  Konva.stages[0] && Konva.stages[0].add(persistentLayer);
});
//最小分割阈值
const minThreshold = ref<number>(20);
const dividColor = ref<string>("#0077ff");
const selectedElement = ref({
  id: "",
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  radius: 0,
  fill: "#000",
  stroke: "#0077ff",
  strokeWidth: 2,
  type: "circle",
});

const obstacles = ref<Obstacles[]>([]);
const circles = computed(() => {
  return obstacles.value.filter((item) => item.type === "circle");
});
const rectangles = computed(() => {
  return obstacles.value.filter((item) => item.type === "rectangle");
});

// 更新障碍物样式
function updateObstacleStyle(
  type: IComponentShapeType,
  id: string,
  style: Partial<Obstacles>
) {
  console.log(type, id, style);
}

// 选择障碍物
function selectObstacle(el: Obstacles) {
  console.log(el);
}

// 拖动开始时的处理函数
function handleDragStart(el: Obstacles) {
  console.log(el);
}

function handleDragEnd(item: Obstacles) {
  console.log(item);
}
// 重置选中元素
const resetSelectedElement = () => {
  selectedElement.value = {
    id: "",
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    radius: 0,
    fill: "#000",
    stroke: "#0077ff",
    strokeWidth: 2,
    type: "circle",
  };
};
// 拖动时更新位置
function onDragMove(event: Konva.KonvaEventObject<DragEvent>, el: Obstacles) {
  const shape = event.target;
  console.log(shape, el);
}

// 更新选中元素的配置
function updateSelectedElement() {}

// 动画绘制线条函数
const animateLineDrawing = (
  line: Konva.Line,
  isHorizontal: boolean,
  duration: number
) => {
  const points = line.points();

  // 确保 points 是数字数组
  const start = isHorizontal ? points[0] : points[1];
  const end = isHorizontal ? points[2] : points[3];

  // 使用 Konva 自带的动画
  const animation = new Konva.Animation((frame: IFrame | undefined) => {
    const progress = Math.min(frame!.time / (duration * 1000), 1); // 计算进度
    const current = start + (end - start) * progress;

    if (isHorizontal) {
      line.points([start, points[1], current, points[1]]);
    } else {
      line.points([points[0], start, points[0], current]);
    }

    if (progress === 1) {
      animation.stop(); // 动画完成后停止
    }
  }, line.getLayer());

  animation.start();
};

// 修改allObstacles计算属性
const allObstacles = computed(() => {
  return [
    ...circles.value.map((item) => ({
      ...item,
      type: "circle",
      x: item.x, // 保持圆心坐标不变
      y: item.y,
      radius: item.radius,
    })),
    ...rectangles.value.map((item) => ({
      ...item,
      type: "rectangle",
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
    })),
  ];
});

// 生成四叉树分割步骤
function generateQuadTreeSteps(root: QuadTreeNode): QuadTreeNode[] {
  const steps: QuadTreeNode[] = [];
  const queue: QuadTreeNode[] = [root];

  while (queue.length > 0) {
    const levelSize = queue.length;
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!;
      const clonedNode = JSON.parse(JSON.stringify(node));
      steps.push(clonedNode);

      if (!node.isLeaf && node.children) {
        queue.push(...node.children);
      }
    }
  }
  return steps;
}

// 步进控制函数
function stepForward() {
  if (currentStep.value < animationSteps.value.length - 1) {
    currentStep.value++;
    visualizeCurrentStep();
  }
}

function stepBackward() {
  if (currentStep.value > 0) {
    currentStep.value--;
    visualizeCurrentStep();
  }
}

// 修改后的可视化入口函数
function visualizeQuadTreeWithAnimation() {
  clearCanvans();
  const { width, height } = stageConfig.value;

  // 构建完整四叉树并生成步骤
  const quadTree = buildQuadTreeFrontend({
    width,
    height,
    obstacles: allObstacles.value,
    minThreshold: minThreshold.value,
  });

  animationSteps.value = generateQuadTreeSteps(quadTree);
  currentStep.value = 0;
  visualizeCurrentStep();
}
// 常量提取
const DEFAULT_DIVID_COLOR = "#0077ff";
const DEFAULT_MIN_THRESHOLD = 20;
const INITIAL_STAGE_CONFIG = { width: 820, height: 580 };
const animationQueue = ref<Konva.Animation[]>([]);
// 响应式状态整合
const editorState = ref({
  selectedElement: {
    id: "",
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    radius: 0,
    fill: "#000",
    stroke: "#0077ff",
    strokeWidth: 2,
    type: "circle",
  },
  dividColor: DEFAULT_DIVID_COLOR,
  minThreshold: DEFAULT_MIN_THRESHOLD,
});

// 优化障碍物创建逻辑
const createObstacle = (type: string, config: Partial<Obstacles>) => {
  return {
    type,
    x: 100,
    y: 100,
    fill: "black",
    stroke: "black",
    strokeWidth: 0,
    draggable: true,
    isDraging: false,
    ...config,
  };
};

const addObstacle = (type: string) => {
  const obstaclesMap = {
    circle: () => createObstacle(type, { radius: 50 }),
    rectangle: () =>
      createObstacle(type, {
        x: 200,
        y: 150,
        width: 100,
        height: 100,
      }),
  };

  if (obstaclesMap[type]) {
    obstacles.value.push(obstaclesMap[type]());
  }
};

// 优化可视化绘制逻辑
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
    radius: 3,
    fill: isLeaf ? "blue" : "red",
    stroke: "black",
    strokeWidth: 1,
  });
};

// 改造可视化函数
async function visualizeCurrentStep() {
  if (isAnimating.value) return;

  const stage = Konva.stages[0];
  // 清除旧临时图层内容
  tempLayer.value.destroyChildren();
  stage.add(tempLayer.value);

  const currentNode = animationSteps.value[currentStep.value];
  const { bounds, isLeaf } = currentNode;
  const { x, y, width, height, midX, midY } = bounds;

  isAnimating.value = true;

  // 使用 GSAP 实现更流畅的动画控制
  const tl = gsap.timeline();
  const currentLayer = currentStep.value === 0 ? persistentLayer : tempLayer.value;
  if (!isLeaf) {
    // 水平分割线动画
    const hLine = createDividingLine([x, midY, x, midY], dividColor.value);

    currentLayer.add(hLine);

    tl.to(hLine.points, {
      duration: animationDuration.value,
      endArray: [x, midY, x + width, midY],
      onUpdate: () => hLine.getLayer()?.batchDraw(),
    });

    // 垂直分割线动画
    const vLine = createDividingLine([midX, y, midX, y], dividColor.value);
    currentLayer.add(vLine);

    tl.to(
      vLine.points,
      {
        duration: animationDuration.value,
        endArray: [midX, y, midX, y + height],
        onUpdate: () => vLine.getLayer()?.batchDraw(),
      },
      "<"
    ); // 与水平动画同时进行
  }

  // 中心点动画
  const centerPoint = createCenterPoint(midX, midY, isLeaf);
  currentLayer.add(centerPoint);
  tl.fromTo(
    centerPoint,
    { radius: 0 },
    { radius: 3, duration: animationDuration.value / 2 },
    "<0.2"
  );

  // 修改动画完成回调
  tl.eventCallback("onComplete", () => {
    isAnimating.value = false;
    // 仅清除临时动画元素，保留图层
    tempLayer.value.destroyChildren();
    drawPersistentElements();
  });
}

// 修改持久化元素绘制方法
function drawPersistentElements() {
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
    persistentLayer.add(createCenterPoint(midX, midY, isLeaf));
  });

  // 确保持久化图层只添加一次
  if (!persistentLayer.getParent()) {
    Konva.stages[0] && Konva.stages[0].add(persistentLayer);
  }
}

const clearCanvans = () => {
  const stage = Konva.stages[0];
  // 保留基础元素图层、持久化图层和临时动画图层
  stage.getLayers().forEach((layer) => {
    const isBaseLayer = layer.attrs.id === "baseLayer";
    if (!isBaseLayer && layer !== persistentLayer && layer !== tempLayer.value) {
      layer.destroy();
    }
  });
  // 强制刷新视图
  stage.batchDraw();
};
// 初始化逻辑封装
function initializeState() {
  obstacles.value = [];
  animationSteps.value = [];
  currentStep.value = 0;
  dividColor.value = DEFAULT_DIVID_COLOR;
  minThreshold.value = DEFAULT_MIN_THRESHOLD;
  resetSelectedElement();
  clearCanvans();
  persistentLayer.destroyChildren();
  tempLayer.value.destroyChildren();
}

const clearObstacles = () => {
  initializeState();
};
</script>

<style scoped>
.title {
  font-size: 16px;
  padding: 5px;
  text-align: center;
  background-color: var(--primary-color);
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
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
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
  .shapes {
    max-width: 200px;
    display: flex;
    flex-direction: column;
    .shapes-container {
      display: flex;
      flex-wrap: wrap;
      .shapes-item {
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
        .icon {
          font-size: 48px;
        }
        .icon-name {
          font-size: 12px;
          margin-top: 5px;
        }
        &:hover {
          transition: all 0.5s;
          background-color: var(--link-hover-color);
          border: 1px solid var(--border-color);
        }
      }
    }
  }
  .content {
    background-color: #c7e9ff;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    max-height: 960px;
    min-height: 800px;
    position: relative;
    .operation {
      position: absolute;
      z-index: 1000;
      right: 0;
      bottom: 0;
      display: flex;
      .operation-item {
        padding: 10px;
        font-size: 16px;
        margin: 10px;
      }
    }
  }
  .tool-box {
    min-width: 300px;
    background-color: #f0f0f0;
    display: flex;
    flex-direction: column;
    .props-item {
      color: #000;
      display: flex;
      flex-direction: row;
      align-items: center;
      .label {
        text-align: center;
        min-width: 100px;
        font-size: 14px;
        margin-right: 10px;
      }
    }

    .map-props,
    .params,
    .current-element {
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
      .name {
        text-align: center;
        color: #000;
      }
    }
  }
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
</style>
