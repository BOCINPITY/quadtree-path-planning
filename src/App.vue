<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import PlaybackControls from './components/PlaybackControls.vue'
import QuadTreeInspector from './components/QuadTreeInspector.vue'
import QuadTreeTopologyModal from './components/QuadTreeTopologyModal.vue'
import SelectControl from './components/SelectControl.vue'
import SpeedSelect from './components/SpeedSelect.vue'
import { buildLeafGraph, buildQuadTree, collectLeaves, findLeaf, findNode } from './core/quadtree'
import { searchPath } from './core/pathfinding'
import { presets } from './core/presets'
import { cellKey, centerOf, type Point, type SearchResult } from './core/types'
import { saveLocale, type AppLocale } from './i18n'

type Tool = 'inspect' | 'wall' | 'erase' | 'start' | 'goal'
type Algorithm = SearchResult['algorithm']
type AnimationPhase = 'idle' | 'searching' | 'settling' | 'path' | 'complete'
type AppTheme = 'light' | 'dark'

const MIN_GRID_SIZE = 8
const MAX_COLUMNS = 128
const MAX_ROWS = 80
const SEARCH_TICK = 36
const SEARCH_TARGET_STEPS = 45
const PATH_DURATION = 720
const SEARCH_SETTLE_DELAY = 180
const playbackSpeeds = [0.5, 1, 2, 4] as const
const { t, locale } = useI18n()
const theme = ref<AppTheme>(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
const presetOptions = computed(() => presets.map((preset) => ({
  value: preset.id,
  label: t(`presets.${preset.id}.name`),
})))
const activePresetDescription = computed(() => activePreset.value
  ? t(`presets.${activePreset.value}.description`)
  : t('app.customMap'))

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
const animationPhase = ref<AnimationPhase>('idle')
const pathProgress = ref(0)
const pathHead = ref<Point | null>(null)
const pathEl = ref<SVGPolylineElement | null>(null)
const selectedTreeNodeId = ref('q0')
const insightTab = ref<'tree' | 'results'>('tree')
const topologyOpen = ref(false)
let playbackTimer: number | undefined
let transitionTimer: number | undefined
let pathAnimationFrame: number | undefined
let animationGeneration = 0

function setLocale(next: AppLocale) {
  locale.value = next
  saveLocale(next)
}

function applyTheme(next: AppTheme, persist = true) {
  theme.value = next
  document.documentElement.dataset.theme = next
  document.documentElement.style.colorScheme = next
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.setAttribute('content', next === 'dark' ? '#0d0d0f' : '#f5f5f7')
  if (persist) localStorage.setItem('quadpath-theme', next)
}

function toggleTheme() {
  applyTheme(theme.value === 'dark' ? 'light' : 'dark')
}

applyTheme(theme.value, false)

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
const visitedNodes = computed(() => currentResult.value?.visitedOrder.slice(0, playbackStep.value) ?? [])
const frontierNode = computed(() => animationPhase.value === 'searching' ? visitedNodes.value.at(-1) ?? null : null)
const pathPoints = computed(() => {
  const result = currentResult.value
  if (!result?.found) return ''
  const points: Point[] = [cellCenter(start.value)]
  if (result.path.length > 1) points.push(...result.path.map(centerOf))
  points.push(cellCenter(goal.value))
  return points.map((point) => `${point.x},${point.y}`).join(' ')
})
const showPath = computed(() => Boolean(pathPoints.value) && ['path', 'complete'].includes(animationPhase.value))
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

function selectPreset(id: string) {
  activePreset.value = id
  loadPreset(id)
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
  pathProgress.value = 0
  pathHead.value = null
  animationPhase.value = 'idle'
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
  startResultAnimation()
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
  if (animationPhase.value === 'complete' || animationPhase.value === 'idle') {
    playbackStep.value = 0
    pathProgress.value = 0
    pathHead.value = null
    animationPhase.value = 'searching'
  }
  if (animationPhase.value === 'path') startPathAnimation()
  else if (animationPhase.value === 'settling') schedulePathAnimation()
  else startPlaybackTimer()
}

function startPlaybackTimer() {
  clearPlaybackHandles()
  const total = currentResult.value?.visitedOrder.length ?? 0
  if (total === 0) {
    finishSearchPhase()
    return
  }
  animationPhase.value = 'searching'
  isPlaying.value = true
  const stepSize = Math.max(1, Math.ceil(total / SEARCH_TARGET_STEPS))
  playbackTimer = window.setInterval(() => {
    playbackStep.value = Math.min(total, playbackStep.value + stepSize)
    if (playbackStep.value >= total) finishSearchPhase()
  }, SEARCH_TICK / playbackSpeed.value)
}

function finishSearchPhase() {
  if (playbackTimer !== undefined) window.clearInterval(playbackTimer)
  playbackTimer = undefined
  playbackStep.value = playbackTotal.value
  animationPhase.value = 'settling'
  schedulePathAnimation()
}

function schedulePathAnimation() {
  clearPlaybackHandles()
  isPlaying.value = true
  animationPhase.value = 'settling'
  transitionTimer = window.setTimeout(() => {
    transitionTimer = undefined
    if (currentResult.value?.found) startPathAnimation()
    else completeAnimation()
  }, SEARCH_SETTLE_DELAY / playbackSpeed.value)
}

function startPathAnimation() {
  clearPlaybackHandles()
  const generation = animationGeneration
  isPlaying.value = true
  animationPhase.value = 'path'
  nextTick(() => {
    if (generation !== animationGeneration || !isPlaying.value || animationPhase.value !== 'path') return
    let previous = performance.now()
    const frame = (now: number) => {
      if (generation !== animationGeneration || !isPlaying.value || animationPhase.value !== 'path') return
      const duration = PATH_DURATION / playbackSpeed.value
      pathProgress.value = Math.min(1, pathProgress.value + (now - previous) / duration)
      previous = now
      updatePathHead()
      if (pathProgress.value >= 1) completeAnimation()
      else pathAnimationFrame = window.requestAnimationFrame(frame)
    }
    updatePathHead()
    pathAnimationFrame = window.requestAnimationFrame(frame)
  })
}

function updatePathHead() {
  const line = pathEl.value
  if (!line || pathProgress.value <= 0 || pathProgress.value >= 1) {
    pathHead.value = null
    return
  }
  const length = line.getTotalLength()
  const point = line.getPointAtLength(length * pathProgress.value)
  pathHead.value = { x: point.x, y: point.y }
}

function completeAnimation() {
  clearPlaybackHandles()
  pathProgress.value = currentResult.value?.found ? 1 : 0
  pathHead.value = null
  animationPhase.value = 'complete'
  isPlaying.value = false
}

function startResultAnimation() {
  stopPlayback()
  playbackStep.value = 0
  pathProgress.value = 0
  pathHead.value = null
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    playbackStep.value = playbackTotal.value
    completeAnimation()
    return
  }
  animationPhase.value = 'searching'
  startPlaybackTimer()
}

function changePlaybackSpeed(speed: number) {
  const wasPlaying = isPlaying.value
  playbackSpeed.value = speed as (typeof playbackSpeeds)[number]
  if (!wasPlaying) return
  if (animationPhase.value === 'path') startPathAnimation()
  else if (animationPhase.value === 'settling') schedulePathAnimation()
  else startPlaybackTimer()
}

function stepPlayback(direction: -1 | 1) {
  stopPlayback()
  playbackStep.value = Math.min(playbackTotal.value, Math.max(0, playbackStep.value + direction))
  const atEnd = playbackStep.value >= playbackTotal.value
  animationPhase.value = atEnd ? 'complete' : 'searching'
  pathProgress.value = atEnd && currentResult.value?.found ? 1 : 0
  pathHead.value = null
}

function stopPlayback() {
  isPlaying.value = false
  clearPlaybackHandles()
}

function clearPlaybackHandles() {
  animationGeneration += 1
  if (playbackTimer !== undefined) window.clearInterval(playbackTimer)
  if (transitionTimer !== undefined) window.clearTimeout(transitionTimer)
  if (pathAnimationFrame !== undefined) window.cancelAnimationFrame(pathAnimationFrame)
  playbackTimer = undefined
  transitionTimer = undefined
  pathAnimationFrame = undefined
}

function onPlaybackInput() {
  stopPlayback()
  const atEnd = playbackStep.value >= playbackTotal.value
  animationPhase.value = atEnd ? 'complete' : 'searching'
  pathProgress.value = atEnd && currentResult.value?.found ? 1 : 0
  pathHead.value = null
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
  pathProgress.value = currentResult.value?.found ? 1 : 0
  animationPhase.value = currentResult.value ? 'complete' : 'idle'
  pathHead.value = null
})

onBeforeUnmount(stopPlayback)
loadPreset(activePreset.value)
</script>

<template>
  <main class="shell">
    <header class="hero">
      <div>
        <div class="eyebrow">{{ t('app.eyebrow') }}</div>
        <h1>QuadPath <em>v2</em></h1>
        <p>{{ t('app.tagline') }}</p>
      </div>
      <div class="hero-actions">
        <a class="site-back" href="/" :aria-label="t('app.backToSite')">← cles</a>
        <div class="language-switch" role="group" :aria-label="t('app.language')">
          <button :class="{ active: locale === 'zh-CN' }" :aria-pressed="locale === 'zh-CN'" @click="setLocale('zh-CN')">{{ t('app.languages.chinese') }}</button>
          <button :class="{ active: locale === 'en-US' }" :aria-pressed="locale === 'en-US'" @click="setLocale('en-US')">{{ t('app.languages.english') }}</button>
        </div>
        <button
          class="theme-toggle"
          type="button"
          :aria-label="t(theme === 'dark' ? 'app.theme.light' : 'app.theme.dark')"
          :title="t(theme === 'dark' ? 'app.theme.light' : 'app.theme.dark')"
          @click="toggleTheme"
        >
          <svg v-if="theme === 'dark'" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="3.5" stroke="currentColor" stroke-width="1.8" />
            <path d="M12 2.5v2M12 19.5v2M4.5 12h-2M21.5 12h-2M5.36 5.36 3.95 3.95M20.05 20.05l-1.41-1.41M18.64 5.36l1.41-1.41M3.95 20.05l1.41-1.41" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20.4 15.1A8.5 8.5 0 0 1 8.9 3.6 8.5 8.5 0 1 0 20.4 15.1Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
          </svg>
        </button>
        <label class="ghost-button file-button">{{ t('app.import') }}<input type="file" accept="application/json" @change="importMap" /></label>
        <button class="ghost-button" @click="exportMap">{{ t('app.export') }}</button>
      </div>
    </header>

    <section class="workspace">
      <aside class="panel controls">
        <section>
          <div class="section-label">{{ t('app.scenarios') }}</div>
          <SelectControl :model-value="activePreset" :options="presetOptions" :label="t('app.scenarios')" @update:model-value="selectPreset" />
          <p class="hint">{{ activePresetDescription }}</p>
        </section>

        <section>
          <div class="section-label">{{ t('app.gridSize') }}</div>
          <label class="size-control">
            <span>{{ t('app.columns') }}</span>
            <input :value="columns" type="range" :min="MIN_GRID_SIZE" :max="MAX_COLUMNS" step="1" @input="updateGridSize('columns', $event)" />
            <output>{{ columns }}</output>
          </label>
          <label class="size-control">
            <span>{{ t('app.rows') }}</span>
            <input :value="rows" type="range" :min="MIN_GRID_SIZE" :max="MAX_ROWS" step="1" @input="updateGridSize('rows', $event)" />
            <output>{{ rows }}</output>
          </label>
          <p class="grid-summary">{{ t('app.cellCount', { count: columns * rows }) }}</p>
        </section>

        <section>
          <div class="section-label">{{ t('app.editTools') }}</div>
          <div class="tool-grid">
            <button class="inspect-tool" :class="{ active: tool === 'inspect' }" @click="tool = 'inspect'"><span class="tool-icon inspect-swatch"></span>{{ t('app.tools.inspect') }}</button>
            <button :class="{ active: tool === 'wall' }" @click="tool = 'wall'"><span class="tool-icon wall-swatch"></span>{{ t('app.tools.wall') }}</button>
            <button :class="{ active: tool === 'erase' }" @click="tool = 'erase'"><span class="tool-icon erase-swatch"></span>{{ t('app.tools.erase') }}</button>
            <button :class="{ active: tool === 'start' }" @click="tool = 'start'"><span class="tool-icon start-dot"></span>{{ t('app.tools.start') }}</button>
            <button :class="{ active: tool === 'goal' }" @click="tool = 'goal'"><span class="tool-icon goal-dot"></span>{{ t('app.tools.goal') }}</button>
          </div>
          <p class="hint">{{ t('app.editHint') }}</p>
        </section>

        <section>
          <div class="section-label">{{ t('app.searchAlgorithm') }}</div>
          <div class="segmented">
            <button :class="{ active: algorithm === 'A*' }" @click="algorithm = 'A*'">A*</button>
            <button :class="{ active: algorithm === 'Dijkstra' }" @click="algorithm = 'Dijkstra'">Dijkstra</button>
          </div>
          <label class="switch-row">
            <span>{{ t('app.showBounds') }}</span>
            <input v-model="showQuadTree" type="checkbox" />
          </label>
        </section>

      </aside>

      <section class="panel stage-panel">
        <div class="stage-toolbar">
          <div class="legend">
            <span><i class="legend-start"></i>{{ t('app.legend.start') }}</span>
            <span><i class="legend-goal"></i>{{ t('app.legend.goal') }}</span>
            <span><i class="legend-visited"></i>{{ t('app.legend.visited') }}</span>
            <span><i class="legend-path"></i>{{ t('app.legend.path') }}</span>
          </div>
          <div class="stage-actions">
            <div class="dimensions">
              {{ columns }} × {{ rows }} {{ t('app.cells') }}
              <span v-if="hoverCell">· {{ hoverCell.x }}, {{ hoverCell.y }}</span>
            </div>
            <button class="run-inline" @click="runExperiments">{{ t('app.run') }} <span>→</span></button>
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
                <path d="M 1 0 L 0 0 0 1" fill="none" stroke="var(--grid-line)" stroke-width=".055" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="var(--map-bg)" />
            <rect width="100%" height="100%" fill="url(#grid)" />

            <rect
              v-for="node in visitedNodes"
              :key="`v-${node.id}`"
              class="visited-cell"
              :x="node.rect.x"
              :y="node.rect.y"
              :width="node.rect.width"
              :height="node.rect.height"
            />
            <rect
              v-if="frontierNode"
              class="search-frontier"
              :x="frontierNode.rect.x + .08"
              :y="frontierNode.rect.y + .08"
              :width="Math.max(0, frontierNode.rect.width - .16)"
              :height="Math.max(0, frontierNode.rect.height - .16)"
              rx=".14"
              pointer-events="none"
            />
            <rect
              v-for="cell in obstacleCells"
              :key="cell.key"
              :x="cell.x + .08"
              :y="cell.y + .08"
              width=".84"
              height=".84"
              rx=".12"
              fill="var(--obstacle)"
              stroke="var(--obstacle-stroke)"
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
            <polyline
              v-if="showPath"
              ref="pathEl"
              class="final-path"
              :points="pathPoints"
              pathLength="1"
              :style="{ strokeDashoffset: String(1 - pathProgress) }"
            />
            <circle v-if="animationPhase === 'settling' || animationPhase === 'path'" class="goal-arrival-ring" :cx="goal.x + .5" :cy="goal.y + .5" r=".56" />
            <circle v-if="pathHead" class="path-head" :cx="pathHead.x" :cy="pathHead.y" r=".22" />
            <circle class="endpoint-marker start-marker" :class="{ complete: animationPhase === 'complete' }" :cx="start.x + .5" :cy="start.y + .5" r=".34" />
            <circle class="endpoint-marker goal-marker" :class="{ complete: animationPhase === 'complete' }" :cx="goal.x + .5" :cy="goal.y + .5" r=".34" />
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
            @input="onPlaybackInput"
          />
          <span>{{ playbackStep }} / {{ playbackTotal }}</span>
          <SpeedSelect :model-value="playbackSpeed" :options="playbackSpeeds" @update:model-value="changePlaybackSpeed" />
        </div>
      </section>

      <aside class="panel insight-panel">
        <div class="insight-tabs" role="tablist" :aria-label="t('app.panelLabel')">
          <button :class="{ active: insightTab === 'tree' }" role="tab" :aria-selected="insightTab === 'tree'" @click="insightTab = 'tree'">{{ t('app.tabs.tree') }}</button>
          <button :class="{ active: insightTab === 'results' }" role="tab" :aria-selected="insightTab === 'results'" @click="insightTab = 'results'">{{ t('app.tabs.results') }}</button>
        </div>

        <QuadTreeInspector
          v-if="insightTab === 'tree'"
          :root="tree"
          :selected-id="selectedTreeNode.id"
          compact
          embedded
          @select="selectTreeNode"
          @open-topology="topologyOpen = true"
        />

        <section v-else class="side-results">
          <header>
            <div class="eyebrow">{{ t('app.metrics') }}</div>
            <h2>{{ t('app.comparison') }}</h2>
            <p>{{ t('app.comparisonHint') }}</p>
          </header>

          <article class="tree-summary-card">
            <div><span>{{ t('app.leafNodes') }}</span><b>{{ leaves.length }}</b></div>
            <div><span>{{ t('app.freeNodes') }}</span><b>{{ freeLeaves.length }}</b></div>
            <div><span>{{ t('app.maxDepth') }}</span><b>{{ maxDepth }}</b></div>
          </article>

          <article
            v-for="name in (['A*', 'Dijkstra'] as Algorithm[])"
            :key="name"
            class="algorithm-card"
            :class="{ selected: algorithm === name }"
            @click="algorithm = name"
          >
            <div class="algorithm-heading"><b>{{ name }}</b><span>{{ results[name]?.found ? t('app.status.found') : results[name] ? t('app.status.unreachable') : t('app.status.waiting') }}</span></div>
            <template v-if="results[name]">
              <strong>{{ displayedDistance(results[name]!).toFixed(2) }}</strong>
              <small>{{ t('app.pathLength') }}</small>
              <dl>
                <div><dt>{{ t('app.expandedNodes') }}</dt><dd>{{ results[name]!.visitedOrder.length }}</dd></div>
                <div><dt>{{ t('app.duration') }}</dt><dd>{{ results[name]!.durationMs.toFixed(3) }} ms</dd></div>
              </dl>
            </template>
            <p v-else>{{ t('app.runForMetrics') }}</p>
          </article>
        </section>
      </aside>
    </section>

    <footer>
      <span>QuadPath Lab</span>
      <span>{{ t('app.localOnly') }}</span>
    </footer>
  </main>

  <QuadTreeTopologyModal
    v-if="topologyOpen"
    :root="tree"
    :selected-id="selectedTreeNode.id"
    @select="selectTreeNode"
    @close="topologyOpen = false"
  />
</template>
