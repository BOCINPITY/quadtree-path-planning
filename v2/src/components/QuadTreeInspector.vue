<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { collectLeaves, collectNodes, findNode, findNodePath } from '../core/quadtree'
import type { NodeState, QuadNode } from '../core/types'

const props = defineProps<{
  root: QuadNode
  selectedId: string
  compact?: boolean
  embedded?: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const focusId = ref(props.root.id)
const stateLabels: Record<NodeState, string> = {
  free: '空闲',
  blocked: '障碍',
  mixed: '混合',
}

const selectedNode = computed(() => findNode(props.root, props.selectedId) ?? props.root)
const selectedPath = computed(() => findNodePath(props.root, selectedNode.value.id) ?? [props.root])
const allNodes = computed(() => collectNodes(props.root))
const leafCount = computed(() => collectLeaves(props.root).length)
const focusNode = computed(() => findNode(props.root, focusId.value) ?? props.root)
const focusPath = computed(() => findNodePath(props.root, focusNode.value.id) ?? [props.root])

function selectNode(node: QuadNode) {
  emit('select', node.id)
  if (node.children.length > 0) focusId.value = node.id
}

function nodeLabel(node: QuadNode) {
  if (node.depth === 0) return '根节点'
  return node.children.length > 0 ? `D${node.depth} 分区` : `D${node.depth} 叶节点`
}

function quadrantLabel(node: QuadNode) {
  const parent = focusNode.value.rect
  const horizontal = node.rect.width < parent.width
  const vertical = node.rect.height < parent.height
  const side = horizontal ? (node.rect.x === parent.x ? '左' : '右') : ''
  const level = vertical ? (node.rect.y === parent.y ? '上' : '下') : ''
  return `${side}${level}` || '子区域'
}

function quadrantStyle(node: QuadNode) {
  const parent = focusNode.value.rect
  return {
    gridColumn: node.rect.width === parent.width ? '1 / 3' : node.rect.x === parent.x ? '1' : '2',
    gridRow: node.rect.height === parent.height ? '1 / 3' : node.rect.y === parent.y ? '1' : '2',
  }
}

function navigateTo(node: QuadNode) {
  focusId.value = node.id
  emit('select', node.id)
}

function navigateParent() {
  const parent = focusPath.value.at(-2)
  if (parent) navigateTo(parent)
}

function syncFocusToSelection() {
  const node = selectedNode.value
  const path = selectedPath.value
  focusId.value = node.children.length > 0 ? node.id : (path.at(-2)?.id ?? node.id)
}

watch([() => props.root, () => props.selectedId], syncFocusToSelection, { immediate: true })
</script>

<template>
  <section class="inspector" :class="{ panel: !embedded, compact, embedded }">
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
        <button :class="{ current: node.id === selectedNode.id, focus: node.id === focusNode.id }" @click="navigateTo(node)">
          {{ index === 0 ? '根' : `D${node.depth}` }}
        </button>
        <span v-if="index < selectedPath.length - 1" aria-hidden="true">›</span>
      </template>
    </div>

    <div class="inspector-body">
      <div class="focus-navigator" aria-label="聚焦式四分导航器">
        <div class="focus-heading">
          <button class="back-button" :disabled="focusNode.depth === 0" aria-label="返回父节点" @click="navigateParent">‹</button>
          <button class="focus-node" @click="emit('select', focusNode.id)">
            <span>当前分区 · D{{ focusNode.depth }}</span>
            <b>{{ focusNode.rect.width }} × {{ focusNode.rect.height }}</b>
          </button>
          <span class="focus-state" :class="`badge-${focusNode.state}`">{{ stateLabels[focusNode.state] }}</span>
        </div>

        <div v-if="focusNode.children.length" class="split-caption">
          <span>四个子区域保留与地图一致的方向</span>
          <small>点击继续深入</small>
        </div>

        <div v-if="focusNode.children.length" class="quadrant-grid">
          <button
            v-for="node in focusNode.children"
            :key="node.id"
            class="quadrant"
            :class="[`quadrant-${node.state}`, { selected: node.id === selectedNode.id }]"
            :style="quadrantStyle(node)"
            @click="selectNode(node)"
          >
            <span class="quadrant-name">{{ quadrantLabel(node) }}</span>
            <b>{{ node.rect.width }}×{{ node.rect.height }}</b>
            <small><i :class="`state-${node.state}`"></i>{{ stateLabels[node.state] }} · D{{ node.depth }}</small>
            <em v-if="node.children.length">深入 ›</em>
          </button>
        </div>

        <div v-else class="leaf-stop" :class="`leaf-${focusNode.state}`">
          <span>分割结束</span>
          <b>{{ stateLabels[focusNode.state] }}叶节点</b>
          <p>该区域内部状态一致，无需继续向下分割。</p>
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

.inspector.embedded { margin-top: 0; }

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
.path-strip button.focus:not(.current) { color: #5856d6; box-shadow: inset 0 0 0 1px rgba(88, 86, 214, 0.2); }

.inspector-body { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.55fr); min-height: 330px; }

.focus-navigator {
  display: flex;
  min-height: 0;
  flex-direction: column;
  padding: 16px;
  border-right: 1px solid var(--separator);
  background: rgba(250, 250, 250, 0.35);
}

.focus-heading {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
}

.back-button {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 0;
  border-radius: 9px;
  background: #e8e8ed;
  color: #1d1d1f;
  font-size: 22px;
  cursor: pointer;
}
.back-button:disabled { opacity: 0.32; cursor: default; }

.focus-node { min-width: 0; border: 0; background: transparent; text-align: left; cursor: pointer; }
.focus-node span { display: block; color: var(--tertiary); font-size: 9px; }
.focus-node b { display: block; margin-top: 2px; font-size: 15px; font-variant-numeric: tabular-nums; }
.focus-state { border-radius: 999px; padding: 5px 8px; font-size: 9px; }

.split-caption { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 15px 0 8px; color: var(--secondary); font-size: 9px; }
.split-caption small { flex: none; color: var(--tertiary); font-size: 8px; }

.quadrant-grid {
  display: grid;
  min-height: 210px;
  flex: 1;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 6px;
}

.quadrant {
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(0, 122, 255, 0.28);
  border-radius: 11px;
  background: rgba(0, 122, 255, 0.045);
  padding: 11px;
  text-align: left;
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease, transform 150ms ease, box-shadow 150ms ease;
}

.quadrant:hover { border-color: rgba(0, 122, 255, 0.65); background: rgba(0, 122, 255, 0.09); transform: translateY(-1px); }
.quadrant.selected { border: 2px solid #5856d6; background: rgba(88, 86, 214, 0.1); box-shadow: 0 6px 18px rgba(88, 86, 214, 0.12); }
.quadrant-blocked { border-color: rgba(142, 142, 147, 0.35); background: rgba(142, 142, 147, 0.1); }
.quadrant-mixed { border-color: rgba(88, 86, 214, 0.32); background: rgba(88, 86, 214, 0.055); }
.quadrant-name { color: var(--secondary); font-size: 9px; }
.quadrant b { margin-top: 3px; font-size: 14px; font-variant-numeric: tabular-nums; }
.quadrant small { display: flex; align-items: center; gap: 5px; margin-top: 7px; color: var(--secondary); font-size: 8px; }
.quadrant small i { width: 6px; height: 6px; border-radius: 50%; }
.quadrant em { position: absolute; right: 9px; bottom: 8px; color: #5856d6; font-size: 8px; font-style: normal; }

.leaf-stop { display: grid; min-height: 210px; flex: 1; place-content: center; border: 1px dashed var(--separator); border-radius: 12px; padding: 24px; text-align: center; }
.leaf-stop span { color: var(--tertiary); font-size: 9px; }
.leaf-stop b { margin-top: 5px; font-size: 16px; }
.leaf-stop p { max-width: 220px; margin-top: 8px; color: var(--secondary); font-size: 10px; line-height: 1.5; }
.leaf-free { background: rgba(52, 199, 89, 0.05); }
.leaf-blocked { background: rgba(142, 142, 147, 0.08); }
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

.inspector.compact {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
}

.compact .inspector-header {
  align-items: flex-start;
  flex-direction: column;
  gap: 12px;
  padding: 15px 16px 12px;
}

.compact .inspector-header h2 { font-size: 17px; }
.compact .inspector-header p { display: none; }
.compact .tree-summary { width: 100%; gap: 0; justify-content: space-between; }
.compact .tree-summary span { text-align: left; }
.compact .tree-summary b { font-size: 14px; }
.compact .path-strip { min-height: 42px; padding: 6px 16px; }
.compact .inspector-body { display: flex; min-height: 0; flex: 1; flex-direction: column; }
.compact .focus-navigator { min-height: 0; flex: 1; border-right: 0; border-bottom: 1px solid var(--separator); padding: 13px 14px; }
.compact .quadrant-grid { min-height: 150px; }
.compact .node-detail { flex: none; padding: 14px 16px; }
.compact .detail-preview { display: none; }
.compact .detail-title { margin-top: 0; }
.compact .node-detail dl { gap: 8px; margin-top: 12px; }
.compact .node-detail p { margin-top: 10px; }

@media (max-width: 760px) {
  .inspector-header { align-items: flex-start; flex-direction: column; }
  .tree-summary { width: 100%; justify-content: space-between; }
  .tree-summary span { text-align: left; }
  .inspector-body { grid-template-columns: 1fr; }
  .focus-navigator { border-right: 0; border-bottom: 1px solid var(--separator); }
}
</style>
