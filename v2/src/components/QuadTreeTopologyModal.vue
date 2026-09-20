<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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

const WIDTH = 820
const HEIGHT = 620
const CENTER = { x: 410, y: 310 }
const MAX_RADIUS = 270
const localSelectedId = ref(props.selectedId)
let previousBodyOverflow = ''
const stateLabels: Record<NodeState, string> = { free: '空闲', blocked: '障碍', mixed: '混合' }

const allNodes = computed(() => collectNodes(props.root))
const leaves = computed(() => collectLeaves(props.root))
const maxDepth = computed(() => Math.max(...allNodes.value.map((node) => node.depth)))
const selectedNode = computed(() => findNode(props.root, localSelectedId.value) ?? props.root)
const selectedPath = computed(() => findNodePath(props.root, selectedNode.value.id) ?? [props.root])
const selectedPathIds = computed(() => new Set(selectedPath.value.map((node) => node.id)))

const layout = computed(() => {
  const angleById = new Map<string, number>()
  let leafIndex = 0
  const leafTotal = Math.max(1, leaves.value.length)

  const assignAngle = (node: QuadNode): number => {
    if (node.children.length === 0) {
      const angle = -Math.PI / 2 + ((leafIndex + 0.5) / leafTotal) * Math.PI * 2
      leafIndex += 1
      angleById.set(node.id, angle)
      return angle
    }
    const childAngles = node.children.map(assignAngle)
    const angle = childAngles.reduce((sum, value) => sum + value, 0) / childAngles.length
    angleById.set(node.id, angle)
    return angle
  }

  assignAngle(props.root)
  const radiusStep = maxDepth.value > 0 ? MAX_RADIUS / maxDepth.value : 0
  const positioned: PositionedNode[] = []

  const visit = (node: QuadNode, parentId: string | null) => {
    const radius = node.depth * radiusStep
    const angle = angleById.get(node.id) ?? 0
    positioned.push({
      node,
      parentId,
      x: node.depth === 0 ? CENTER.x : CENTER.x + Math.cos(angle) * radius,
      y: node.depth === 0 ? CENTER.y : CENTER.y + Math.sin(angle) * radius,
    })
    node.children.forEach((child) => visit(child, node.id))
  }

  visit(props.root, null)
  return positioned
})

const nodePositions = computed(() => new Map(layout.value.map((item) => [item.node.id, item])))
const edges = computed(() => layout.value.flatMap((item) => {
  if (!item.parentId) return []
  const parent = nodePositions.value.get(item.parentId)
  return parent ? [{ from: parent, to: item }] : []
}))

function selectNode(node: QuadNode) {
  localSelectedId.value = node.id
  emit('select', node.id)
}

function locateOnMap() {
  emit('select', selectedNode.value.id)
  emit('close')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

watch(() => props.selectedId, (id) => { localSelectedId.value = id })
onMounted(() => {
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', handleKeydown)
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
            <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" aria-label="四叉树径向拓扑图">
              <circle
                v-for="depth in maxDepth"
                :key="`ring-${depth}`"
                :cx="CENTER.x"
                :cy="CENTER.y"
                :r="(MAX_RADIUS / maxDepth) * depth"
                fill="none"
                stroke="rgba(60,60,67,.09)"
                stroke-dasharray="3 5"
              />
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
                :class="[`node-${item.node.state}`, { selected: item.node.id === selectedNode.id, inPath: selectedPathIds.has(item.node.id) }]"
                :transform="`translate(${item.x} ${item.y})`"
                role="button"
                tabindex="0"
                @click="selectNode(item.node)"
                @keydown.enter="selectNode(item.node)"
              >
                <circle :r="item.node.depth === 0 ? 8 : item.node.children.length ? 5 : 3.5" />
                <title>{{ item.node.depth === 0 ? '根节点' : `D${item.node.depth}` }} · {{ stateLabels[item.node.state] }} · {{ item.node.rect.width }}×{{ item.node.rect.height }}</title>
              </g>
            </svg>
            <div class="legend">
              <span><i class="mixed"></i>混合节点</span>
              <span><i class="free"></i>空闲叶节点</span>
              <span><i class="blocked"></i>障碍叶节点</span>
              <span><i class="selected"></i>当前路径</span>
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

            <p v-if="selectedNode.state === 'mixed'">混合节点会继续分割，紫色连线表示从根节点到当前节点的拓扑路径。</p>
            <p v-else>该叶节点状态一致，因此不再拥有子节点。</p>

            <button class="locate-button" @click="locateOnMap">定位到地图 <span>→</span></button>
          </aside>
        </div>
      </section>
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
svg { display: block; width: 100%; height: 100%; }
line { stroke: rgba(60, 60, 67, 0.18); stroke-width: 1; }
line.highlighted { stroke: #5856d6; stroke-width: 2.4; }
.topology-node { cursor: pointer; outline: none; }
.topology-node circle { fill: #007aff; stroke: #ffffff; stroke-width: 1.5; transition: r 140ms ease, filter 140ms ease; }
.topology-node:hover circle, .topology-node:focus circle { filter: drop-shadow(0 0 4px rgba(0, 122, 255, 0.55)); }
.topology-node.node-free circle { fill: #34c759; }
.topology-node.node-blocked circle { fill: #8e8e93; }
.topology-node.inPath circle { stroke: #5856d6; stroke-width: 2.5; }
.topology-node.selected circle { fill: #5856d6; stroke: #ffffff; stroke-width: 3; filter: drop-shadow(0 0 5px rgba(88, 86, 214, 0.5)); }

.legend { position: absolute; bottom: 16px; left: 18px; display: flex; gap: 14px; border: 1px solid var(--separator); border-radius: 10px; background: rgba(255,255,255,.86); padding: 8px 10px; color: var(--secondary); font-size: 9px; backdrop-filter: blur(10px); }
.legend span { display: flex; align-items: center; gap: 5px; }
.legend i { width: 7px; height: 7px; border-radius: 50%; }
.legend .mixed { background: #007aff; }
.legend .free { background: #34c759; }
.legend .blocked { background: #8e8e93; }
.legend .selected { background: #5856d6; }

.topology-detail { overflow-y: auto; border-left: 1px solid var(--separator); padding: 24px 20px; background: rgba(247, 247, 249, 0.82); }
.detail-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 5px; }
.detail-heading h3 { margin: 0; font-size: 18px; }
.detail-heading b { border-radius: 999px; padding: 5px 8px; font-size: 9px; }
.badge-free { background: rgba(52,199,89,.12); color: #248a3d; }
.badge-blocked { background: rgba(142,142,147,.14); color: #636366; }
.badge-mixed { background: rgba(0,122,255,.11); color: #007aff; }
.path-list { display: flex; align-items: center; gap: 5px; overflow-x: auto; margin-top: 18px; padding-bottom: 4px; }
.path-list button { flex: none; border: 0; border-radius: 7px; background: #e8e8ed; padding: 5px 8px; color: var(--secondary); font-size: 9px; cursor: pointer; }
.path-list span { color: #aeaeb2; }
.topology-detail dl { grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 22px; }
.topology-detail p { margin: 20px 0 0; color: var(--secondary); font-size: 11px; line-height: 1.55; }
.locate-button { display: flex; width: 100%; justify-content: space-between; margin-top: 24px; border: 0; border-radius: 10px; background: var(--blue); padding: 10px 12px; color: #ffffff; font-size: 12px; font-weight: 600; cursor: pointer; }

@media (max-width: 760px) {
  .modal-backdrop { padding: 8px; }
  .topology-modal { border-radius: 16px; }
  .modal-header { grid-template-columns: 1fr 32px; }
  .header-stats { display: none; }
  .modal-body { grid-template-columns: 1fr; grid-template-rows: minmax(330px, 1fr) auto; overflow-y: auto; }
  .topology-detail { border-top: 1px solid var(--separator); border-left: 0; }
  .legend { flex-wrap: wrap; right: 18px; }
}
</style>
