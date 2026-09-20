<script setup lang="ts">
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, select, zoom, zoomIdentity, type Simulation, type SimulationLinkDatum, type SimulationNodeDatum, type ZoomBehavior } from 'd3'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { collectLeaves, collectNodes, findNode, findNodePath } from '../core/quadtree'
import type { QuadNode } from '../core/types'

interface GraphNode extends SimulationNodeDatum { id: string; node: QuadNode; parentId: string | null; targetX: number; hiddenCount: number }
interface GraphLink extends SimulationLinkDatum<GraphNode> { source: GraphNode | string; target: GraphNode | string }

const props = defineProps<{ root: QuadNode; selectedId: string }>()
const emit = defineEmits<{ close: []; select: [id: string] }>()
const { t } = useI18n()
const VB_W = 1000
const VB_H = 700
const LAYER_GAP = 132
const INITIAL_NODE_LIMIT = 90
const MIN_ZOOM = 0.18
const MAX_ZOOM = 4

const localSelectedId = ref(props.selectedId)
const collapsed = ref<Set<string>>(new Set())
const showLabels = ref(true)
const hoveredId = ref<string | null>(null)
const graphNodes = ref<GraphNode[]>([])
const graphLinks = ref<GraphLink[]>([])
const transform = ref(zoomIdentity)
const svgEl = ref<SVGSVGElement | null>(null)
const windowEl = ref<HTMLElement | null>(null)
const tickVersion = ref(0)
const tooltip = reactive({ visible: false, x: 0, y: 0, node: null as QuadNode | null })
const windowPosition = reactive({ x: 16, y: 16 })
let simulation: Simulation<GraphNode, GraphLink> | null = null
let zoomBehavior: ZoomBehavior<SVGSVGElement, unknown> | null = null
let dragging: { node: GraphNode; pointerId: number } | null = null
let movingWindow: { pointerId: number; offsetX: number; offsetY: number } | null = null

const allNodes = computed(() => collectNodes(props.root))
const leaves = computed(() => collectLeaves(props.root))
const maxDepth = computed(() => allNodes.value.reduce((max, node) => Math.max(max, node.depth), 0))
const selectedNode = computed(() => findNode(props.root, localSelectedId.value) ?? props.root)
const selectedPath = computed(() => findNodePath(props.root, selectedNode.value.id) ?? [props.root])
const selectedPathIds = computed(() => new Set(selectedPath.value.map((node) => node.id)))
const visibleNodes = computed(() => {
  const result: Array<{ node: QuadNode; parentId: string | null }> = []
  const visit = (node: QuadNode, parentId: string | null) => {
    result.push({ node, parentId })
    if (!collapsed.value.has(node.id)) node.children.forEach((child) => visit(child, node.id))
  }
  visit(props.root, null)
  return result
})
const hoveredDescendants = computed(() => {
  const ids = new Set<string>()
  const node = hoveredId.value ? findNode(props.root, hoveredId.value) : null
  const visit = (item: QuadNode) => { ids.add(item.id); if (!collapsed.value.has(item.id)) item.children.forEach(visit) }
  if (node) visit(node)
  return ids
})
const renderedNodes = computed(() => { void tickVersion.value; return graphNodes.value })
const renderedLinks = computed(() => { void tickVersion.value; return graphLinks.value.map((link) => ({ source: link.source as GraphNode, target: link.target as GraphNode })) })

function descendantCount(node: QuadNode): number { return node.children.reduce((sum, child) => sum + 1 + descendantCount(child), 0) }
function initialCollapsed(root: QuadNode): Set<string> {
  const nodes = collectNodes(root)
  const nodeLimit = window.innerWidth <= 760 ? 40 : INITIAL_NODE_LIMIT
  let cutoff = 2
  while (cutoff < maxDepth.value && nodes.filter((node) => node.depth <= cutoff).length <= nodeLimit) cutoff += 1
  const safeCutoff = Math.max(1, cutoff - 1)
  return new Set(nodes.filter((node) => node.depth === safeCutoff && node.children.length).map((node) => node.id))
}
function initialYPositions() {
  const yById = new Map<string, number>()
  let leafIndex = 0
  const visit = (node: QuadNode): number => {
    if (!node.children.length || collapsed.value.has(node.id)) {
      const y = leafIndex++ * 30
      yById.set(node.id, y)
      return y
    }
    const ys = node.children.map(visit)
    const y = (ys[0] + ys[ys.length - 1]) / 2
    yById.set(node.id, y)
    return y
  }
  visit(props.root)
  const offset = VB_H / 2 - Math.max(0, (leafIndex - 1) * 30) / 2
  yById.forEach((value, key) => yById.set(key, value + offset))
  return yById
}
function buildSimulation() {
  simulation?.stop()
  const previous = new Map(graphNodes.value.map((node) => [node.id, node]))
  const yById = initialYPositions()
  const nodes: GraphNode[] = visibleNodes.value.map(({ node, parentId }) => {
    const old = previous.get(node.id)
    return { id: node.id, node, parentId, targetX: 68 + node.depth * LAYER_GAP, hiddenCount: collapsed.value.has(node.id) ? descendantCount(node) : 0, x: old?.x ?? 68 + node.depth * LAYER_GAP, y: old?.y ?? yById.get(node.id) ?? VB_H / 2 }
  })
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const links: GraphLink[] = nodes.flatMap((node) => { const parent = node.parentId ? byId.get(node.parentId) : null; return parent ? [{ source: parent, target: node }] : [] })
  graphNodes.value = nodes
  graphLinks.value = links
  simulation = forceSimulation<GraphNode>(nodes)
    .force('link', forceLink<GraphNode, GraphLink>(links).id((node) => node.id).distance(68).strength(.45))
    .force('charge', forceManyBody().strength(nodes.length > 500 ? -25 : -48).distanceMax(170))
    .force('collision', forceCollide<GraphNode>().radius((node) => showLabels.value && node.node.children.length ? 24 : 12).strength(.9))
    .force('layer', forceX<GraphNode>((node) => node.targetX).strength(.92))
    .force('centerY', forceY<GraphNode>(VB_H / 2).strength(.018))
    .alphaDecay(nodes.length > 500 ? .08 : .045).velocityDecay(.36)
    .on('tick', () => { tickVersion.value += 1 })
    .on('end', () => { tickVersion.value += 1; fitViewport() })
  tickVersion.value += 1
  nextTick(fitViewport)
}
function setupZoom() {
  if (!svgEl.value) return
  zoomBehavior = zoom<SVGSVGElement, unknown>().scaleExtent([MIN_ZOOM, MAX_ZOOM])
    .filter((event) => event.type !== 'dblclick' && !event.target.closest?.('.topology-node'))
    .on('zoom', (event) => { transform.value = event.transform })
  select(svgEl.value).call(zoomBehavior)
}
function setTransform(next: typeof zoomIdentity, animate = false) {
  if (!svgEl.value || !zoomBehavior) return
  const selection = select(svgEl.value)
  if (animate) selection.transition().duration(260).call(zoomBehavior.transform, next)
  else selection.call(zoomBehavior.transform, next)
}
function fitViewport() {
  if (!graphNodes.value.length) return
  const xs = graphNodes.value.map((node) => node.x ?? 0), ys = graphNodes.value.map((node) => node.y ?? 0)
  const minX = Math.min(...xs) - 35, maxX = Math.max(...xs) + (showLabels.value ? 92 : 35)
  const minY = Math.min(...ys) - 35, maxY = Math.max(...ys) + 35
  const width = Math.max(100, maxX - minX), height = Math.max(100, maxY - minY)
  const k = Math.min(2.2, Math.max(MIN_ZOOM, Math.min((VB_W - 70) / width, (VB_H - 70) / height)))
  setTransform(zoomIdentity.translate((VB_W - width * k) / 2 - minX * k, (VB_H - height * k) / 2 - minY * k).scale(k), true)
}
function zoomBy(factor: number) { if (svgEl.value && zoomBehavior) select(svgEl.value).transition().duration(180).call(zoomBehavior.scaleBy, factor) }
function relayout() {
  const ys = initialYPositions()
  graphNodes.value.forEach((node) => { node.x = node.targetX; node.y = ys.get(node.id) ?? VB_H / 2; node.fx = null; node.fy = null })
  simulation?.alpha(.9).restart()
  nextTick(fitViewport)
}
function nodeLabel(node: QuadNode) { if (node.depth === 0) return t('common.root'); return node.children.length ? `D${node.depth}` : `${node.rect.width}×${node.rect.height}` }
function nodeName(node: QuadNode) { if (node.depth === 0) return t('tree.nodeNames.root'); return t(node.children.length ? 'tree.nodeNames.partition' : 'tree.nodeNames.leaf', { depth: node.depth }) }
function stateLabel(node: QuadNode) { return t(`tree.states.${node.state}`) }
function radiusFor(node: QuadNode) { return node.depth === 0 ? 10 : node.children.length ? 7 : 5 }
function linkPath(source: GraphNode, target: GraphNode) {
  const sx = source.x ?? 0, sy = source.y ?? 0, tx = target.x ?? 0, ty = target.y ?? 0, mid = (sx + tx) / 2
  return `M${sx},${sy} C${mid},${sy} ${mid},${ty} ${tx},${ty}`
}
function selectNode(node: QuadNode) { localSelectedId.value = node.id; emit('select', node.id) }
function toggleCollapse(node: QuadNode) {
  if (!node.children.length) return
  const next = new Set(collapsed.value)
  if (next.has(node.id)) { node.children.filter((child) => child.children.length).forEach((child) => next.add(child.id)); next.delete(node.id) } else next.add(node.id)
  collapsed.value = next
}
function startDrag(event: PointerEvent, graphNode: GraphNode) {
  event.stopPropagation(); dragging = { node: graphNode, pointerId: event.pointerId }; (event.currentTarget as Element).setPointerCapture(event.pointerId)
  graphNode.fx = graphNode.x; graphNode.fy = graphNode.y; simulation?.alphaTarget(.16).restart()
}
function dragNode(event: PointerEvent) {
  if (!dragging || event.pointerId !== dragging.pointerId || !svgEl.value) return
  const rect = svgEl.value.getBoundingClientRect(), px = ((event.clientX - rect.left) / rect.width) * VB_W, py = ((event.clientY - rect.top) / rect.height) * VB_H
  dragging.node.fx = transform.value.invertX(px); dragging.node.fy = transform.value.invertY(py)
}
function endDrag(event: PointerEvent) {
  if (!dragging || event.pointerId !== dragging.pointerId) return
  dragging.node.fx = null; dragging.node.fy = null; dragging = null; simulation?.alphaTarget(0).alpha(.35).restart()
}
function onNodeEnter(node: QuadNode, event: MouseEvent) { hoveredId.value = node.id; Object.assign(tooltip, { visible: true, node, x: event.clientX, y: event.clientY }) }
function onNodeMove(event: MouseEvent) { tooltip.x = event.clientX; tooltip.y = event.clientY }
function onNodeLeave() { hoveredId.value = null; tooltip.visible = false; tooltip.node = null }
function locateOnMap() { emit('select', selectedNode.value.id) }
function handleKeydown(event: KeyboardEvent) { if (event.key === 'Escape') emit('close') }

function clampWindowPosition(x: number, y: number) {
  const rect = windowEl.value?.getBoundingClientRect()
  if (!rect) return { x, y }
  return {
    x: Math.min(Math.max(8, x), Math.max(8, window.innerWidth - rect.width - 8)),
    y: Math.min(Math.max(8, y), Math.max(8, window.innerHeight - rect.height - 8)),
  }
}

function centerWindow() {
  nextTick(() => {
    const rect = windowEl.value?.getBoundingClientRect()
    if (!rect) return
    Object.assign(windowPosition, clampWindowPosition((window.innerWidth - rect.width) / 2, (window.innerHeight - rect.height) / 2))
  })
}

function startWindowMove(event: PointerEvent) {
  if ((event.target as Element).closest('button, input, label')) return
  const rect = windowEl.value?.getBoundingClientRect()
  if (!rect) return
  movingWindow = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top }
  ;(event.currentTarget as Element).setPointerCapture(event.pointerId)
}

function moveWindow(event: PointerEvent) {
  if (!movingWindow || event.pointerId !== movingWindow.pointerId) return
  Object.assign(windowPosition, clampWindowPosition(event.clientX - movingWindow.offsetX, event.clientY - movingWindow.offsetY))
}

function endWindowMove(event: PointerEvent) {
  if (!movingWindow || event.pointerId !== movingWindow.pointerId) return
  movingWindow = null
}

watch(() => props.selectedId, (id) => { localSelectedId.value = id })
watch(() => props.root, (root) => { collapsed.value = initialCollapsed(root); localSelectedId.value = root.id; onNodeLeave() }, { flush: 'post' })
watch(visibleNodes, () => nextTick(buildSimulation))
watch(showLabels, () => { buildSimulation(); nextTick(fitViewport) })
onMounted(() => { window.addEventListener('keydown', handleKeydown); collapsed.value = initialCollapsed(props.root); setupZoom(); buildSimulation(); centerWindow() })
onBeforeUnmount(() => { simulation?.stop(); if (svgEl.value) select(svgEl.value).on('.zoom', null); window.removeEventListener('keydown', handleKeydown) })
</script>

<template>
  <Teleport to="body">
    <div class="floating-layer">
      <section ref="windowEl" class="topology-modal" role="dialog" aria-modal="false" aria-labelledby="topology-title" :style="{ left: `${windowPosition.x}px`, top: `${windowPosition.y}px` }">
        <header class="modal-header" :title="t('topology.dragWindow')" @pointerdown="startWindowMove" @pointermove="moveWindow" @pointerup="endWindowMove" @pointercancel="endWindowMove" @dblclick="centerWindow">
          <div><span>{{ t('topology.eyebrow') }}</span><h2 id="topology-title">{{ t('topology.title') }}</h2></div>
          <div class="header-stats"><span><b>{{ allNodes.length }}</b>{{ t('topology.nodeCount') }}</span><span><b>{{ leaves.length }}</b>{{ t('topology.leafCount') }}</span><span><b>{{ maxDepth }}</b>{{ t('topology.depthCount') }}</span></div>
          <button class="close-button" :aria-label="t('topology.close')" @click="$emit('close')">×</button>
        </header>
        <div class="modal-body">
          <div class="canvas-wrap">
            <svg ref="svgEl" :viewBox="`0 0 ${VB_W} ${VB_H}`" :aria-label="t('topology.title')" @pointermove="dragNode" @pointerup="endDrag" @pointercancel="endDrag">
              <g :transform="transform.toString()">
                <path v-for="link in renderedLinks" :key="`${link.source.id}-${link.target.id}`" class="topology-link" :class="{ highlighted: selectedPathIds.has(link.source.id) && selectedPathIds.has(link.target.id) }" :d="linkPath(link.source, link.target)" />
                <g v-for="item in renderedNodes" :key="item.id" class="topology-node" :class="[`node-${item.node.state}`, { selected: item.id === selectedNode.id, inPath: selectedPathIds.has(item.id), hovered: hoveredDescendants.has(item.id), dimmed: hoveredId !== null && !hoveredDescendants.has(item.id), collapsed: item.hiddenCount > 0 }]" :transform="`translate(${item.x ?? 0} ${item.y ?? 0})`" role="button" tabindex="0" @click="selectNode(item.node)" @dblclick.stop="toggleCollapse(item.node)" @keydown.enter="selectNode(item.node)" @pointerdown="startDrag($event, item)" @mouseenter="onNodeEnter(item.node, $event)" @mousemove="onNodeMove" @mouseleave="onNodeLeave">
                  <circle class="node-hit" r="15" /><circle class="node-dot" :r="radiusFor(item.node)" />
                  <text v-if="showLabels" class="node-label" :x="radiusFor(item.node) + 8" dy="0.32em">{{ nodeLabel(item.node) }}</text>
                  <g v-if="item.hiddenCount" class="hidden-badge" :transform="`translate(${radiusFor(item.node) + 7} -10)`"><rect x="0" y="-7" width="28" height="14" rx="7" /><text x="14" dy="0.32em" text-anchor="middle">+{{ item.hiddenCount }}</text></g>
                </g>
              </g>
            </svg>
            <div class="canvas-tools"><button :aria-label="t('topology.zoomIn')" @click="zoomBy(1.25)">＋</button><button :aria-label="t('topology.zoomOut')" @click="zoomBy(.8)">－</button><button class="text-tool" @click="fitViewport">{{ t('topology.fit') }}</button><button class="text-tool relayout-tool" @click="relayout">{{ t('topology.relayout') }}</button><label><input v-model="showLabels" type="checkbox" /> {{ t('topology.labels') }}</label></div>
            <div class="legend"><span><i class="mixed"></i>{{ t('topology.mixed') }}</span><span><i class="free"></i>{{ t('topology.free') }}</span><span><i class="blocked"></i>{{ t('topology.blocked') }}</span><span><i class="selected"></i>{{ t('topology.currentPath') }}</span><span><i class="drag"></i>{{ t('topology.dragHint') }}</span></div>
          </div>
          <aside class="topology-detail">
            <div class="detail-label">{{ t('tree.currentNode') }}</div><div class="detail-heading"><h3>{{ nodeName(selectedNode) }}</h3><b :class="`badge-${selectedNode.state}`">{{ stateLabel(selectedNode) }}</b></div>
            <div class="path-list"><template v-for="(node, index) in selectedPath" :key="node.id"><button @click="selectNode(node)">{{ index === 0 ? t('common.root') : `D${node.depth}` }}</button><span v-if="index < selectedPath.length - 1">›</span></template></div>
            <dl><div><dt>{{ t('tree.origin') }}</dt><dd>{{ selectedNode.rect.x }}, {{ selectedNode.rect.y }}</dd></div><div><dt>{{ t('tree.coverage') }}</dt><dd>{{ selectedNode.rect.width }} × {{ selectedNode.rect.height }}</dd></div><div><dt>{{ t('tree.nodeDepth') }}</dt><dd>{{ selectedNode.depth }}</dd></div><div><dt>{{ t('tree.childNodes') }}</dt><dd>{{ selectedNode.children.length }}</dd></div></dl>
            <button v-if="selectedNode.children.length" class="collapse-button" @click="toggleCollapse(selectedNode)">{{ collapsed.has(selectedNode.id) ? t('topology.expandSubtree') : t('topology.collapseSubtree') }}</button>
            <p v-if="selectedNode.state === 'mixed'">{{ t('topology.mixedHelp') }}</p><p v-else>{{ t('topology.leafHelp') }}</p>
            <button class="locate-button" @click="locateOnMap">{{ t('topology.locate') }} <span>→</span></button>
          </aside>
        </div>
      </section>
    </div>
  </Teleport>
  <Teleport to="body"><div v-if="tooltip.visible && tooltip.node" class="node-tooltip" :style="{ left: `${tooltip.x + 16}px`, top: `${tooltip.y + 16}px` }"><b>{{ nodeName(tooltip.node) }}</b><span class="tooltip-state" :class="`badge-${tooltip.node.state}`">{{ stateLabel(tooltip.node) }}</span><em>{{ tooltip.node.rect.x }}, {{ tooltip.node.rect.y }} · {{ tooltip.node.rect.width }}×{{ tooltip.node.rect.height }}</em><small v-if="collapsed.has(tooltip.node.id)">{{ t('topology.hiddenChildren', { count: descendantCount(tooltip.node) }) }}</small></div></Teleport>
</template>

<style scoped>
.floating-layer{position:fixed;z-index:1000;inset:0;pointer-events:none}.topology-modal{position:absolute;width:min(900px,calc(100vw - 32px));height:min(640px,calc(100vh - 32px));min-width:min(560px,calc(100vw - 16px));min-height:420px;overflow:hidden;resize:both;pointer-events:auto;border:1px solid rgba(255,255,255,.82);border-radius:18px;background:rgba(250,250,252,.97);box-shadow:0 24px 70px rgba(0,0,0,.25),0 2px 12px rgba(0,0,0,.12)}
.modal-header{display:grid;height:76px;grid-template-columns:1fr auto 36px;align-items:center;gap:28px;border-bottom:1px solid var(--separator);padding:0 20px 0 24px;cursor:move;user-select:none;touch-action:none}.modal-header span,.detail-label{color:var(--blue);font-size:10px;font-weight:600}.modal-header h2{margin:3px 0 0;font-size:21px;letter-spacing:-.025em}.header-stats{display:flex;gap:24px}.header-stats span{color:var(--tertiary);text-align:right}.header-stats b{display:block;margin-bottom:2px;color:#1d1d1f;font-size:15px}.close-button{width:32px;height:32px;border:0;border-radius:50%;background:#e8e8ed;color:#636366;font-size:22px;cursor:pointer}
.modal-body{display:grid;height:calc(100% - 76px);grid-template-columns:minmax(0,1fr) 270px}.canvas-wrap{position:relative;min-width:0;min-height:0;overflow:hidden;background:radial-gradient(circle at 50% 50%,#fff 0,#fafafd 100%)}svg{display:block;width:100%;height:100%;cursor:grab;touch-action:none}svg:active{cursor:grabbing}.topology-link{fill:none;stroke:rgba(60,60,67,.18);stroke-width:1.2;vector-effect:non-scaling-stroke;pointer-events:none}.topology-link.highlighted{stroke:#5856d6;stroke-width:2.4}
.topology-node{cursor:grab;outline:none}.topology-node:active{cursor:grabbing}.node-hit{fill:transparent}.node-dot{fill:#007aff;stroke:#fff;stroke-width:1.7;vector-effect:non-scaling-stroke;transition:opacity 140ms,filter 140ms}.node-free .node-dot{fill:#34c759}.node-blocked .node-dot{fill:#8e8e93}.topology-node.inPath .node-dot{stroke:#5856d6;stroke-width:2.5}.topology-node.selected .node-dot{fill:#5856d6;stroke-width:3;filter:drop-shadow(0 0 5px rgba(88,86,214,.5))}.topology-node.hovered .node-dot{stroke:#007aff;stroke-width:2.5;filter:drop-shadow(0 0 4px rgba(0,122,255,.55))}.topology-node.dimmed{opacity:.2}.node-label{fill:#6e6e73;font-size:10px;font-weight:500;user-select:none;pointer-events:none}.hidden-badge{pointer-events:none}.hidden-badge rect{fill:#fff;stroke:rgba(0,122,255,.35);vector-effect:non-scaling-stroke}.hidden-badge text{fill:#007aff;font-size:8px;font-weight:700}
.canvas-tools{position:absolute;top:14px;right:14px;display:flex;align-items:center;gap:5px;border:1px solid var(--separator);border-radius:11px;padding:5px;background:rgba(255,255,255,.88);backdrop-filter:blur(10px)}.canvas-tools button{min-width:27px;height:27px;border:0;border-radius:7px;background:#f0f0f2;cursor:pointer}.canvas-tools button:hover{background:#e4e4e8}.canvas-tools .text-tool{padding:0 9px;font-size:10px}.canvas-tools label{display:flex;align-items:center;gap:4px;padding:0 6px;color:var(--secondary);font-size:10px;cursor:pointer}.canvas-tools input{accent-color:var(--blue)}.legend{position:absolute;bottom:16px;left:18px;display:flex;flex-wrap:wrap;gap:13px;border:1px solid var(--separator);border-radius:10px;padding:8px 10px;background:rgba(255,255,255,.88);color:var(--secondary);font-size:9px;backdrop-filter:blur(10px)}.legend span{display:flex;align-items:center;gap:5px}.legend i{width:7px;height:7px;border-radius:50%}.legend .mixed{background:#007aff}.legend .free{background:#34c759}.legend .blocked{background:#8e8e93}.legend .selected{background:#5856d6}.legend .drag{border:1px solid #007aff;background:#fff}
.topology-detail{overflow-y:auto;border-left:1px solid var(--separator);padding:24px 20px;background:rgba(247,247,249,.82)}.detail-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:5px}.detail-heading h3{margin:0;font-size:18px}.detail-heading b,.tooltip-state{border-radius:999px;padding:5px 8px;font-size:9px}.badge-free{background:rgba(52,199,89,.12);color:#248a3d}.badge-blocked{background:rgba(142,142,147,.14);color:#636366}.badge-mixed{background:rgba(0,122,255,.11);color:#007aff}.path-list{display:flex;align-items:center;gap:5px;overflow-x:auto;margin-top:18px;padding-bottom:4px}.path-list button{flex:none;border:0;border-radius:7px;background:#e8e8ed;padding:5px 8px;color:var(--secondary);font-size:9px;cursor:pointer}.path-list span{color:#aeaeb2}.topology-detail dl{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:22px}.topology-detail dl div{min-width:0}.topology-detail dt{color:var(--tertiary);font-size:9px}.topology-detail dd{margin:3px 0 0;font-size:12px;font-weight:600}.topology-detail p{margin:20px 0 0;color:var(--secondary);font-size:11px;line-height:1.55}.collapse-button{width:100%;margin-top:16px;border:0;border-radius:9px;background:#e8e8ed;padding:8px 12px;color:var(--secondary);font-size:11px;font-weight:500;cursor:pointer}.locate-button{display:flex;width:100%;justify-content:space-between;margin-top:24px;border:0;border-radius:10px;background:var(--blue);padding:10px 12px;color:#fff;font-size:12px;font-weight:600;cursor:pointer}
.node-tooltip{position:fixed;z-index:1200;display:flex;flex-direction:column;gap:4px;max-width:230px;border:1px solid rgba(0,0,0,.08);border-radius:10px;padding:8px 10px;background:rgba(250,250,252,.92);box-shadow:0 10px 30px rgba(0,0,0,.14);backdrop-filter:blur(14px);pointer-events:none}.node-tooltip b{font-size:12px}.node-tooltip .tooltip-state{align-self:flex-start;padding:3px 7px}.node-tooltip em,.node-tooltip small{color:var(--secondary);font-size:10px;font-style:normal}
@media(max-width:760px){.topology-modal{width:calc(100vw - 16px);height:min(680px,calc(100vh - 16px));min-width:304px;min-height:390px;border-radius:16px}.modal-header{grid-template-columns:1fr 32px}.header-stats{display:none}.modal-body{grid-template-columns:1fr;grid-template-rows:minmax(300px,1fr) auto;overflow-y:auto}.topology-detail{border-top:1px solid var(--separator);border-left:0}.legend{right:18px}.relayout-tool,.canvas-tools label{display:none}}
</style>
