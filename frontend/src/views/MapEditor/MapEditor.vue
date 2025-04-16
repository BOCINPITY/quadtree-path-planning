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
        <el-select v-model="selectedMap" placeholder="请选择地图" @change="handleSelectMapChange">
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
          清空障碍物
        </el-button>
        <el-button class="operation-item" type="primary" @click="() => (modalVisiable = true)">
          保存并上传
        </el-button>
        <el-button class="operation-item" type="success" @click="visualizeQuadTreeWithAnimation"
          >四叉分割可视化</el-button
        >
      </div>
      <v-stage :config="stageConfig" style="background: #fff">
        <v-layer>
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
          <el-color-picker v-model.trim="selectedElement.fill" @change="updateSelectedElement" />
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
import { ref, onMounted, computed } from 'vue'
import type { IComponentShapeType } from '@/@types/'
import { componentShapeList } from '@/utils/shapeIcons'
import { buildQuadTree, type QuadTreeNode } from '@/utils/quadTree'
import Konva from 'konva'

import type { CreateMapDto, GetMapListDto } from '@/http/map'
import type { IFrame } from 'konva/lib/types'
import { createMap, getMapList } from '@/http/map'
import type { FormInstance } from 'element-plus'
import type { Obstacles } from '@/@types/dto'
import { QuadTreeAnimator } from '@/utils/QuadTreeAnimator'
const mapInfoFormRef = ref<FormInstance>()
const mapList = ref<GetMapListDto[]>()
const modalVisiable = ref(false)
const rules = {
  name: [{ required: true, message: '地图名称不能为空', trigger: 'blur' }],
  description: [{ required: true, message: '地图描述不能为空', trigger: 'blur' }],
}
const handleClose = () => (modalVisiable.value = false)
const handleSelectMapChange = async (id: number) => {
  //清空障碍物
  clearCanvans()
  //加载地图信息
  const obstaclesData = mapList.value?.find((item) => item.id === id)?.obstacles
  if (obstaclesData) {
    obstacles.value = [...obstaclesData.map((v) => ({ ...v, draggable: true, isDraging: false }))]
  }
}

/**
 * 保存地图
 * @param formEl
 * @returns
 */
const handleSave = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      const { name, description } = mapInfo.value
      const params = {
        name,
        description,
        width: stageConfig.value.width,
        height: stageConfig.value.height,
        obstacles: [...obstacles.value],
        minThreshold: minThreshold.value,
        dividColor: dividColor.value,
      }
      await createMap(params as CreateMapDto)
      modalVisiable.value = false
    } else {
      console.log('error submit!!', fields)
    }
  })
}
const stageConfig = ref({
  width: 820,
  height: 580,
})
const mapInfo = ref<{ name: string; description: string }>({ name: '', description: '' })
const selectedMap = ref<number>()
//加载我的地图列表
onMounted(async () => {
  const data = await getMapList()
  mapList.value = data
})
//最小分割阈值
const minThreshold = ref<number>(20)
const dividColor = ref<string>('#0077ff')
const selectedElement = ref({
  id: '',
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  radius: 0,
  fill: '#000',
  stroke: '#0077ff',
  strokeWidth: 2,
  type: 'circle',
})

const obstacles = ref<Obstacles[]>([])
const circles = computed(() => {
  return obstacles.value.filter((item) => item.type === 'circle')
})
const rectangles = computed(() => {
  return obstacles.value.filter((item) => item.type === 'rectangle')
})


const addObstacle = (type: string) => {
  if (type === 'circle') {
    obstacles.value.push({
      type: 'circle',
      x: 100,
      y: 100,
      radius: 50,
      fill: 'black',
      stroke: 'black',
      strokeWidth: 0,
      draggable: true, // 修正拼写错误
      isDraging: false,
    })
  } else if (type === 'rectangle') {
    obstacles.value.push({
      type: 'rectangle',
      x: 200,
      y: 150,
      width: 100,
      height: 100,
      fill: 'black',
      stroke: 'black',
      strokeWidth: 0,
      draggable: true, // 修正拼写错误
      isDraging: false,
    })
  }
}
const clearObstacles = () => {
  obstacles.value = []
}
// 更新障碍物样式
function updateObstacleStyle(type: IComponentShapeType, id: string, style: Partial<Obstacles>) {
  console.log(type, id, style)
}

// 选择障碍物
function selectObstacle(el: Obstacles) {
  console.log(el)
}

// 拖动开始时的处理函数
function handleDragStart(el: Obstacles) {
  console.log(el)
}

function handleDragEnd(item: Obstacles) {
  console.log(item)
}
// 重置选中元素
const resetSelectedElement = () => {
  selectedElement.value = {
    id: '',
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    radius: 0,
    fill: '#000',
    stroke: '#0077ff',
    strokeWidth: 2,
    type: 'circle',
  }
}
// 拖动时更新位置
function onDragMove(event: Konva.KonvaEventObject<DragEvent>, el: Obstacles) {
  const shape = event.target
  console.log(shape, el)
}

// 更新选中元素的配置
function updateSelectedElement() {}

// 动画绘制线条函数
function animateLineDrawing(line: Konva.Line, isHorizontal: boolean, duration: number) {
  const points = line.points()

  // 确保 points 是数字数组
  const start = isHorizontal ? points[0] : points[1]
  const end = isHorizontal ? points[2] : points[3]

  // 使用 Konva 自带的动画
  const animation = new Konva.Animation((frame: IFrame | undefined) => {
    const progress = Math.min(frame!.time / (duration * 1000), 1) // 计算进度
    const current = start + (end - start) * progress

    if (isHorizontal) {
      line.points([start, points[1], current, points[1]])
    } else {
      line.points([points[0], start, points[0], current])
    }

    if (progress === 1) {
      animation.stop() // 动画完成后停止
    }
  }, line.getLayer())

  animation.start()
}

// 四叉树分割函数
function drawQuadTreeWithAnimation(
  context: Konva.Layer,
  x: number,
  y: number,
  width: number,
  height: number,
  threshold: number,
  obstacles: Obstacles[],
  duration = 0.5,
) {
  // 检查当前区域是否包含障碍物
  const containsObstacle = obstacles.some((obstacle) => {
    const obstacleX = obstacle.x
    const obstacleY = obstacle.y
    const obstacleWidth = obstacle.width!
    const obstacleHeight = obstacle.height!

    return (
      obstacleX + obstacleWidth > x &&
      obstacleX < x + width &&
      obstacleY + obstacleHeight > y &&
      obstacleY < y + height
    )
  })

  // 如果区域不包含障碍物或已经达到最小分割阈值，则停止分割
  if (!containsObstacle || width <= threshold || height <= threshold) {
    return
  }

  // 计算分割线的中点
  const midX = x + width / 2
  const midY = y + height / 2

  // 创建水平和垂直分割线
  const horizontalLine = new Konva.Line({
    points: [x, midY, x + width, midY],
    stroke: dividColor.value,
    strokeWidth: 1,
  })

  const verticalLine = new Konva.Line({
    points: [midX, y, midX, y + height],
    stroke: dividColor.value,
    strokeWidth: 1,
  })

  context.add(horizontalLine)
  context.add(verticalLine)

  // 动画绘制分割线
  animateLineDrawing(horizontalLine, true, duration) // 水平线从左到右绘制
  animateLineDrawing(verticalLine, false, duration) // 垂直线从上到下绘制

  // 递归分割四个象限
  setTimeout(() => {
    drawQuadTreeWithAnimation(context, x, y, width / 2, height / 2, threshold, obstacles, duration)
    drawQuadTreeWithAnimation(
      context,
      midX,
      y,
      width / 2,
      height / 2,
      threshold,
      obstacles,
      duration,
    )
    drawQuadTreeWithAnimation(
      context,
      x,
      midY,
      width / 2,
      height / 2,
      threshold,
      obstacles,
      duration,
    )
    drawQuadTreeWithAnimation(
      context,
      midX,
      midY,
      width / 2,
      height / 2,
      threshold,
      obstacles,
      duration,
    )
  }, duration * 1000) // 延迟递归，等待当前分割动画完成
}

const clearCanvans = () => {
  const stage = Konva.stages[0]
  const layers = stage.getLayers()
  if (layers.length > 1) {
    layers[1].destroy()
  }
}
const allObstacles = computed(() => {
  return [
    ...circles.value.map((item) => {
      return {
        ...item,
        x: item.x - item.radius!,
        y: item.y - item.radius!,
        width: item.radius! * 2,
        height: item.radius! * 2,
      }
    }),
    ...rectangles.value.map((item) => {
      return {
        ...item,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
      }
    }),
  ]
})
// 在图层上绘制四叉树节点的中心点
function drawQuadTreeCenters(node: QuadTreeNode, layer: Konva.Layer): void {
  // 绘制当前节点的中心点
  const centerCircle = new Konva.Circle({
    x: node.centerX,
    y: node.centerY,
    radius: 3,
    fill: '#ff0000',
  });

  // 添加坐标文本
  const text = new Konva.Text({
    x: node.centerX + 5,
    y: node.centerY - 5,
    text: `${node.centerX.toFixed(0)}, ${node.centerY.toFixed(0)}`,
    fontSize: 10,
    fontFamily: 'Arial',
    fill: 'black'
  });

  layer.add(centerCircle);
  layer.add(text);

  // 递归绘制子节点的中心点
  if (node.children) {
    for (const child of node.children) {
      drawQuadTreeCenters(child, layer);
    }
  }
}
// 可视化四叉树分割
function visualizeQuadTreeWithAnimation() {
  clearCanvans()
  const layer = new Konva.Layer()
  const { width, height } = stageConfig.value

  // drawQuadTreeWithAnimation(layer, 0, 0, width, height, minThreshold.value, allObstacles.value)
  const rootNode = buildQuadTree(width,height,minThreshold.value,allObstacles.value)
  console.log(rootNode);
  const quadTreeAnimator = new QuadTreeAnimator(Konva.stages[0],layer,rootNode)

  Konva.stages[0].add(layer)
}
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
