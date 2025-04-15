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
      <div class="title">云端地图</div>
      <div class="map-list">
        <el-select v-model="selectedMap" placeholder="请选择地图">
          <el-option
            v-for="item in mapList"
            :key="item._id"
            :label="item._id"
            :value="item._id"
          ></el-option>
        </el-select>
        <el-button type="default">加载地图</el-button>
      </div>
    </div>

    <div class="content">
      <div class="operation">
        <el-button class="operation-item" type="danger" @click="clearObstacles"
          >清空障碍物</el-button
        >
        <el-button class="operation-item" type="primary" @click="saveObstacles"
          >保存并上传</el-button
        >
        <el-button
          class="operation-item"
          type="success"
          @click="visualizeQuadTreeWithAnimation"
          >四叉分割可视化</el-button
        >
      </div>
      <v-stage :config="stageConfig" style="background: #fff">
        <v-layer>
          <v-circle
            v-for="(circle, index) in obstacles.circles"
            :key="`circle-${index}`"
            :config="circle"
            @dragstart="handleDragStart($event, circle.type, index)"
            @dragend="handleDragEnd(circle.type, index)"
            @dragmove="onDragMove($event, circle.type, index)"
            @click="selectObstacle(circle.type, index)"
          />
          <v-rect
            v-for="(rect, index) in obstacles.rectangles"
            :key="`rect-${index}`"
            :config="rect"
            @dragstart="handleDragStart($event, rect.type, index)"
            @dragend="handleDragEnd(rect.type, index)"
            @dragmove="onDragMove($event, rect.type, index)"
            @click="selectObstacle(rect.type, index)"
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
            v-model.number="selectedElement.config.x"
            @input="updateSelectedElement"
          />
        </div>
        <div class="props-item">
          <div class="label">Position:Y</div>
          <el-input
            type="number"
            v-model.number="selectedElement.config.y"
            @input="updateSelectedElement"
          />
        </div>
        <div class="props-item" v-show="selectedElement.type === 'circle'">
          <div class="label">半径</div>
          <el-input
            type="number"
            v-model.number="(selectedElement.config as CircleConfig).radius"
            @input="updateSelectedElement"
          />
        </div>
        <div class="props-item" v-show="selectedElement.type === 'rectangle'">
          <div class="label">宽度</div>
          <el-input
            type="number"
            v-model.number="(selectedElement.config as RectangleConfig).width"
            @input="updateSelectedElement"
          />
        </div>
        <div class="props-item" v-show="selectedElement.type === 'rectangle'">
          <div class="label">高度</div>
          <el-input
            type="number"
            v-model.number="(selectedElement.config as RectangleConfig).height"
            @input="updateSelectedElement"
          />
        </div>
        <div class="props-item">
          <div class="label">填充颜色</div>
          <el-color-picker
            v-model.trim="selectedElement.config.fill"
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type Ref, onMounted } from 'vue'
import type { RectangleConfig, CircleConfig, INode, QTMapListItem } from '@/@types/'
import { componentShapeList } from '@/utils/shapeIcons'
import Konva from 'konva'

import type { IFrame } from 'konva/lib/types'
import { createMap, getMapList } from '@/http/map'
const mapList = ref<QTMapListItem[]>()
const stageConfig = ref({
  width: 820,
  height: 580,
})
const selectedMap = ref<string>('')
onMounted(async () => {
  const res = await getMapList()
  console.log(res)
})
//最小分割阈值
const minThreshold = ref<number>(20)
const dividColor = ref<string>('#0077ff')
const selectedElement = ref<{
  type: 'circle' | 'rectangle' | '无'
  index: number
  config: INode
}>({
  type: '无',
  index: -1,
  config: {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    radius: 0,
    fill: '#000',
    stroke: '#000',
    strokeWidth: 2,
    draggable: true,
    isDragging: false,
  },
})

const obstacles: Ref<{
  circles: CircleConfig[]
  rectangles: RectangleConfig[]
}> = ref({
  circles: [],
  rectangles: [],
})

function addObstacle(type: string) {
  if (type === 'circle') {
    obstacles.value.circles.push({
      type: 'circle',
      x: 100,
      y: 100,
      radius: 50,
      fill: 'black',
      stroke: 'black',
      strokeWidth: 0,
      draggable: true,
      isDragging: false,
    })
  } else if (type === 'rectangle') {
    obstacles.value.rectangles.push({
      type: 'rectangle',
      x: 200,
      y: 150,
      width: 100,
      height: 100,
      fill: 'black',
      stroke: 'black',
      strokeWidth: 0,
      draggable: true,
      isDragging: false,
    })
  }
}
const clearObstacles = () => {
  obstacles.value.circles = []
  obstacles.value.rectangles = []
}
// 更新障碍物样式
function updateObstacleStyle(
  type: 'circle' | 'rectangle',
  index: number,
  style: Partial<CircleConfig | RectangleConfig>,
) {
  if (type === 'circle') {
    Object.assign(obstacles.value.circles[index], style)
  } else if (type === 'rectangle') {
    Object.assign(obstacles.value.rectangles[index], style)
  }
}

// 选择障碍物
function selectObstacle(type: 'circle' | 'rectangle', index: number) {
  // Reset previous selection
  if (selectedElement.value.type !== '无') {
    updateObstacleStyle(selectedElement.value.type, selectedElement.value.index, {
      stroke: 'black',
      strokeWidth: 0,
    })
  }

  // Highlight the new selection
  updateObstacleStyle(type, index, {
    stroke: '#0077ff',
    strokeWidth: 2,
  })

  // Update selected element
  const target =
    type === 'circle' ? obstacles.value.circles[index] : obstacles.value.rectangles[index]
  selectedElement.value = {
    type,
    index,
    config: { ...target },
  }
}

// 拖动开始时的处理函数
function handleDragStart(
  event: Konva.KonvaEventObject<DragEvent>,
  type: 'circle' | 'rectangle',
  index: number,
) {
  updateObstacleStyle(type, index, {
    isDragging: true,
    stroke: '#0077ff',
    strokeWidth: 2,
  })
  selectObstacle(type, index)
}

function handleDragEnd(type: 'circle' | 'rectangle', index: number) {
  updateObstacleStyle(type, index, {
    isDragging: false,
    strokeWidth: 0,
  })
  resetSelectedElement()
}
// 重置选中元素
function resetSelectedElement() {
  selectedElement.value.type = '无'
  selectedElement.value.index = -1
  selectedElement.value.config = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    radius: 0,
    fill: '#000',
    stroke: '#000',
    strokeWidth: 2,
    draggable: true,
    isDragging: false,
  }
}
// 拖动时更新位置
function onDragMove(
  event: Konva.KonvaEventObject<DragEvent>,
  type: 'circle' | 'rectangle',
  index: number,
) {
  const shape = event.target
  const { x, y } = shape.position()
  if (type === 'circle') {
    obstacles.value.circles[index].x = x
    obstacles.value.circles[index].y = y
    if (selectedElement.value?.type === 'circle' && selectedElement.value.index === index) {
      selectedElement.value.config.x = x
      selectedElement.value.config.y = y
    }
  } else if (type === 'rectangle') {
    obstacles.value.rectangles[index].x = x
    obstacles.value.rectangles[index].y = y
    if (selectedElement.value?.type === 'rectangle' && selectedElement.value.index === index) {
      selectedElement.value.config.x = x
      selectedElement.value.config.y = y
    }
  }
}

// 更新选中元素的配置
function updateSelectedElement() {
  const { type, index, config } = selectedElement.value
  if (type === 'circle') {
    obstacles.value.circles[index] = { ...config } as CircleConfig
  } else if (type === 'rectangle') {
    obstacles.value.rectangles[index] = { ...config } as RectangleConfig
  }
}

const saveObstacles = async () => {
  const data = {
    width: stageConfig.value?.width,
    height: stageConfig.value?.height,
    obstacles: {
      circle: [
        ...obstacles.value.circles.map((item) => {
          return {
            shape: item.type,
            x: item.x,
            y: item.y,
            radius: item.radius,
            fill: item.fill,
            stroke: item.stroke,
            strokeWidth: item.strokeWidth,
          }
        }),
      ],
      rectangle: [
        ...obstacles.value.rectangles.map((item) => {
          return {
            shape: item.type,
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
            fill: item.fill,
            stroke: item.stroke,
            strokeWidth: item.strokeWidth,
          }
        }),
      ],
    },
  }
  const res = await createMap(data)
  console.log(res)
}

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
  obstacles: { x: number; y: number; width: number; height: number; radius?: number }[],
  duration = 0.5,
) {
  // 检查当前区域是否包含障碍物
  const containsObstacle = obstacles.some((obstacle) => {
    const obstacleX = obstacle.x
    const obstacleY = obstacle.y
    const obstacleWidth = obstacle.width || obstacle.radius! * 2
    const obstacleHeight = obstacle.height || obstacle.radius! * 2

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

// 可视化四叉树分割
function visualizeQuadTreeWithAnimation() {
  const stage = Konva.stages[0] // 假设第一个 stage 是画板
  //判断layer的数量
  const layers = stage.getLayers()
  if (layers.length > 1) {
    layers[1].destroy() // 删除之前的图层
  }
  const layer = new Konva.Layer()

  const { width, height } = stage.size()
  // 获取所有障碍物
  const allObstacles = [
    ...obstacles.value.circles.map((circle) => ({
      x: circle.x - circle.radius,
      y: circle.y - circle.radius,
      width: circle.radius * 2,
      height: circle.radius * 2,
    })),
    ...obstacles.value.rectangles,
  ]

  drawQuadTreeWithAnimation(layer, 0, 0, width, height, minThreshold.value, allObstacles)

  stage.add(layer)
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
