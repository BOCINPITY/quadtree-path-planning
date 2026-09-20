<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import PlaybackControls from './components/PlaybackControls.vue'
import QuadTreeInspector from './components/QuadTreeInspector.vue'
import SpeedSelect from './components/SpeedSelect.vue'
import { buildLeafGraph, buildQuadTree, collectLeaves, findLeaf, findNode } from './core/quadtree'
import { searchPath } from './core/pathfinding'
import { presets } from './core/presets'
import { cellKey, centerOf, type Point, type SearchResult } from './core/types'

type Tool = 'inspect' | 'wall' | 'erase' | 'start' | 'goal'
type Algorithm = SearchResult['algorithm']

const MIN_GRID_SIZE = 8
const MAX_COLUMNS = 128
const MAX_ROWS = 80
const PLAYBACK_INTERVAL = 55
const playbackSpeeds = [0.5, 1, 2, 4] as const

const activePreset = ref(presets[0].id)
const columns = ref(32)
const rows = ref(20)
const blocked = ref<Set<string>>(new Set())
const start = ref<Point>({ x: 2, y: 16 })
const goal = ref<Point>({ x: 29, y: 3 })
const tool = ref<Tool>('inspect')
const algorithm = ref<Algorithm>('A*')
const showQuadTree = ref(true)
const isDrawing = ref(false)
const hoverCell = ref<Point | null>(null)
const svg = ref<SVGSVGElement | null>(null)
const results = ref<Record<Algorithm, SearchResult | null>>({ 'A*': null, Dijkstra: null })
const playbackStep = ref(0)
const isPlaying = ref(false)
const playbackSpeed = ref<(typeof playbackSpeeds)[number]>(1)
const selectedTreeNodeId = ref('q0')
const insightTab = ref<'tree' | 'results'>('tree')
let playbackTimer: number | undefined

const tree = computed(() => buildQuadTree(columns.value, rows.value, blocked.value))
const leaves = computed(() => collectLeaves(tree.value))
const graph = computed(() => buildLeafGraph(leaves.value))
const freeLeaves = computed(() => leaves.value.filter((leaf) => leaf.state === 'free'))
const maxDepth = computed(() => Math.max(...leaves.value.map((leaf) => leaf.depth)))
const selectedTreeNode = computed(() => findNode(tree.value, selectedTreeNodeId.value) ?? tree.value)
const currentResult = computed(() => results.value[algorithm.value])
const playbackTotal = computed(() => currentResult.value?.visitedOrder.length ?? 0)
const canStepBack = computed(() => playbackStep.value > 0)
const canStepForward = computed(() => playbackStep.value < playbackTotal.value)
const visitedShown = computed(() => new Set(
  currentResult.value?.visitedOrder.slice(0, playbackStep.value).map((node) => node.id) ?? [],
))
const pathPoints = computed(() => {
  const result = currentResult.value
  if (!result?.found) return ''
  const points: Point[] = [cellCenter(start.value)]
  if (result.path.length > 1) points.push(...result.path.map(centerOf))
  points.push(cellCenter(goal.value))
  return points.map((point) => `${point.x},${point.y}`).join(' ')
})
const obstacleCells = computed(() => [...blocked.value].map((key) => {
  const [x, y] = key.split(',').map(Number)
  return { key, x, y }
}))

function cellCenter(point: Point): Point {
  return { x: point.x + 0.5, y: point.y + 0.5 }
}

function displayedDistance(result: SearchResult): number {
  if (!result.found) return 0
  if (result.path.length <= 1) {
    const a = cellCenter(start.value)
    const b = cellCenter(goal.value)
    return Math.hypot(a.x - b.x, a.y - b.y)
  }
  const first = centerOf(result.path[0])
  const last = centerOf(result.path[result.path.length - 1])
  const startCenter = cellCenter(start.value)
  const goalCenter = cellCenter(goal.value)
  return result.distance +
    Math.hypot(startCenter.x - first.x, startCenter.y - first.y) +
    Math.hypot(goalCenter.x - last.x, goalCenter.y - last.y)
}

function loadPreset(id: string) {
  const preset = presets.find((item) => item.id === id)
  if (!preset) return
  activePreset.value = id
  columns.value = preset.columns
  rows.value = preset.rows
  blocked.value = new Set(preset.blocked)
  start.value = { ...preset.start }
  goal.value = { ...preset.goal }
  clearResults()
  inspectPoint(start.value)
}

function updateGridSize(axis: 'columns' | 'rows', event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  const nextColumns = axis === 'columns' ? Math.min(MAX_COLUMNS, Math.max(MIN_GRID_SIZE, value)) : columns.value
  const nextRows = axis === 'rows' ? Math.min(MAX_ROWS, Math.max(MIN_GRID_SIZE, value)) : rows.value

  columns.value = nextColumns
  rows.value = nextRows
  blocked.value = new Set([...blocked.value].filter((key) => {
    const [x, y] = key.split(',').map(Number)
    return x < nextColumns && y < nextRows
  }))
  start.value = {
    x: Math.min(start.value.x, nextColumns - 1),
    y: Math.min(start.value.y, nextRows - 1),
  }
  goal.value = {
    x: Math.min(goal.value.x, nextColumns - 1),
    y: Math.min(goal.value.y, nextRows - 1),
  }

  if (cellKey(start.value.x, start.value.y) === cellKey(goal.value.x, goal.value.y)) {
    goal.value = { x: nextColumns - 1, y: nextRows - 1 }
  }
  blocked.value.delete(cellKey(start.value.x, start.value.y))
  blocked.value.delete(cellKey(goal.value.x, goal.value.y))
  blocked.value = new Set(blocked.value)
  activePreset.value = ''
  clearResults()
  inspectPoint(start.value)
}

function clearResults() {
  stopPlayback()
  results.value = { 'A*': null, Dijkstra: null }
  playbackStep.value = 0
}

function runExperiments() {
  const startNode = findLeaf(tree.value, cellCenter(start.value))
  const goalNode = findLeaf(tree.value, cellCenter(goal.value))
  if (!startNode || !goalNode || startNode.state !== 'free' || goalNode.state !== 'free') {
    clearResults()
    return
  }

  const nextResults = {
    'A*': searchPath('A*', startNode, goalNode, freeLeaves.value, graph.value),
    Dijkstra: searchPath('Dijkstra', startNode, goalNode, freeLeaves.value, graph.value),
  }
  results.value = nextResults
  playbackStep.value = nextResults[algorithm.value].visitedOrder.length
}

function cellFromPointer(event: PointerEvent): Point | null {
  if (!svg.value) return null
  const transform = svg.value.getScreenCTM()
  if (!transform) return null
  const pointer = svg.value.createSVGPoint()
  pointer.x = event.clientX
  pointer.y = event.clientY
  const local = pointer.matrixTransform(transform.inverse())
  const x = Math.floor(local.x)
  const y = Math.floor(local.y)
  if (x < 0 || y < 0 || x >= columns.value || y >= rows.value) return null
  return { x, y }
}

function paint(point: Point) {
  if (tool.value === 'inspect') return
  const key = cellKey(point.x, point.y)
  if (tool.value === 'start') {
    blocked.value.delete(key)
    blocked.value = new Set(blocked.value)
    start.value = point
  } else if (tool.value === 'goal') {
    blocked.value.delete(key)
    blocked.value = new Set(blocked.value)
    goal.value = point
  } else {
    if (key === cellKey(start.value.x, start.value.y) || key === cellKey(goal.value.x, goal.value.y)) return
    const next = new Set(blocked.value)
    if (tool.value === 'wall') next.add(key)
    else next.delete(key)
    blocked.value = next
  }
  clearResults()
}

function inspectPoint(point: Point) {
  const node = findLeaf(tree.value, cellCenter(point))
  selectedTreeNodeId.value = node?.id ?? tree.value.id
}

function selectTreeNode(id: string) {
  selectedTreeNodeId.value = findNode(tree.value, id)?.id ?? tree.value.id
}

function pointerDown(event: PointerEvent) {
  isDrawing.value = true
  const point = cellFromPointer(event)
  hoverCell.value = point
  if (point) {
    svg.value?.setPointerCapture(event.pointerId)
    paint(point)
    inspectPoint(point)
  }
}

function pointerMove(event: PointerEvent) {
  const point = cellFromPointer(event)
  hoverCell.value = point
  if (point && isDrawing.value && ['wall', 'erase'].includes(tool.value)) {
    paint(point)
    inspectPoint(point)
  }
}

function stopDrawing(event?: PointerEvent) {
  isDrawing.value = false
  if (event && svg.value?.hasPointerCapture(event.pointerId)) {
    svg.value.releasePointerCapture(event.pointerId)
  }
}

function leaveMap(event: PointerEvent) {
  stopDrawing(event)
  hoverCell.value = null
}

function togglePlayback() {
  if (!currentResult.value) return
  if (isPlaying.value) {
    stopPlayback()
    return
  }
  if (playbackStep.value >= currentResult.value.visitedOrder.length) playbackStep.value = 0
  isPlaying.value = true
  startPlaybackTimer()
}

function startPlaybackTimer() {
  if (playbackTimer !== undefined) window.clearInterval(playbackTimer)
  playbackTimer = window.setInterval(() => {
    const total = currentResult.value?.visitedOrder.length ?? 0
    playbackStep.value += 1
    if (playbackStep.value >= total) stopPlayback()
  }, PLAYBACK_INTERVAL / playbackSpeed.value)
}

function changePlaybackSpeed(speed: number) {
  playbackSpeed.value = speed as (typeof playbackSpeeds)[number]
  if (isPlaying.value) startPlaybackTimer()
}

function stepPlayback(direction: -1 | 1) {
  stopPlayback()
  playbackStep.value = Math.min(playbackTotal.value, Math.max(0, playbackStep.value + direction))
}

function stopPlayback() {
  isPlaying.value = false
  if (playbackTimer !== undefined) window.clearInterval(playbackTimer)
  playbackTimer = undefined
}

function exportMap() {
  const payload = JSON.stringify({
    version: 1,
    columns: columns.value,
    rows: rows.value,
    start: start.value,
    goal: goal.value,
    blocked: [...blocked.value],
  }, null, 2)
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'quadpath-map.json'
  anchor.click()
  URL.revokeObjectURL(url)
}

async function importMap(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const parsed = JSON.parse(await file.text()) as {
    columns: number
    rows: number
    start: Point
    goal: Point
    blocked: string[]
  }
  if (!Number.isInteger(parsed.columns) || !Number.isInteger(parsed.rows) || !Array.isArray(parsed.blocked)) return
  columns.value = Math.min(MAX_COLUMNS, Math.max(MIN_GRID_SIZE, parsed.columns))
  rows.value = Math.min(MAX_ROWS, Math.max(MIN_GRID_SIZE, parsed.rows))
  start.value = parsed.start
  goal.value = parsed.goal
  blocked.value = new Set(parsed.blocked)
  activePreset.value = ''
  clearResults()
  inspectPoint(start.value)
  input.value = ''
}

watch(algorithm, () => {
  stopPlayback()
  playbackStep.value = currentResult.value?.visitedOrder.length ?? 0
})

onBeforeUnmount(stopPlayback)
loadPreset(activePreset.value)
</script>

<template>
  <main class="shell">
    <header class="hero">
      <div>
        <div class="eyebrow">路径规划实验室</div>
        <h1>QuadPath <em>v2</em></h1>
        <p>把地图压缩成自适应空间，再观察搜索如何穿过它。</p>
      </div>
      <div class="hero-actions">
        <label class="ghost-button file-button">导入<input type="file" accept="application/json" @change="importMap" /></label>
        <button class="ghost-button" @click="exportMap">导出</button>
      </div>
    </header>

    <section class="workspace">
      <aside class="panel controls">
        <section>
          <div class="section-label">测试场景</div>
          <select v-model="activePreset" @change="loadPreset(activePreset)">
            <option v-for="preset in presets" :key="preset.id" :value="preset.id">{{ preset.name }}</option>
          </select>
          <p class="hint">{{ presets.find((item) => item.id === activePreset)?.description ?? '自定义导入地图' }}</p>
        </section>

        <section>
          <div class="section-label">网格尺寸</div>
          <label class="size-control">
            <span>列</span>
            <input :value="columns" type="range" :min="MIN_GRID_SIZE" :max="MAX_COLUMNS" step="1" @input="updateGridSize('columns', $event)" />
            <output>{{ columns }}</output>
          </label>
          <label class="size-control">
            <span>行</span>
            <input :value="rows" type="range" :min="MIN_GRID_SIZE" :max="MAX_ROWS" step="1" @input="updateGridSize('rows', $event)" />
            <output>{{ rows }}</output>
          </label>
          <p class="grid-summary">共 {{ columns * rows }} 个单元格</p>
        </section>

        <section>
          <div class="section-label">编辑工具</div>
          <div class="tool-grid">
            <button class="inspect-tool" :class="{ active: tool === 'inspect' }" @click="tool = 'inspect'"><span>◎</span>观察节点</button>
            <button :class="{ active: tool === 'wall' }" @click="tool = 'wall'"><span>▦</span>障碍</button>
            <button :class="{ active: tool === 'erase' }" @click="tool = 'erase'"><span>◇</span>擦除</button>
            <button :class="{ active: tool === 'start' }" @click="tool = 'start'"><span class="start-dot"></span>起点</button>
            <button :class="{ active: tool === 'goal' }" @click="tool = 'goal'"><span class="goal-dot"></span>终点</button>
          </div>
          <p class="hint">观察模式用于定位树节点；编辑地图后四叉树会实时重建。</p>
        </section>

        <section>
          <div class="section-label">搜索算法</div>
          <div class="segmented">
            <button :class="{ active: algorithm === 'A*' }" @click="algorithm = 'A*'">A*</button>
            <button :class="{ active: algorithm === 'Dijkstra' }" @click="algorithm = 'Dijkstra'">Dijkstra</button>
          </div>
          <label class="switch-row">
            <span>显示四叉树边界</span>
            <input v-model="showQuadTree" type="checkbox" />
          </label>
        </section>

      </aside>

      <section class="panel stage-panel">
        <div class="stage-toolbar">
          <div class="legend">
            <span><i class="legend-start"></i>起点</span>
            <span><i class="legend-goal"></i>终点</span>
            <span><i class="legend-visited"></i>已扩展</span>
            <span><i class="legend-path"></i>最终路径</span>
          </div>
          <div class="stage-actions">
            <div class="dimensions">
              {{ columns }} × {{ rows }} cells
              <span v-if="hoverCell">· {{ hoverCell.x }}, {{ hoverCell.y }}</span>
            </div>
            <button class="run-inline" @click="runExperiments">运行 <span>→</span></button>
          </div>
        </div>

        <div class="map-wrap">
          <svg
            ref="svg"
            class="map"
            :viewBox="`0 0 ${columns} ${rows}`"
            preserveAspectRatio="xMidYMid meet"
            @pointerdown="pointerDown"
            @pointermove="pointerMove"
            @pointerup="stopDrawing"
            @pointerleave="leaveMap"
          >
            <defs>
              <pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse">
                <path d="M 1 0 L 0 0 0 1" fill="none" stroke="rgba(60,60,67,.34)" stroke-width=".055" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="#f7f7f9" />
            <rect width="100%" height="100%" fill="url(#grid)" />

            <rect
              v-for="node in freeLeaves"
              v-show="visitedShown.has(node.id)"
              :key="`v-${node.id}`"
              :x="node.rect.x"
              :y="node.rect.y"
              :width="node.rect.width"
              :height="node.rect.height"
              fill="rgba(0,122,255,.14)"
            />
            <rect
              v-for="cell in obstacleCells"
              :key="cell.key"
              :x="cell.x + .08"
              :y="cell.y + .08"
              width=".84"
              height=".84"
              rx=".12"
              fill="#8e8e93"
              stroke="#636366"
              stroke-width=".06"
            />
            <g v-if="showQuadTree" class="quadtree-lines">
              <rect
                v-for="node in leaves"
                :key="node.id"
                :x="node.rect.x"
                :y="node.rect.y"
                :width="node.rect.width"
                :height="node.rect.height"
                fill="none"
                :stroke="node.state === 'blocked' ? 'rgba(255,59,48,.24)' : 'rgba(0,122,255,.55)'"
                stroke-width=".075"
              />
            </g>
            <rect
              :x="selectedTreeNode.rect.x + .04"
              :y="selectedTreeNode.rect.y + .04"
              :width="Math.max(0, selectedTreeNode.rect.width - .08)"
              :height="Math.max(0, selectedTreeNode.rect.height - .08)"
              rx=".12"
              fill="rgba(88,86,214,.08)"
              stroke="#5856d6"
              stroke-width=".16"
              pointer-events="none"
            />
            <polyline v-if="pathPoints" :points="pathPoints" fill="none" stroke="#ff9f0a" stroke-width=".22" stroke-linecap="round" stroke-linejoin="round" />
            <circle :cx="start.x + .5" :cy="start.y + .5" r=".34" fill="#34c759" stroke="#ffffff" stroke-width=".12" />
            <circle :cx="goal.x + .5" :cy="goal.y + .5" r=".34" fill="#ff3b30" stroke="#ffffff" stroke-width=".12" />
            <rect
              v-if="hoverCell"
              :x="hoverCell.x + .04"
              :y="hoverCell.y + .04"
              width=".92"
              height=".92"
              rx=".1"
              fill="rgba(0,122,255,.08)"
              stroke="#007aff"
              stroke-width=".11"
              pointer-events="none"
            />
          </svg>
        </div>

        <div class="playback">
          <PlaybackControls
            :disabled="!currentResult"
            :playing="isPlaying"
            :can-step-back="canStepBack"
            :can-step-forward="canStepForward"
            @step-back="stepPlayback(-1)"
            @toggle="togglePlayback"
            @step-forward="stepPlayback(1)"
          />
          <input
            v-model.number="playbackStep"
            type="range"
            min="0"
            :max="playbackTotal"
            :disabled="!currentResult"
          />
          <span>{{ playbackStep }} / {{ playbackTotal }}</span>
          <SpeedSelect :model-value="playbackSpeed" :options="playbackSpeeds" @update:model-value="changePlaybackSpeed" />
        </div>
      </section>

      <aside class="panel insight-panel">
        <div class="insight-tabs" role="tablist" aria-label="观察面板">
          <button :class="{ active: insightTab === 'tree' }" role="tab" :aria-selected="insightTab === 'tree'" @click="insightTab = 'tree'">树结构</button>
          <button :class="{ active: insightTab === 'results' }" role="tab" :aria-selected="insightTab === 'results'" @click="insightTab = 'results'">算法结果</button>
        </div>

        <QuadTreeInspector
          v-if="insightTab === 'tree'"
          :root="tree"
          :selected-id="selectedTreeNode.id"
          compact
          embedded
          @select="selectTreeNode"
        />

        <section v-else class="side-results">
          <header>
            <div class="eyebrow">运行指标</div>
            <h2>算法对比</h2>
            <p>在同一张地图上对比两种搜索策略。</p>
          </header>

          <article class="tree-summary-card">
            <div><span>叶节点</span><b>{{ leaves.length }}</b></div>
            <div><span>自由节点</span><b>{{ freeLeaves.length }}</b></div>
            <div><span>最大深度</span><b>{{ maxDepth }}</b></div>
          </article>

          <article
            v-for="name in (['A*', 'Dijkstra'] as Algorithm[])"
            :key="name"
            class="algorithm-card"
            :class="{ selected: algorithm === name }"
            @click="algorithm = name"
          >
            <div class="algorithm-heading"><b>{{ name }}</b><span>{{ results[name]?.found ? '已找到' : results[name] ? '不可达' : '等待运行' }}</span></div>
            <template v-if="results[name]">
              <strong>{{ displayedDistance(results[name]!).toFixed(2) }}</strong>
              <small>路径长度</small>
              <dl>
                <div><dt>扩展节点</dt><dd>{{ results[name]!.visitedOrder.length }}</dd></div>
                <div><dt>计算耗时</dt><dd>{{ results[name]!.durationMs.toFixed(3) }} ms</dd></div>
              </dl>
            </template>
            <p v-else>运行实验后显示真实指标</p>
          </article>
        </section>
      </aside>
    </section>

    <footer>
      <span>QuadPath Lab</span>
      <span>所有计算均在本地完成</span>
    </footer>
  </main>
</template>
