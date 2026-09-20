<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { collectLeaves, collectNodes, findNode, findNodePath } from '../core/quadtree'
import type { NodeState, QuadNode } from '../core/types'

const props = defineProps<{
  root: QuadNode
  selectedId: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const expanded = ref<Set<string>>(new Set())
const stateLabels: Record<NodeState, string> = {
  free: '空闲',
  blocked: '障碍',
  mixed: '混合',
}

const selectedNode = computed(() => findNode(props.root, props.selectedId) ?? props.root)
const selectedPath = computed(() => findNodePath(props.root, selectedNode.value.id) ?? [props.root])
const allNodes = computed(() => collectNodes(props.root))
const leafCount = computed(() => collectLeaves(props.root).length)
const visibleNodes = computed(() => {
  const visible: QuadNode[] = []
  const visit = (node: QuadNode) => {
    visible.push(node)
    if (expanded.value.has(node.id)) node.children.forEach(visit)
  }
  visit(props.root)
  return visible
})

function revealSelection() {
  const next = new Set(expanded.value)
  next.add(props.root.id)
  selectedPath.value.slice(0, -1).forEach((node) => next.add(node.id))
  expanded.value = next
}

function toggleNode(node: QuadNode) {
  if (node.children.length === 0) return
  const next = new Set(expanded.value)
  if (next.has(node.id)) next.delete(node.id)
  else next.add(node.id)
  expanded.value = next
}

function selectNode(node: QuadNode) {
  emit('select', node.id)
  if (node.children.length > 0) toggleNode(node)
}

function nodeLabel(node: QuadNode) {
  if (node.depth === 0) return '根节点'
  return node.children.length > 0 ? `D${node.depth} 分区` : `D${node.depth} 叶节点`
}

watch(() => props.root, () => {
  expanded.value = new Set([props.root.id])
  revealSelection()
}, { immediate: true })

watch(() => props.selectedId, revealSelection)
</script>

<template>
  <section class="inspector panel">
    <header class="inspector-header">
      <div>
        <div class="eyebrow">空间结构</div>
        <h2>四叉树观察器</h2>
        <p>点击地图可定位到对应叶节点；点击树节点会反向高亮它覆盖的地图区域。</p>
      </div>
      <div class="tree-summary">
        <span><b>{{ allNodes.length }}</b>总节点</span>
        <span><b>{{ leafCount }}</b>叶节点</span>
        <span><b>{{ selectedNode.depth }}</b>当前深度</span>
      </div>
    </header>

    <div class="path-strip" aria-label="从根节点到当前节点的路径">
      <template v-for="(node, index) in selectedPath" :key="node.id">
        <button :class="{ current: node.id === selectedNode.id }" @click="emit('select', node.id)">
          {{ index === 0 ? '根' : `D${node.depth}` }}
        </button>
        <span v-if="index < selectedPath.length - 1" aria-hidden="true">›</span>
      </template>
    </div>

    <div class="inspector-body">
      <div class="tree-list" role="tree" aria-label="四叉树层级">
        <div
          v-for="node in visibleNodes"
          :key="node.id"
          class="tree-row"
          :class="{ selected: node.id === selectedNode.id }"
          :style="{ '--depth': node.depth }"
          role="treeitem"
          :aria-level="node.depth + 1"
          :aria-selected="node.id === selectedNode.id"
          :aria-expanded="node.children.length ? expanded.has(node.id) : undefined"
        >
          <button
            class="disclosure"
            :class="{ open: expanded.has(node.id), placeholder: node.children.length === 0 }"
            :disabled="node.children.length === 0"
            :aria-label="expanded.has(node.id) ? '折叠子节点' : '展开子节点'"
            @click="toggleNode(node)"
          >›</button>
          <button class="node-button" @click="selectNode(node)">
            <i :class="`state-${node.state}`"></i>
            <span>{{ nodeLabel(node) }}</span>
            <small>{{ node.rect.width }}×{{ node.rect.height }}</small>
          </button>
        </div>
      </div>

      <aside class="node-detail">
        <div class="detail-preview" :class="`preview-${selectedNode.state}`">
          <span>{{ selectedNode.rect.width }} × {{ selectedNode.rect.height }}</span>
        </div>
        <div class="detail-title">
          <div>
            <span>当前节点</span>
            <h3>{{ nodeLabel(selectedNode) }}</h3>
          </div>
          <b :class="`badge-${selectedNode.state}`">{{ stateLabels[selectedNode.state] }}</b>
        </div>
        <dl>
          <div><dt>起点坐标</dt><dd>{{ selectedNode.rect.x }}, {{ selectedNode.rect.y }}</dd></div>
          <div><dt>覆盖范围</dt><dd>{{ selectedNode.rect.width }} × {{ selectedNode.rect.height }}</dd></div>
          <div><dt>子节点</dt><dd>{{ selectedNode.children.length }}</dd></div>
          <div><dt>类型</dt><dd>{{ selectedNode.children.length ? '内部节点' : '叶节点' }}</dd></div>
        </dl>
        <p v-if="selectedNode.state === 'mixed'">该区域同时包含空闲和障碍单元，因此需要继续向下分割。
        </p>
        <p v-else>该区域状态一致，因此在此停止分割。</p>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.inspector {
  margin-top: 18px;
  overflow: hidden;
}

.inspector-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 24px 18px;
  border-bottom: 1px solid var(--separator);
}

.eyebrow {
  margin-bottom: 5px;
  color: var(--blue);
  font-size: 11px;
  font-weight: 600;
}

h2, h3, p { margin: 0; }
h2 { font-size: 21px; letter-spacing: -0.025em; }
.inspector-header p { margin-top: 6px; color: var(--secondary); font-size: 12px; }

.tree-summary { display: flex; gap: 18px; flex: none; }
.tree-summary span { color: var(--tertiary); font-size: 10px; text-align: right; }
.tree-summary b { display: block; margin-bottom: 2px; color: #1d1d1f; font-size: 16px; font-weight: 600; }

.path-strip {
  display: flex;
  min-height: 48px;
  align-items: center;
  gap: 7px;
  overflow-x: auto;
  padding: 8px 24px;
  border-bottom: 1px solid var(--separator);
  scrollbar-width: none;
}

.path-strip::-webkit-scrollbar { display: none; }
.path-strip span { color: #aeaeb2; }
.path-strip button {
  flex: none;
  border: 0;
  border-radius: 8px;
  background: #f0f0f2;
  padding: 6px 10px;
  color: var(--secondary);
  font-size: 11px;
  cursor: pointer;
}
.path-strip button.current { background: rgba(88, 86, 214, 0.12); color: #5856d6; font-weight: 600; }

.inspector-body { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.55fr); min-height: 330px; }

.tree-list {
  max-height: 430px;
  overflow: auto;
  padding: 12px;
  border-right: 1px solid var(--separator);
}

.tree-row {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  align-items: center;
  min-height: 36px;
  margin-left: calc(var(--depth) * 18px);
  border-radius: 9px;
}

.tree-row.selected { background: rgba(88, 86, 214, 0.1); }
.tree-row button { border: 0; background: transparent; cursor: pointer; }
.disclosure { width: 24px; height: 28px; color: var(--tertiary); font-size: 18px; transition: transform 140ms ease; }
.disclosure.open { transform: rotate(90deg); }
.disclosure.placeholder { visibility: hidden; }

.node-button { display: flex; min-width: 0; align-items: center; gap: 8px; height: 34px; padding: 0 10px 0 2px; text-align: left; }
.node-button i { width: 8px; height: 8px; flex: none; border-radius: 50%; }
.node-button span { overflow: hidden; color: #1d1d1f; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.node-button small { margin-left: auto; color: var(--tertiary); font-size: 10px; font-variant-numeric: tabular-nums; }
.state-free { background: #34c759; }
.state-blocked { background: #8e8e93; }
.state-mixed { background: #007aff; }

.node-detail { padding: 22px; background: rgba(250, 250, 250, 0.72); }
.detail-preview {
  display: grid;
  width: 100%;
  height: 90px;
  place-items: center;
  border: 2px solid #007aff;
  border-radius: 12px;
  background-image: linear-gradient(rgba(60, 60, 67, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(60, 60, 67, 0.08) 1px, transparent 1px);
  background-size: 14px 14px;
  color: var(--secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.preview-blocked { border-color: #8e8e93; background-color: rgba(142, 142, 147, 0.13); }
.preview-mixed { border-color: #5856d6; background-color: rgba(88, 86, 214, 0.07); }

.detail-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 18px; }
.detail-title span { color: var(--tertiary); font-size: 10px; }
.detail-title h3 { margin-top: 3px; font-size: 16px; }
.detail-title b { border-radius: 999px; padding: 5px 8px; font-size: 10px; }
.badge-free { background: rgba(52, 199, 89, 0.12); color: #248a3d; }
.badge-blocked { background: rgba(142, 142, 147, 0.14); color: #636366; }
.badge-mixed { background: rgba(0, 122, 255, 0.11); color: #007aff; }

.node-detail dl { grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 20px; }
.node-detail p { margin-top: 18px; color: var(--secondary); font-size: 11px; line-height: 1.55; }

@media (max-width: 760px) {
  .inspector-header { align-items: flex-start; flex-direction: column; }
  .tree-summary { width: 100%; justify-content: space-between; }
  .tree-summary span { text-align: left; }
  .inspector-body { grid-template-columns: 1fr; }
  .tree-list { border-right: 0; border-bottom: 1px solid var(--separator); }
}
</style>
