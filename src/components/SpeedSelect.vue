<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppleMenu from './AppleMenu.vue'

const props = withDefaults(defineProps<{
  modelValue: number
  options?: readonly number[]
  label?: string
}>(), {
  options: () => [0.5, 1, 2, 4],
})

const { t } = useI18n()
const accessibleLabel = computed(() => props.label ?? t('playback.speed'))

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const anchorEl = ref<HTMLElement | null>(null)
const open = ref(false)

const menuOptions = computed(() => props.options.map((option) => ({ value: option, label: `${option}×` })))

function toggle() {
  open.value = !open.value
}

function select(value: string | number) {
  emit('update:modelValue', Number(value))
}
</script>

<template>
  <div ref="anchorEl" class="speed-select" :class="{ open }">
    <button
      type="button"
      class="speed-trigger"
      :aria-label="accessibleLabel"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="toggle"
    >
      <span class="speed-value">{{ modelValue }}×</span>
      <span class="chevron" aria-hidden="true"></span>
    </button>
    <AppleMenu
      v-model:open="open"
      :options="menuOptions"
      :model-value="modelValue"
      :anchor-el="anchorEl"
      :label="accessibleLabel"
      align="right"
      @select="select"
    />
  </div>
</template>

<style scoped>
.speed-select {
  position: relative;
  width: 72px;
}

.speed-trigger {
  position: relative;
  display: flex;
  width: 100%;
  height: 30px;
  align-items: center;
  border: 1px solid rgba(60, 60, 67, 0.16);
  border-radius: 9px;
  padding: 0;
  background: #f0f0f2;
  color: #1d1d1f;
  font: inherit;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;
}

.speed-trigger:hover { background: #e8e8ed; }
.speed-trigger:focus-visible { outline: none; }

.speed-select:focus-within .speed-trigger {
  border-color: rgba(0, 122, 255, 0.58);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.14);
}

.speed-value {
  min-width: 0;
  padding: 0 26px 0 10px;
  overflow: visible;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
}

.chevron {
  position: absolute;
  right: 10px;
  width: 6px;
  height: 6px;
  border-right: 1.5px solid #636366;
  border-bottom: 1.5px solid #636366;
  transform: translateY(-2px) rotate(45deg);
  pointer-events: none;
  transition: transform 160ms ease;
}

.speed-select.open .chevron {
  transform: translateY(2px) rotate(225deg);
}
</style>
