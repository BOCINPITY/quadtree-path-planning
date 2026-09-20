<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { collectLeaves, collectNodes, findNode, findNodePath } from '../core/quadtree'
import type { NodeState, QuadNode } from '../core/types'

interface PositionedNode {
  node: QuadNode
  x: number
  y: number
  parentId: string | null
}

const props = defineProps<{
  root: QuadNode
  selectedId: string
}>()

const emit = defineEmits<{
  close: []
  select: [id: string]
}>()

const VB_W = 1000
const VB_H = 700
const V_GAP = 24
const H_GAP = 78
const MIN_ZOOM = 0.15
const MAX_ZOOM = 4

const stateLabels: Record<NodeState, string> = { free: '空闲', blocked: '障碍', mixed: '混合' }

const localSelectedId = ref(props.selectedId)
const collapsed = ref<Set<string>>(new Set())
const showLabels = ref(true)
const hoveredId = ref<string | null>(null)
const viewport = ref({ x: 0, y: 0, k: 1 })
const svgEl = ref<SVGSVGElement | null>(null)
const tooltip = reactive({ visible: false, x: 0, y: 0, node: null as QuadNode | null })

let previousBodyOverflow = ''
let panning = false
let panStart = { x: 0, y: 0, vx: 0, vy: 0 }

const allNodes = computed(() => collectNodes(props.root))
const leaves = computed(() => collectLeaves(props.root))
const maxDepth = computed(() => allNodes.value.reduce((max, node) => Math.max(max, node.depth), 0))
const selectedNode = computed(() => findNode(props.root, localSelectedId.value) ?? props.root)
const selectedPath = computed(() => findNodePath(props.root, selectedNode.value.id) ?? [props.root])
const selectedPathIds = computed(() => new Set(selectedPath.value.map((node) => node.id)))

const visibleNodes = computed<QuadNode[]>(() => {
  const result: QuadNode[] = []
  const visit = (node: QuadNode) => {
    result.push(node)
    if (!collapsed.value.has(node.id)) node.children.forEach(visit)
  }
  visit(props.root)
  return result
})

const layout = computed<PositionedNode[]>(() => {
  const yById = new Map<string, number>()
  let leafIndex = 0

  const assign = (node: QuadNode): number => {
    if (node.children.length === 0 || collapsed.value.has(node.id)) {
      const y = leafIndex * V_GAP
      leafIndex += 1
      yById.set(node.id, y)
      return y
    }
    const ys = node.children.map(assign)
    const y = (ys[0] + ys[ys.length - 1]) / 2
    yById.set(node.id, y)
    return y
  }
  assign(props.root)

  const parentById = new Map<string, string | null>()
  const buildParents = (node: QuadNode, parentId: string | null) => {
    parentById.set(node.id, parentId)
    if (!collapsed.value.has(node.id)) node.children.forEach((child) => buildParents(child, node.id))
  }
  buildParents(props.root, null)

  return visibleNodes.value.map((node) => ({
    node,
    x: node.depth * H_GAP,
    y: yById.get(node.id) ?? 0,
    parentId: parentById.get(node.id) ?? null,
  }))
})

const nodePositions = computed(() => new Map(layout.value.map((item) => [item.node.id, item])))

const edges = computed(() => {
  const positions = nodePositions.value
  return layout.value.flatMap((item) => {
    if (!item.parentId) return []
    const parent = positions.get(item.parentId)
    return parent ? [{ from: parent, to: item }] : []
  })
})

const hoveredDescendants = computed(() => {
  const ids = new Set<string>()
  const node = hoveredId.value ? findNode(props.root, hoveredId.value) : null
  if (!node) return ids
  const visit = (n: QuadNode) => {
    ids.add(n.id)
    if (!collapsed.value.has(n.id)) n.children.forEach(visit)
  }
  visit(node)
  return ids
})

const layoutBounds = computed(() => {
  if (layout.value.length === 0) return { minX: 0, maxX: 100, minY: 0, maxY: 100 }
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const item of layout.value) {
    minX = Math.min(minX, item.x)
    maxX = Math.max(maxX, item.x)
    minY = Math.min(minY, item.y)
    maxY = Math.max(maxY, item.y)
  }
  return { minX, maxX, minY, maxY }
})

const groupTransform = computed(() =>
  `translate(${viewport.value.x} ${viewport.value.y}) scale(${viewport.value.k})`,
)

function radiusFor(node: QuadNode): number {
  if (node.depth === 0) return 9
  return node.children.length ? 6 : 4.5
}

function labelFor(node: QuadNode): string {
  if (node.depth === 0) return '根'
  return node.children.length ? `D${node.depth}` : `${node.rect.width}×${node.rect.height}`
}

function fitViewport() {
  const { minX, maxX, minY, maxY } = layoutBounds.value
  const pad = 56
  const labelSpace = showLabels.value ? 66 : 6
  const nodeSpace = 12
  const left = minX - nodeSpace
  const right = maxX + nodeSpace + labelSpace
  const top = minY - nodeSpace
  const bottom = maxY + nodeSpace
  const width = Math.max(right - left, 80)
  const height = Math.max(bottom - top, 80)
  const k = Math.min((VB_W - pad) / width, (VB_H - pad) / height)
  const kc = Math.min(Math.max(k, MIN_ZOOM), 1.5)
  viewport.value = {
    k: kc,
    x: (VB_W - width * kc) / 2 - left * kc,
    y: (VB_H - height * kc) / 2 - top * kc,
  }
}

function toViewBox(event: PointerEvent | WheelEvent): { x: number; y: number } {
  const svg = svgEl.value
  if (!svg) return { x: 0, y: 0 }
  const rect = svg.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * VB_W,
    y: ((event.clientY - rect.top) / rect.height) * VB_H,
  }
}

function clampZoom(k: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k))
}

function onWheel(event: WheelEvent) {
  const point = toViewBox(event)
  const next = clampZoom(viewport.value.k * Math.exp(-event.deltaY * 0.0016))
  const ratio = next / viewport.value.k
  viewport.value = {
    k: next,
    x: point.x - ratio * (point.x - viewport.value.x),
    y: point.y - ratio * (point.y - viewport.value.y),
  }
}

function zoomBy(factor: number) {
  const point = { x: VB_W / 2, y: VB_H / 2 }
  const next = clampZoom(viewport.value.k * factor)
  const ratio = next / viewport.value.k
  viewport.value = {
    k: next,
    x: point.x - ratio * (point.x - viewport.value.x),
    y: point.y - ratio * (point.y - viewport.value.y),
  }
}

function onPointerDown(event: PointerEvent) {
  const target = event.target as Element
  if (target.closest('.topology-node')) return
  panning = true
  const point = toViewBox(event)
  panStart = { x: point.x, y: point.y, vx: viewport.value.x, vy: viewport.value.y }
  svgEl.value?.setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!panning) return
  const point = toViewBox(event)
  viewport.value.x = panStart.vx + (point.x - panStart.x)
  viewport.value.y = panStart.vy + (point.y - panStart.y)
}

function onPointerUp(event: PointerEvent) {
  if (!panning) return
  panning = false
  if (svgEl.value?.hasPointerCapture(event.pointerId)) {
    svgEl.value.releasePointerCapture(event.pointerId)
  }
}

function selectNode(node: QuadNode) {
  localSelectedId.value = node.id
  emit('select', node.id)
  const path = findNodePath(props.root, node.id) ?? []
  if (path.some((item) => collapsed.value.has(item.id))) {
    const next = new Set(collapsed.value)
    path.forEach((item) => next.delete(item.id))
    collapsed.value = next
  }
}

function toggleCollapse(node: QuadNode) {
  if (node.children.length === 0) return
  const next = new Set(collapsed.value)
  if (next.has(node.id)) next.delete(node.id)
  else next.add(node.id)
  collapsed.value = next
}

function locateOnMap() {
  emit('select', selectedNode.value.id)
  emit('close')
}

function onNodeEnter(node: QuadNode, event: MouseEvent) {
  hoveredId.value = node.id
  tooltip.visible = true
  tooltip.node = node
  tooltip.x = event.clientX
  tooltip.y = event.clientY
}

function onNodeMove(event: MouseEvent) {
  tooltip.x = event.clientX
  tooltip.y = event.clientY
}

function onNodeLeave() {
  hoveredId.value = null
  tooltip.visible = false
  tooltip.node = null
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

watch(() => props.selectedId, (id) => { localSelectedId.value = id })
watch(() => props.root, () => {
  collapsed.value = new Set()
  hoveredId.value = null
  tooltip.visible = false
  tooltip.node = null
  fitViewport()
})
watch(showLabels, () => fitViewport())

onMounted(() => {
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', handleKeydown)
  fitViewport()
})

onBeforeUnmount(() => {
  document.body.style.overflow = previousBodyOverflow
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" role="presentation" @pointerdown.self="$emit('close')">
      <section class="topology-modal" role="dialog" aria-modal="true" aria-labelledby="topology-title">
        <header class="modal-header">
          <div>
            <span>全局结构</span>
            <h2 id="topology-title">四叉树拓扑图</h2>
          </div>
          <div class="header-stats">
            <span><b>{{ allNodes.length }}</b>节点</span>
            <span><b>{{ leaves.length }}</b>叶节点</span>
            <span><b>{{ maxDepth }}</b>层深度</span>
          </div>
          <button class="close-button" aria-label="关闭拓扑图" @click="$emit('close')">×</button>
        </header>

        <div class="modal-body">
          <div class="canvas-wrap">
            <svg
              ref="svgEl"
              :viewBox="`0 0 ${VB_W} ${VB_H}`"
              aria-label="四叉树拓扑图"
              @wheel.prevent="onWheel"
              @pointerdown="onPointerDown"
              @pointermove="onPointerMove"
              @pointerup="onPointerUp"
              @pointercancel="onPointerUp"
            >
              <g :transform="groupTransform">
                <line
                  v-for="edge in edges"
                  :key="`${edge.from.node.id}-${edge.to.node.id}`"
                  :x1="edge.from.x"
                  :y1="edge.from.y"
                  :x2="edge.to.x"
                  :y2="edge.to.y"
                  :class="{ highlighted: selectedPathIds.has(edge.from.node.id) && selectedPathIds.has(edge.to.node.id) }"
                />
                <g
                  v-for="item in layout"
                  :key="item.node.id"
                  class="topology-node"
                  :class="[
                    `node-${item.node.state}`,
                    {
                      selected: item.node.id === selectedNode.id,
                      inPath: selectedPathIds.has(item.node.id),
                      hovered: hoveredDescendants.has(item.node.id),
                      dimmed: hoveredId !== null && !hoveredDescendants.has(item.node.id),
                      collapsed: collapsed.has(item.node.id),
                    },
                  ]"
                  :transform="`translate(${item.x} ${item.y})`"
                  role="button"
                  tabindex="0"
                  @click="selectNode(item.node)"
                  @keydown.enter="selectNode(item.node)"
                  @mouseenter="onNodeEnter(item.node, $event)"
                  @mousemove="onNodeMove"
                  @mouseleave="onNodeLeave"
                >
                  <circle class="node-dot" :r="radiusFor(item.node)" />
                  <text
                    v-if="showLabels"
                    class="node-label"
                    :x="radiusFor(item.node) + (item.node.children.length ? 22 : 8)"
                    dy="0.32em"
                  >{{ labelFor(item.node) }}</text>
                  <g
                    v-if="item.node.children.length"
                    class="node-toggle"
                    :transform="`translate(${radiusFor(item.node) + 8} 0)`"
                    @click.stop="toggleCollapse(item.node)"
                  >
                    <circle class="toggle-dot" r="8" />
                    <text class="toggle-glyph" dy="0.32em" text-anchor="middle">{{ collapsed.has(item.node.id) ? '+' : '−' }}</text>
                  </g>
                </g>
              </g>
            </svg>

            <div class="canvas-tools">
              <button @click="zoomBy(1.25)" aria-label="放大">＋</button>
              <button @click="zoomBy(0.8)" aria-label="缩小">－</button>
              <button class="fit-button" @click="fitViewport">适应</button>
              <label class="labels-toggle"><input v-model="showLabels" type="checkbox" /> 标签</label>
            </div>

            <div class="legend">
              <span><i class="mixed"></i>混合节点</span>
              <span><i class="free"></i>空闲叶节点</span>
              <span><i class="blocked"></i>障碍叶节点</span>
              <span><i class="selected"></i>当前路径</span>
              <span><i class="toggle"></i>点击 −/＋ 折叠</span>
            </div>
          </div>

          <aside class="topology-detail">
            <div class="detail-label">当前节点</div>
            <div class="detail-heading">
              <h3>{{ selectedNode.depth === 0 ? '根节点' : selectedNode.children.length ? `D${selectedNode.depth} 分区` : `D${selectedNode.depth} 叶节点` }}</h3>
              <b :class="`badge-${selectedNode.state}`">{{ stateLabels[selectedNode.state] }}</b>
            </div>

            <div class="path-list">
              <template v-for="(node, index) in selectedPath" :key="node.id">
                <button @click="selectNode(node)">{{ index === 0 ? '根' : `D${node.depth}` }}</button>
                <span v-if="index < selectedPath.length - 1">›</span>
              </template>
            </div>

            <dl>
              <div><dt>起点坐标</dt><dd>{{ selectedNode.rect.x }}, {{ selectedNode.rect.y }}</dd></div>
              <div><dt>覆盖范围</dt><dd>{{ selectedNode.rect.width }} × {{ selectedNode.rect.height }}</dd></div>
              <div><dt>节点深度</dt><dd>{{ selectedNode.depth }}</dd></div>
              <div><dt>子节点</dt><dd>{{ selectedNode.children.length }}</dd></div>
            </dl>

            <button v-if="selectedNode.children.length" class="collapse-button" @click="toggleCollapse(selectedNode)">
              {{ collapsed.has(selectedNode.id) ? '展开子树' : '折叠子树' }}
            </button>

            <p v-if="selectedNode.state === 'mixed'">混合节点会继续分割，紫色连线表示从根节点到当前节点的拓扑路径。</p>
            <p v-else>该叶节点状态一致，因此不再拥有子节点。</p>

            <button class="locate-button" @click="locateOnMap">定位到地图 <span>→</span></button>
          </aside>
        </div>
      </section>
    </div>
  </Teleport>

  <Teleport to="body">
    <div
      v-if="tooltip.visible && tooltip.node"
      class="node-tooltip"
      :style="{ left: `${tooltip.x + 16}px`, top: `${tooltip.y + 16}px` }"
    >
      <b>{{ tooltip.node.depth === 0 ? '根节点' : tooltip.node.children.length ? `D${tooltip.node.depth} 分区` : `D${tooltip.node.depth} 叶节点` }}</b>
      <span class="tooltip-state" :class="`badge-${tooltip.node.state}`">{{ stateLabels[tooltip.node.state] }}</span>
      <em>{{ tooltip.node.rect.x }}, {{ tooltip.node.rect.y }} · {{ tooltip.node.rect.width }}×{{ tooltip.node.rect.height }}</em>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.topology-modal {
  width: min(1160px, 100%);
  height: min(780px, 100%);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.68);
  border-radius: 22px;
  background: rgba(250, 250, 252, 0.97);
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.24);
}

.modal-header {
  display: grid;
  height: 76px;
  grid-template-columns: 1fr auto 36px;
  align-items: center;
  gap: 28px;
  border-bottom: 1px solid var(--separator);
  padding: 0 20px 0 24px;
}
.modal-header span, .detail-label { color: var(--blue); font-size: 10px; font-weight: 600; }
.modal-header h2 { margin: 3px 0 0; font-size: 21px; letter-spacing: -0.025em; }
.header-stats { display: flex; gap: 24px; }
.header-stats span { color: var(--tertiary); text-align: right; }
.header-stats b { display: block; margin-bottom: 2px; color: #1d1d1f; font-size: 15px; }
.close-button { width: 32px; height: 32px; border: 0; border-radius: 50%; background: #e8e8ed; color: #636366; font-size: 22px; cursor: pointer; }

.modal-body { display: grid; height: calc(100% - 76px); grid-template-columns: minmax(0, 1fr) 270px; }
.canvas-wrap { position: relative; min-width: 0; min-height: 0; overflow: hidden; background: #ffffff; }
svg { display: block; width: 100%; height: 100%; cursor: grab; touch-action: none; }
svg:active { cursor: grabbing; }
line { stroke: rgba(60, 60, 67, 0.18); stroke-width: 1; pointer-events: none; }
line.highlighted { stroke: #5856d6; stroke-width: 2.4; }

.topology-node { cursor: pointer; outline: none; }
.topology-node .node-dot { fill: #007aff; stroke: #ffffff; stroke-width: 1.5; transition: filter 140ms ease, opacity 140ms ease; }
.topology-node.node-free .node-dot { fill: #34c759; }
.topology-node.node-blocked .node-dot { fill: #8e8e93; }
.topology-node.inPath .node-dot { stroke: #5856d6; stroke-width: 2.5; }
.topology-node.selected .node-dot { fill: #5856d6; stroke: #ffffff; stroke-width: 3; filter: drop-shadow(0 0 5px rgba(88, 86, 214, 0.5)); }
.topology-node.hovered .node-dot { stroke: #007aff; stroke-width: 2.5; filter: drop-shadow(0 0 4px rgba(0, 122, 255, 0.55)); }
.topology-node.dimmed { opacity: 0.22; }

.node-label { fill: #6e6e73; font-size: 10px; font-weight: 500; user-select: none; }

.node-toggle { cursor: pointer; }
.node-toggle .toggle-dot { fill: #ffffff; stroke: rgba(60, 60, 67, 0.4); stroke-width: 1; transition: fill 140ms ease, stroke 140ms ease; }
.node-toggle:hover .toggle-dot { fill: #e8e8ed; stroke: #007aff; }
.node-toggle .toggle-glyph { fill: #636366; font-size: 11px; font-weight: 600; pointer-events: none; user-select: none; }

.canvas-tools {
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--separator);
  border-radius: 10px;
  padding: 5px;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.canvas-tools button {
  min-width: 26px;
  height: 26px;
  border: 0;
  border-radius: 7px;
  background: #f0f0f2;
  color: #1d1d1f;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}
.canvas-tools button:hover { background: #e8e8ed; }
.canvas-tools .fit-button { min-width: 42px; font-size: 11px; }
.labels-toggle { display: flex; align-items: center; gap: 5px; margin-left: 4px; padding: 0 8px; color: var(--secondary); font-size: 11px; cursor: pointer; }
.labels-toggle input { accent-color: var(--blue); width: 14px; height: 14px; margin: 0; }

.legend {
  position: absolute;
  bottom: 16px;
  left: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  border: 1px solid var(--separator);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.86);
  padding: 8px 10px;
  color: var(--secondary);
  font-size: 9px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.legend span { display: flex; align-items: center; gap: 5px; }
.legend i { width: 7px; height: 7px; border-radius: 50%; }
.legend .mixed { background: #007aff; }
.legend .free { background: #34c759; }
.legend .blocked { background: #8e8e93; }
.legend .selected { background: #5856d6; }
.legend .toggle { background: #ffffff; border: 1px solid rgba(60, 60, 67, 0.4); }

.topology-detail { overflow-y: auto; border-left: 1px solid var(--separator); padding: 24px 20px; background: rgba(247, 247, 249, 0.82); }
.detail-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 5px; }
.detail-heading h3 { margin: 0; font-size: 18px; }
.detail-heading b { border-radius: 999px; padding: 5px 8px; font-size: 9px; }
.badge-free { background: rgba(52, 199, 89, 0.12); color: #248a3d; }
.badge-blocked { background: rgba(142, 142, 147, 0.14); color: #636366; }
.badge-mixed { background: rgba(0, 122, 255, 0.11); color: #007aff; }
.path-list { display: flex; align-items: center; gap: 5px; overflow-x: auto; margin-top: 18px; padding-bottom: 4px; }
.path-list button { flex: none; border: 0; border-radius: 7px; background: #e8e8ed; padding: 5px 8px; color: var(--secondary); font-size: 9px; cursor: pointer; }
.path-list span { color: #aeaeb2; }
.topology-detail dl { grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 22px; }
.topology-detail p { margin: 20px 0 0; color: var(--secondary); font-size: 11px; line-height: 1.55; }
.collapse-button { width: 100%; margin-top: 16px; border: 0; border-radius: 9px; background: #e8e8ed; padding: 8px 12px; color: var(--secondary); font-size: 11px; font-weight: 500; cursor: pointer; }
.collapse-button:hover { background: #dedee3; }
.locate-button { display: flex; width: 100%; justify-content: space-between; margin-top: 24px; border: 0; border-radius: 10px; background: var(--blue); padding: 10px 12px; color: #ffffff; font-size: 12px; font-weight: 600; cursor: pointer; }

.node-tooltip {
  position: fixed;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 220px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 8px 10px;
  background: rgba(250, 250, 252, 0.9);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.14);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  pointer-events: none;
}
.node-tooltip b { font-size: 12px; }
.node-tooltip .tooltip-state { align-self: flex-start; border-radius: 999px; padding: 3px 7px; font-size: 9px; }
.node-tooltip em { font-style: normal; color: var(--secondary); font-size: 10px; }

@media (max-width: 760px) {
  .modal-backdrop { padding: 8px; }
  .topology-modal { border-radius: 16px; }
  .modal-header { grid-template-columns: 1fr 32px; }
  .header-stats { display: none; }
  .modal-body { grid-template-columns: 1fr; grid-template-rows: minmax(330px, 1fr) auto; overflow-y: auto; }
  .topology-detail { border-top: 1px solid var(--separator); border-left: 0; }
  .legend { right: 18px; }
}
</style>
