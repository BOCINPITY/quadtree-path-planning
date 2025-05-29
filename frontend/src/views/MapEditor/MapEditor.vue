<template>
  <div class="container">
    <div class="shapes">
      <div class="left-title">基本障碍物</div>
      <div class="shapes-container">
        <div class="shapes-item" v-for="shape in componentShapeList" :key="shape.name"
          @click="addObstacleHandler(shape.type)">
          <i :class="`icon iconfont ${shape.icon}`"></i>
          <div class="icon-name">{{ shape.name }}</div>
        </div>
      </div>
      <div class="title">地图加载</div>
      <div class="map-list">
        <el-select v-model="selectedMap" placeholder="请选择地图" @change="handleSelectMapChange" clearable>
          <el-option v-for="item in mapList" :key="item.id" :label="item.name" :value="item.id"></el-option>
        </el-select>
      </div>
      <div class="title">寻路配置</div>
      <div class="algorithm-select">
        <el-select v-model="selectedAlgorithm" placeholder="请选择算法">
          <el-option label="A*" :value="'A*'"></el-option>
          <el-option label="Dijkstra" :value="'Dijkstra'"></el-option>
        </el-select>
        <div v-if="selectedAlgorithm === 'A*'" class="algorithm-params">
          <div class="param-item">
            <div class="label">启发函数选择</div>
            <el-radio-group v-model="astarHeuristicType">
              <el-radio :value="'euclidean'">欧式距离</el-radio>
              <el-radio :value="'manhattan'">曼哈顿距离</el-radio>
              <!-- <el-radio :value="'diagonal'">对角距离</el-radio>
              <el-radio :value="'chebyshev'">切比雪夫距离</el-radio> -->
            </el-radio-group>
          </div>
        </div>
        <div class="algorithm-params">
          <div class="param-item">
            <div class="label">寻路动画单步时长</div>
            <div>
              <el-input-number v-model="pathFindingAnimationDuration" :min="0.1" :max="3" :step="0.1"></el-input-number>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="content">
      <!-- <div class="play-buttons algorithm">
        <el-text>路径规划操作按钮</el-text>
        <div class="btns">
          <div class="operation-item">
            <el-icon :size="operationBtnSize"><ArrowLeftBold /></el-icon>
          </div>

          <div class="operation-item">
            <el-icon :size="operationBtnSize">
              <VideoPlay v-if="true" style="color: orange" />
              <VideoPause style="color: red" v-else />
            </el-icon>
          </div>

          <div class="operation-item" type="primary">
            <el-icon :size="operationBtnSize"><ArrowRightBold /></el-icon>
          </div>
        </div>
      </div> -->
      <div class="play-buttons">
        <el-text>分割操作按钮</el-text>
        <el-progress :percentage="progressPercentage" :text-inside="false" :stroke-width="10" />
        <div class="btns">
          <el-tooltip effect="dark" content="上一步">
            <div class="operation-item" @click="stepBackward">
              <el-icon :size="operationBtnSize">
                <ArrowLeftBold />
              </el-icon>
            </div>
          </el-tooltip>
          <el-tooltip effect="dark" content="暂停或播放分割动画">
            <div class="operation-item" @click="togglePause">
              <el-icon :size="operationBtnSize">
                <VideoPlay v-if="!isQuadTreeSplitPlaying" style="color: orange" />
                <VideoPause style="color: red" v-else />
              </el-icon>
            </div>
          </el-tooltip>
          <el-tooltip effect="dark" content="下一步">
            <div class="operation-item" type="primary" @click="stepForward">
              <el-icon :size="operationBtnSize">
                <ArrowRightBold />
              </el-icon>
            </div>
          </el-tooltip>
          <el-tooltip effect="dark" content="跳过分割过程">
            <div class="operation-item" type="danger" @click="skipQuadTreeAnimation">
              <el-icon :size="operationBtnSize">
                <Ship />
              </el-icon>
            </div>
          </el-tooltip>
        </div>
      </div>

      <div class="operation">
        <el-button class="operation-item" type="danger" @click="clearObstacles">
          清空
        </el-button>
        <el-button class="operation-item" type="primary" @click="handlCreateOrUpdateMapBtnClick">
          {{ selectedMap ? "更新地图信息" : "保存地图信息" }}
        </el-button>
        <el-button class="operation-item" type="success" @click="visualizeQuadTreeWithAnimation">
          四叉树构建
        </el-button>
        <el-button class="operation-item" type="primary" @click="handlePathFinding">
          寻路规划可视化
        </el-button>
      </div>
      <v-stage :config="stageConfig" style="background: #fff" @click="handleStageClick"
        @contextmenu="handleStageContextMenuClick($event)">
        <v-layer id="baseLayer">
          <v-circle v-for="circle in circles" :key="circle.id" :config="circle" @dragstart="handleDragStart(circle)"
            @dragend="handleDragEnd($event)" @dragmove="onDragMove($event, circle)" @click="setActiveElement(circle)"
            @contextmenu="handleElementContextMenu($event, circle)" />
          <v-rect v-for="rect in rectangles" :key="rect.id" :config="rect" @dragstart="handleDragStart(rect)"
            @dragend="handleDragEnd($event)" @dragmove="onDragMove($event, rect)" @click="setActiveElement(rect)"
            @contextmenu="handleElementContextMenu($event, rect)" />
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
          <div class="label">四叉分割单步动画时长</div>
          <el-input-number v-model="animationDuration" :min="0.1" :max="3" :step="0.1" />
        </div>
        <div class="props-item">
          <div class="label">是否显示区域中心点</div>
          <el-switch v-model="showCenterPoint" />
        </div>
        <div class="props-item">
          <div v-if="showCenterPoint">
            <span class="label">中心点半径</span>
            <el-input-number v-model="centerPointsConfig.radius" :min="1" :max="5" :step="1" />
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
            <el-input-number v-model="centerPointsConfig.strokeWidth" :min="1" :max="3" :step="1" />
          </div>
        </div>
      </div>
    </div>
    <div v-if="showContextMenu" class="custom-context-menu" :style="{
      left: `${contextMenuX}px`,
      top: `${contextMenuY}px`,
    }">
      <el-menu class="custom-el-menu">
        <el-menu-item @click="deleteElement(selectedContextElement)">删除</el-menu-item>
        <el-menu-item @click="copyElement(selectedContextElement)">复制</el-menu-item>
      </el-menu>
    </div>

    <div v-if="showStageContextMenu" class="custom-context-menu" :style="{
      left: `${contextMenuX}px`,
      top: `${contextMenuY}px`,
    }">
      <el-menu class="custom-el-menu">
        <el-menu-item @click="setStartPoint">设置起点</el-menu-item>
        <el-menu-item @click="setEndPoint">设置终点</el-menu-item>
      </el-menu>
    </div>
  </div>
  <el-dialog v-model="modalVisiable" title="地图信息" width="20%" :close-on-click-modal="false" :show-close="false"
    :before-close="handleClose">
    <el-form class="map-info-form" label-width="100px" ref="mapInfoFormRef" :model="mapInfo" :rules="rules">
      <el-form-item label="地图名称" prop="name">
        <el-input v-model="mapInfo.name" placeholder="请输入地图名称"></el-input>
      </el-form-item>
      <el-form-item label="地图描述" prop="description">
        <el-input type="textarea" v-model="mapInfo.description" placeholder="请输入地图描述" maxlength="200" show-word-limit
          :rows="3"></el-input>
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
  import { deleteObstacle, copyObstacle, addObstacle } from "@/utils/obstacleActions";
  import { aStar, dijkstra, findNodeContainingPoint } from "@/utils/pathFinding";
  import { useRoute } from 'vue-router';
  import type { HeuristicType } from "@/utils/pathFinding";
  import { componentShapeList } from "@/utils/shapeIcons";
  import Konva from "konva";
  import type { QuadTreeNode } from "@/utils/quadTree";
  import type { GetMapListDto } from "@/http/map";
  import { createMap, getMapById, getMapList, updateMapById } from "@/http/map";
  import type { FormInstance } from "element-plus";
  import type { Obstacles, SelectedObstaclesDto } from "@/@types/dto";
  import { buildQuadTreeFrontend } from "@/utils/quadTree";
  import { ElMessage } from "element-plus";

  import { gsap } from "gsap";
  import {
    countNodes,
    calculateAverageObstacleCoverage,
    calculateMaxObstacleCoverage,
    calculateTreeDepth,
    countLeafNodes,
  } from "@/utils/quadtreeBuildTest";

  import startIcon from "@/assets/images/startpoint.png";
  import endIcon from "@/assets/images/endpoint.png";
  import {
    ArrowLeftBold,
    ArrowRightBold,
    VideoPlay,
    VideoPause,
    Ship,
  } from "@element-plus/icons-vue";
  const route = useRoute();
  const minThreshold = ref<number>(20);
  const dividColor = ref<string>("#0077ff");
  const operationBtnSize = 14;
  const startPoint = ref<{ x: number; y: number } | null>(null);
  const endPoint = ref<{ x: number; y: number } | null>(null);
  const startShape = ref<Konva.Image | null>(null);
  const endShape = ref<Konva.Image | null>(null);
  const persistentLayer = ref(new Konva.Layer());
  const quadTree = ref<QuadTreeNode | null>(null);
  const pathFindingAnimationDuration = ref(0.1);
  // 新增一个数组来记录每一步添加的分割线
  const stepDividingLines = ref<Konva.Line[][]>([]);
  // 定义图片对象
  const startImageObj = new window.Image();
  const endImageObj = new window.Image();
  const showContextMenu = ref(false);
  const contextMenuX = ref(0);
  const contextMenuY = ref(0);
  const selectedContextElement = ref<Obstacles | null>(null);
  const selectedAlgorithm = ref<PathFindingAlgorithm>("A*");
  const progressPercentage = computed(() => {
    if (animationQuadTreeSplitSteps.value.length === 0) return 0;
    return Number(
      (
        (currentQuadTreeSplitStep.value / animationQuadTreeSplitSteps.value.length) *
        100
      ).toFixed(2)
    );
  });
  // 跳过分割过程
  const skipQuadTreeAnimation = () => {
    try {
      if (animationQuadTreeSplitSteps.value.length === 0) {
        ElMessage.error("请先创建地图或加载地图");
        return;
      }

      // 停止动画播放
      isQuadTreeSplitPlaying.value = false;

      // 清空当前图层
      persistentLayer.value.destroyChildren();

      // 绘制所有分割线
      animationQuadTreeSplitSteps.value.forEach((node) => {
        const { bounds, isLeaf } = node;
        const { x, y, width, height, midX, midY } = bounds;

        if (!isLeaf) {
          // 水平线
          const hLine = createDividingLine([x, midY, x + width, midY], dividColor.value);
          persistentLayer.value.add(hLine);

          // 垂直线
          const vLine = createDividingLine([midX, y, midX, y + height], dividColor.value);
          persistentLayer.value.add(vLine);
        }
      });

      // 更新图层
      persistentLayer.value.batchDraw();

      // 更新进度条为 100%
      currentQuadTreeSplitStep.value = animationQuadTreeSplitSteps.value.length;
      ElMessage.success("分割过程已跳过，直接完成！");
    } catch (error) {
      console.error("跳过分割过程时出错:", error);
      ElMessage.error("跳过分割过程时发生错误，请检查控制台日志");
    }
  };
  type PathFindingAlgorithm = "A*" | "Dijkstra";
  const handlCreateOrUpdateMapBtnClick = () => {
    if (!selectedMap.value && obstacles.value.length === 0) {
      ElMessage.warning("请先添加障碍物");
      return;
    }
    if (selectedMap.value) {
      const map = mapList.value?.find((item) => item.id === selectedMap.value);
      if (map) {
        mapInfo.value.name = map.name;
        mapInfo.value.description = map.description;
      }
    } else {
      mapInfo.value.name = "";
      mapInfo.value.description = "";
    }
    modalVisiable.value = true;
  };
  const astarHeuristicType = ref<HeuristicType>("euclidean");
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
  const mapList = ref<GetMapListDto[]>();
  const modalVisiable = ref(false);
  const animationDuration = ref(0.1);

  const rules = {
    name: [{ required: true, message: "地图名称不能为空", trigger: "blur" }],
    description: [{ required: true, message: "地图描述不能为空", trigger: "blur" }],
  };
  const animationQuadTreeSplitSteps = ref<QuadTreeNode[]>([]);
  const currentQuadTreeSplitStep = ref(0);
  const isQuadTreeSplitPlaying = ref(false);

  const handlePathFinding = async () => {
    if (!startPoint.value || !endPoint.value) {
      ElMessage.warning("请先设置起点和终点");
      return;
    }
    if (!quadTree.value) {
      ElMessage.warning("请先生成四叉树");
      return;
    }

    const startNode = findNodeContainingPoint(
      quadTree.value,
      startPoint.value.x,
      startPoint.value.y
    );
    const endNode = findNodeContainingPoint(
      quadTree.value,
      endPoint.value.x,
      endPoint.value.y
    );

    if (!startNode || !endNode) {
      ElMessage.warning("起点或终点所在节点包含障碍物");
      return;
    }

    const { path: aStarPath, steps: aStarSteps } = aStar(
      startNode,
      endNode,
      quadTree.value,
      astarHeuristicType.value
    );
    const { path: dijkstraPath, steps: dijkstraSteps } = dijkstra(
      startNode,
      endNode,
      quadTree.value
    );

    if (!aStarPath || !dijkstraPath) {
      ElMessage.error("未找到可行路径");
      return;
    }
    let path: QuadTreeNode[];
    let steps: {
      current: QuadTreeNode;
      openSet: QuadTreeNode[];
      closedSet: QuadTreeNode[];
    }[];
    if (selectedAlgorithm.value === "A*") {
      path = aStarPath;
      steps = aStarSteps;
    } else {
      path = dijkstraPath;
      steps = dijkstraSteps;
    }

    // 调整路径，处理起点和终点的边缘情况
    const adjustedPath = adjustPathForStartAndEnd(path, startPoint.value, endPoint.value);

    const stage = Konva.stages[0];
    if (!stage) {
      ElMessage.error("未找到舞台实例");
      return;
    }

    // 添加图层到舞台
    stage.add(tempLayer.value as Konva.Layer);
    // 渲染搜索过程
    for (const step of steps) {
      // 清除上一步的图层
      tempLayer.value.destroyChildren();
      // 渲染当前节点
      const currentNodeVisual = new Konva.Rect({
        x: step.current.bounds.x,
        y: step.current.bounds.y,
        width: step.current.bounds.width,
        height: step.current.bounds.height,
        fill: "#52c41a",
        opacity: 0.5,
      });
      tempLayer.value.add(currentNodeVisual);

      // 渲染开放列表节点
      step.openSet.forEach((node) => {
        const openNodeVisual = new Konva.Rect({
          x: node.bounds.x,
          y: node.bounds.y,
          width: node.bounds.width,
          height: node.bounds.height,
          fill: "#1677ff",
          opacity: 0.2,
        });
        tempLayer.value.add(openNodeVisual);
      });

      // 渲染关闭列表节点
      step.closedSet.forEach((node) => {
        const closedNodeVisual = new Konva.Rect({
          x: node.bounds.x,
          y: node.bounds.y,
          width: node.bounds.width,
          height: node.bounds.height,
          fill: "#fadb14", //颜色：黄
          opacity: 0.2,
        });
        tempLayer.value.add(closedNodeVisual);
      });

      // 更新图层
      tempLayer.value.batchDraw();

      // 等待一段时间以展示动画效果
      await new Promise((resolve) =>
        setTimeout(resolve, pathFindingAnimationDuration.value * 1000)
      );
    }

    // 渲染最终路径
    const points = adjustedPath.flatMap((node) => [node.x, node.y]);
    const pathLine = new Konva.Line({
      points,
      stroke: "#f5222d",
      strokeWidth: 2,
      dash: [10, 5],
    });
    tempLayer.value.add(pathLine);
    tempLayer.value.batchDraw();

    ElMessage.success("路径规划完成！");
  };

  /**
   * 调整路径，处理起点和终点的边缘情况。
   *
   * @param path - A* 算法生成的路径。
   * @param startPoint - 起点的实际坐标。
   * @param endPoint - 终点的实际坐标。
   * @returns 调整后的路径。
   */
  const adjustPathForStartAndEnd = (
    path: QuadTreeNode[],
    startPoint: { x: number; y: number },
    endPoint: { x: number; y: number }
  ): { x: number; y: number }[] => {
    const adjustedPath: { x: number; y: number }[] = [];

    // 起点到起点所在节点中心
    const startNode = path[0];
    if (startNode) {
      adjustedPath.push({ x: startPoint.x, y: startPoint.y }); // 起点实际位置
      adjustedPath.push({ x: startNode.bounds.midX, y: startNode.bounds.midY }); // 起点中心
    }

    // 添加中间路径
    for (let i = 1; i < path.length - 1; i++) {
      adjustedPath.push({ x: path[i].bounds.midX, y: path[i].bounds.midY });
    }

    // 终点所在节点中心到终点
    const endNode = path[path.length - 1];
    if (endNode) {
      adjustedPath.push({ x: endNode.bounds.midX, y: endNode.bounds.midY }); // 终点中心
      adjustedPath.push({ x: endPoint.x, y: endPoint.y }); // 终点实际位置
    }

    return adjustedPath;
  };

  //生成四叉节点中心点
  const generateCenterPoint = (root: QuadTreeNode): Konva.Circle[] => {
    const centerPoints: Konva.Circle[] = [];
    const traverse = (node: QuadTreeNode) => {
      if (!node) return;
      const { midX, midY } = node.bounds;
      const centerPoint = new Konva.Circle({
        x: midX,
        y: midY,
        radius: centerPointsConfig.value.radius,
        fill: centerPointsConfig.value.fill,
        stroke: centerPointsConfig.value.stroke,
        strokeWidth: centerPointsConfig.value.strokeWidth,
      });
      centerPoints.push(centerPoint);
      if (!node.isLeaf && node.children) {
        node.children.forEach(traverse);
      }
    };
    traverse(root);
    return centerPoints;
  };
  watch(showCenterPoint, (newValue) => {
    const stage = Konva.stages[0];
    if (!stage || !quadTree.value) return;

    const baseLayer = stage.getLayers().find((layer) => layer.id() === "baseLayer");
    if (!baseLayer) return;

    if (newValue) {
      const centerPoints = generateCenterPoint(quadTree.value);
      centerPoints.forEach((point) => baseLayer.add(point));
    } else {
      baseLayer.find("Circle").forEach((circle) => {
        if (circle.attrs.fill === centerPointsConfig.value.fill) {
          circle.destroy();
        }
      });
    }
    baseLayer.batchDraw();
  });
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

  const handleSelectMapChange = async (id: number, loadMap?: GetMapListDto) => {
    clearLayer();
    if (!id) return;
    const map = mapList.value?.find((item) => item.id === id) || loadMap;
    stageConfig.value.width = map?.width || 820;
    stageConfig.value.height = map?.height || 580;
    dividColor.value = map?.dividColor || "#0077ff";
    minThreshold.value = map?.minThreshold || 20;

    if (map && map.obstacles) {
      obstacles.value = map.obstacles.map((v) => ({
        ...v,
        draggable: true,
        isDragging: false,
        isActive: false,
      }));
      startPoint.value = map.startPoint || { x: -1, y: -1 };
      endPoint.value = map.endPoint || { x: -1, y: -1 };
      //重新设置起点和终点
      startShape.value?.destroy();
      endShape.value?.destroy();
      startShape.value = new Konva.Image({
        x: startPoint.value.x,
        y: startPoint.value.y,
        image: startImageObj,
        width: startImageObj.width,
        height: startImageObj.height,
        offset: {
          x: startImageObj.width / 2,
          y: startImageObj.height,
        },
        name: "startPoint",
      });
      endShape.value = new Konva.Image({
        x: endPoint.value.x,
        y: endPoint.value.y,
        image: endImageObj,
        width: endImageObj.width,
        height: endImageObj.height,
        offset: {
          x: endImageObj.width / 2,
          y: endImageObj.height,
        },
        name: "endPoint",
      });

      // 通过baseLayer清除之前设置的起点和终点
      const baseLayer = Konva.stages[0].getLayers().find((layer) => {
        if (layer.id() === "baseLayer") {
          return layer as Konva.Layer;
        }
      });
      if (baseLayer) {
        baseLayer.destroyChildren();
        baseLayer.add(startShape.value as Konva.Image);
        baseLayer.add(endShape.value as Konva.Image);
      }
      baseLayer?.batchDraw();
    }
  };

  const handleSave = async (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    //校验地图信息
    await formEl.validate(async (valid) => {
      if (valid) {
        // 分为更新和新增逻辑
        if (selectedMap.value) {
          //更新逻辑
          const map = mapList.value?.find((item) => item.id === selectedMap.value);
          if (map) {
            map.name = mapInfo.value.name;
            map.description = mapInfo.value.description;
            map.width = stageConfig.value.width;
            map.height = stageConfig.value.height;
            map.obstacles = [...obstacles.value];
            map.minThreshold = minThreshold.value;
            map.dividColor = dividColor.value;
            map.startPoint = startPoint.value ? startPoint.value : { x: -1, y: -1 };
            map.endPoint = endPoint.value ? endPoint.value : { x: -1, y: -1 };
            await updateMapById(selectedMap.value, map);
            ElMessage({
              type: "success",
              message: "地图更新成功",
            });
          }
        } else {
          const { name, description } = mapInfo.value;
          const params = {
            name,
            description,
            width: stageConfig.value.width,
            height: stageConfig.value.height,
            obstacles: [...obstacles.value],
            isOpenSource: 0,
            minThreshold: minThreshold.value,
            dividColor: dividColor.value,
            startPoint: startPoint.value ? startPoint.value : { x: -1, y: -1 },
            endPoint: endPoint.value ? endPoint.value : { x: -1, y: -1 },

          };
          await createMap(params);
          ElMessage({
            type: "success",
            message: "地图保存成功",
          });
        }
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
    // 加载图片
    startImageObj.src = startIcon;
    endImageObj.src = endIcon;
    const mapId = route.query.mapId
    if (mapId) {
      const res = await getMapById(Number(mapId))
      if (res) {
        handleSelectMapChange(-1, res);
      }
    }

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
  //设置起点
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
          x: pos.x, // 使图标中心对准点击位置
          y: pos.y,
          image: startImageObj,
          width: startImageObj.width,
          height: startImageObj.height,
          offset: {
            x: startImageObj.width / 2,
            y: startImageObj.height,
          },
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
          x: pos.x, // 使图标中心对准点击位置
          y: pos.y,
          image: endImageObj,
          width: endImageObj.width,
          height: endImageObj.height,
          offset: {
            x: endImageObj.width / 2,
            y: endImageObj.height,
          },
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
    isDragging: false,
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
            isDragging: newValue.isDragging,
            isActive: newValue.isActive,
          };
        }
      }
    },
    { deep: true }
  );

  const setActiveElement = (el: Obstacles) => {
    clearActiveElement();
    const element = obstacles.value.find((item) => item.id === el.id);
    if (element) {
      element.isDragging = true;
      element.stroke = "#0077ff";
      element.strokeWidth = 4;
      element.isActive = true;
      selectedElement.value = { ...element };
    }
  };
  const clearActiveElement = () => {
    obstacles.value.map((item) => {
      if (item.isActive) {
        item.isDragging = false;
        item.stroke = "#000";
        item.strokeWidth = 0;
        item.isActive = false;
      }
    });
  };

  const handleDragStart = (el: Obstacles) => {
    setActiveElement(el);
  };

  const handleDragEnd = (event: Konva.KonvaEventObject<DragEvent>) => {
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
      isDragging: false,
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
      // 只添加非叶子节点到 steps 数组
      if (!node.isLeaf) {
        steps.push({ ...node });
      }
      if (!node.isLeaf && node.children) {
        queue.push(...node.children);
      }
    }
    return steps;
  };

  // 前进一步
  const stepForward = async () => {
    try {
      if (currentQuadTreeSplitStep.value < animationQuadTreeSplitSteps.value.length - 1) {
        currentQuadTreeSplitStep.value++;
        await visualizeCurrentStep();
      } else {
        ElMessage.info("已经是最后一步了");
      }
    } catch (error) {
      console.error("前进一步时出错:", error);
      ElMessage.error("前进一步时发生错误，请检查控制台日志");
    }
  };
  // 后退一步
  const stepBackward = async () => {
    try {
      if (currentQuadTreeSplitStep.value > 0) {
        // 移除当前步骤的分割线
        const linesToRemove = stepDividingLines.value[currentQuadTreeSplitStep.value];
        if (linesToRemove) {
          linesToRemove.forEach((line) => line.destroy());
        }
        // 从 stepDividingLines 中移除当前步骤的记录
        stepDividingLines.value.splice(currentQuadTreeSplitStep.value, 1);
        currentQuadTreeSplitStep.value--;
        persistentLayer.value.batchDraw();
      } else {
        ElMessage.info("已经是第一步了");
      }
    } catch (error) {
      console.error("后退一步时出错:", error);
      ElMessage.error("后退一步时发生错误，请检查控制台日志");
    }
  };

  const autoPlaySteps = async () => {
    try {
      if (animationQuadTreeSplitSteps.value.length === 0) {
        ElMessage.error("请先创建地图或加载地图");
        return;
      }
      isQuadTreeSplitPlaying.value = true;

      // 从当前步骤开始播放
      while (
        currentQuadTreeSplitStep.value < animationQuadTreeSplitSteps.value.length &&
        isQuadTreeSplitPlaying.value
      ) {
        await visualizeCurrentStep();
        await new Promise((resolve) => setTimeout(resolve, animationDuration.value * 1000));

        // 只有在播放状态下才前进
        if (isQuadTreeSplitPlaying.value) {
          currentQuadTreeSplitStep.value++;
        }
      }
      // 添加分割完成提示
      if (currentQuadTreeSplitStep.value >= animationQuadTreeSplitSteps.value.length) {
        ElMessage.success("四叉树分割已完成！");
      }
      isQuadTreeSplitPlaying.value = false;
    } catch (error) {
      console.error("自动播放时出错:", error);
      ElMessage.error("自动播放时发生错误，请检查控制台日志");
    }
  };

  const togglePause = () => {
    if (currentQuadTreeSplitStep.value >= animationQuadTreeSplitSteps.value.length) {
      ElMessage.warning("请先生成四叉树步骤");
      return;
    }
    isQuadTreeSplitPlaying.value = !isQuadTreeSplitPlaying.value;
    ElMessage.info(isQuadTreeSplitPlaying.value ? "继续播放" : "已暂停");
    // 继续播放时如果还有步骤未完成则重新触发播放
    if (
      isQuadTreeSplitPlaying.value &&
      currentQuadTreeSplitStep.value++ < animationQuadTreeSplitSteps.value.length
    ) {
      autoPlaySteps();
    }
  };

  // 提取测试逻辑到独立函数
  function testQuadTreePerformance(qt: QuadTreeNode, startTime: number, endTime: number) {
    console.group("Map Info");
    console.log("地图宽度:", stageConfig.value.width);
    console.log("地图高度:", stageConfig.value.height);
    console.log("障碍物数量:", allObstacles.value.length);
    console.log("最小阈值:", minThreshold.value);
    console.log("障碍物比例阈值:", 0.3);
    console.groupEnd();

    const metrics = {
      buildTime: endTime - startTime,
      expandedNodes: countNodes(qt),
      treeDepth: calculateTreeDepth(qt),
      leafNodes: countLeafNodes(qt),
      averageObstacleCoverage: calculateAverageObstacleCoverage(qt),
      maxObstacleCoverage: calculateMaxObstacleCoverage(qt),
    };

    console.group("QuadTree Metrics");
    console.log("构建时间 (ms):", metrics.buildTime.toFixed(2));
    console.log("扩展节点数:", metrics.expandedNodes);
    console.log("四叉树深度:", metrics.treeDepth);
    console.log("叶子节点数:", metrics.leafNodes);
    console.log("平均障碍物覆盖率:", metrics.averageObstacleCoverage.toFixed(2));
    console.log("最大障碍物覆盖率:", metrics.maxObstacleCoverage.toFixed(2));
    console.groupEnd();

    // 将测试结果格式化为文本
    const logEntry = `
  Map Info:
  - 地图宽度: ${stageConfig.value.width}
  - 地图高度: ${stageConfig.value.height}
  - 障碍物数量: ${allObstacles.value.length}
  - 最小阈值: ${minThreshold.value}
  - 障碍物比例阈值: 0.3

  QuadTree Metrics:
  - 构建时间 (ms): ${metrics.buildTime.toFixed(2)}
  - 扩展节点数: ${metrics.expandedNodes}
  - 四叉树深度: ${metrics.treeDepth}
  - 叶子节点数: ${metrics.leafNodes}
  - 平均障碍物覆盖率: ${metrics.averageObstacleCoverage.toFixed(2)}
  - 最大障碍物覆盖率: ${metrics.maxObstacleCoverage.toFixed(2)}

  -------------------------------
  `;
    console.log(logEntry);

    return metrics;
  }

  // 主函数中调用测试逻辑
  const visualizeQuadTreeWithAnimation = async () => {
    try {
      gsap.globalTimeline.clear();
      // 重置状态
      isQuadTreeSplitPlaying.value = false;
      currentQuadTreeSplitStep.value = 0;
      animationQuadTreeSplitSteps.value = [];
      tempLayer.value.destroyChildren(); // 清除临时图层的内容
      persistentLayer.value.destroyChildren(); // 清除持久图层的内容
      stepDividingLines.value = []; // 重置分割线记录

      const { width, height } = stageConfig.value;
      const startTime = performance.now();
      const qt = buildQuadTreeFrontend({
        width,
        height,
        obstacles: allObstacles.value,
        minThreshold: minThreshold.value,
        obstacleRatioThreshold: 0.3,
      });
      const endTime = performance.now();

      // 调用测试逻辑
      testQuadTreePerformance(qt, startTime, endTime);

      quadTree.value = qt;

      animationQuadTreeSplitSteps.value = generateQuadTreeSteps(quadTree.value); // 层序遍历
      currentQuadTreeSplitStep.value = 0;
      await autoPlaySteps();
    } catch (error) {
      console.error("可视化四叉树动画时出错:", error);
      ElMessage.error("可视化四叉树动画时发生错误，请检查控制台日志");
    }
  };

  const visualizeCurrentStep = async () => {
    return new Promise<void>((resolve, reject) => {
      try {
        const stage = Konva.stages[0];
        if (!stage) {
          reject(new Error("未找到Stage实例"));
          return;
        }
        stage.add(persistentLayer.value as Konva.Layer);
        const currentNode =
          animationQuadTreeSplitSteps.value[currentQuadTreeSplitStep.value];
        if (!currentNode) {
          resolve();
          return;
        }
        const { bounds, isLeaf } = currentNode;
        const { x, y, width, height, midX, midY } = bounds;

        const tl = gsap.timeline();
        const currentStepLines: Konva.Line[] = [];

        if (!isLeaf) {
          const hLine = createDividingLine([x, midY, x, midY], dividColor.value);
          persistentLayer.value.add(hLine);
          currentStepLines.push(hLine);
          tl.to(hLine.points(), {
            duration: animationDuration.value,
            endArray: [x, midY, x + width, midY],
            onUpdate: () => {
              persistentLayer.value.batchDraw();
            },
          });

          const vLine = createDividingLine([midX, y, midX, y], dividColor.value);
          persistentLayer.value.add(vLine);
          currentStepLines.push(vLine);
          tl.to(
            vLine.points(),
            {
              duration: animationDuration.value,
              endArray: [midX, y, midX, y + height],
              onUpdate: () => {
                persistentLayer.value.batchDraw();
              },
            },
            "<"
          );
        }

        // 记录当前步骤的分割线
        if (stepDividingLines.value.length <= currentQuadTreeSplitStep.value) {
          stepDividingLines.value.push(currentStepLines);
        } else {
          stepDividingLines.value[currentQuadTreeSplitStep.value] = currentStepLines;
        }

        tl.eventCallback("onComplete", () => {
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  const createDividingLine = (points: number[], color: string) => {
    return new Konva.Line({
      points,
      stroke: color,
      strokeWidth: 2,
    });
  };

  const clearLayer = () => {
    const stage = Konva.stages[0];
    if (stage) {
      stage.getLayers().forEach((layer) => {
        layer.destroyChildren();
      });
      stage.batchDraw();
    }
  };

  const initializeState = () => {
    obstacles.value = [];
    animationQuadTreeSplitSteps.value = [];
    currentQuadTreeSplitStep.value = 0;
    pathFindingAnimationDuration.value = 0.1;
    animationDuration.value = 0.1;
    selectedAlgorithm.value = "A*";
    selectedMap.value = undefined;
    startPoint.value = { x: -1, y: -1 };
    endPoint.value = { x: -1, y: -1 };
    startShape.value?.destroy();
    endShape.value?.destroy();
    startShape.value = null;
    endShape.value = null;
    showStageContextMenu.value = false;
    showContextMenu.value = false;
    dividColor.value = "#0077ff";
    minThreshold.value = 20;
    resetSelectedElement();
    clearLayer();
    tempLayer.value.destroyChildren();
  };

  // 删除元素
  const deleteElement = (element: Obstacles | null) => {
    deleteObstacle(obstacles.value, element);
    showContextMenu.value = false;
  };

  // 复制元素
  const copyElement = (element: Obstacles | null) => {
    copyObstacle(obstacles.value, element);
    showContextMenu.value = false;
  };

  // 添加障碍物
  const addObstacleHandler = (type: "circle" | "rectangle") => {
    addObstacle(obstacles.value, type);
  };
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

  .algorithm-select,
  .map-list {
    display: flex;
    margin: 10px;
    flex-direction: column;
    gap: 10px;
    background-color: white;
    padding: 10px;
    border-radius: 16px;
  }

  .algorithm-params {
    margin-top: 10px;
    padding: 10px;
    background-color: white;
    border-radius: 8px;
  }

  .param-item {
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
  }

  .param-item .label {
    min-width: 100px;
    color: #000;
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
    width: 200px;
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
    background-color: #d0d1d3;
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
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    position: absolute;
    z-index: 1000;
    top: 0px;
    padding: 10px;
    border-bottom-left-radius: 16px;
    border-bottom-right-radius: 16px;
    right: 0;
    display: flex;
    flex-direction: column;
  }

  .container .content .play-buttons.algorithm {
    left: 0;
    right: auto;
  }

  .container .content .play-buttons .btns {
    display: flex;
    flex-direction: row;
  }

  .container .content .algorithm-operation {
    background-color: #fff;
    position: absolute;
    z-index: 1000;
    top: 0;
    padding: 10px;
    border-bottom-left-radius: 16px;
    border-bottom-right-radius: 16px;
    left: 0;
    display: flex;
    max-width: 120px;
    flex-direction: column;
  }

  .container .content .operation-item {
    padding: 5px;
    font-size: 16px;
    margin: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .container .content .btns .operation-item {
    color: #409eff;
    border-radius: 16px;
    border: 2px solid #409eff;
  }

  .container .content .btns .operation-item:hover {
    background-color: #409eff;
    color: #fff;
    transition: all 0.5s;
  }

  .container .content .operation {
    position: absolute;
    z-index: 1000;
    right: 0;
    bottom: 0;
    display: flex;
  }

  .container .tool-box {
    width: 300px;
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
  }

  .container .tool-box .current-element {
    max-height: 170px;
    overflow-y: scroll;
  }

  .container .tool-box .params {
    max-height: 180px;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    overflow-y: scroll;
  }

  .container .tool-box .map-props {
    max-height: 120px;
  }

  .container .tool-box .map-props .name,
  .container .tool-box .params .name,
  .container .tool-box .current-element .name {
    text-align: center;
    color: #000;
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
