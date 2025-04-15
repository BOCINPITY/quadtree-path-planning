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
        <el-button class="operation-item" type="success" @click="visualizeQuadTreeWithAnimation"
          >四叉分割可视化</el-button
        >
      </div>
      <div id="stage" style="background-color: white"></div>
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { QTMapListItem, IComponentShapeType } from '@/@types/'
import { componentShapeList } from '@/utils/shapeIcons'
import Konva from 'konva'
import type { IFrame } from 'konva/lib/types'

const mapList = ref<QTMapListItem[]>()
const stage = ref<Konva.Stage>()
const obstaclesLayer = ref<Konva.Layer>()
const dividLayer = ref<Konva.Layer>()
const selectedMap = ref<string>('') //
const obstacles = ref<Konva.Shape[]>([]) //障碍物列表
const minThreshold = ref<number>(20) //最小分割阈值
const dividColor = ref<string>('#0077ff') //分割线颜色
const stageConfig = ref<{ width: number; height: number }>({
  width: 800,
  height: 600,
})

const init = () => {
  stage.value = new Konva.Stage({
    container: 'stage',
    width: stageConfig.value.width,
    height: stageConfig.value.height,
  })
  obstaclesLayer.value = new Konva.Layer({ name: 'obstaclesLayer' })
  dividLayer.value = new Konva.Layer({ name: 'dividLayer' })
  stage.value.add(obstaclesLayer.value)
  stage.value.add(dividLayer.value)
}
onMounted(() => {
  init()
})

// 在添加障碍物时绑定拖拽和缩放事件
const addObstacle = (shape: IComponentShapeType) => {
  let newShape
  switch (shape) {
    case 'circle':
      newShape = new Konva.Circle({
        name: 'circle',
        x: Math.round(Math.random() * stage.value?.attrs.width),
        y: Math.round(Math.random() * stage.value?.attrs.height),
        radius: 25,
        fill: '#00ff00',
        stroke: '#000000',
        strokeWidth: 0,
        draggable: true,
      })
      break
    case 'rectangle':
      newShape = new Konva.Rect({
        name: 'rectangle',
        x: Math.round(Math.random() * stage.value?.attrs.width),
        y: Math.round(Math.random() * stage.value?.attrs.height),
        width: 50,
        height: 50,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 0,
        draggable: true,
      })
      break
  }

  if (newShape) {
    obstacles.value.push(newShape)
    obstaclesLayer.value?.add(newShape)
  }
}

// 清理事件监听器
onBeforeUnmount(() => {
  obstacles.value.forEach((shape) => {
    shape.off('transform')
  })
})

//清除障碍物
const clearObstacles = () => {
  obstaclesLayer.value?.destroyChildren()
  obstacles.value = []
  dividLayer.value?.destroyChildren()
}

/**
 * 保存地图数据并且上传
 */
const saveObstacles = async () => {
  console.log('保存')
}

// 动画绘制线条函数
const animateLineDrawing = (line: Konva.Line, isHorizontal: boolean, duration: number) => {
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
const drawQuadTreeWithAnimation = (
  context: Konva.Layer,
  x: number,
  y: number,
  width: number,
  height: number,
  threshold: number,
  obstacles: Konva.Shape[],
  duration = 0.5,
) => {
  // 检查当前区域是否包含障碍物
  const containsObstacle = obstacles.some((obstacle) => {
    const obstacleX = obstacle.attrs.x
    const obstacleY = obstacle.attrs.y
    const obstacleWidth = obstacle.attrs.width || obstacle.attrs.radius * 2
    const obstacleHeight = obstacle.attrs.height || obstacle.attrs.radius * 2

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
const visualizeQuadTreeWithAnimation = () => {
  if (!stage.value || !dividLayer.value) return
  dividLayer.value.destroyChildren() // 清空之前的分割线
  const { width, height } = stage.value.attrs
  drawQuadTreeWithAnimation(
    dividLayer.value,
    0,
    0,
    width,
    height,
    minThreshold.value,
    obstacles.value as Konva.Shape[],
  )
  stage.value.add(dividLayer.value)
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
