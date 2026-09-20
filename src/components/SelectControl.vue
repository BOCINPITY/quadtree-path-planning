<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppleMenu from './AppleMenu.vue'

const props = withDefaults(defineProps<{
  modelValue: string
  options: readonly { value: string; label: string }[]
  label: string
  disabled?: boolean
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useI18n()

const anchorEl = ref<HTMLElement | null>(null)
const open = ref(false)

const menuOptions = computed(() => props.options.map((option) => ({ value: option.value, label: option.label })))

const selectedLabel = computed(() =>
  props.options.find((option) => option.value === props.modelValue)?.label ?? t('common.choose'),
)

function toggle() {
  if (props.disabled) return
  open.value = !open.value
}

function select(value: string | number) {
  emit('update:modelValue', String(value))
}
</script>

<template>
  <div ref="anchorEl" class="select-control" :class="{ open, disabled }">
    <button
      type="button"
      class="select-trigger"
      :aria-label="label"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :disabled="disabled"
      @click="toggle"
    >
      <span class="select-value">{{ selectedLabel }}</span>
      <span class="chevron" aria-hidden="true"></span>
    </button>
    <AppleMenu
      v-model:open="open"
      :options="menuOptions"
      :model-value="modelValue"
      :anchor-el="anchorEl"
      :label="label"
      align="left"
      @select="select"
    />
  </div>
</template>

<style scoped>
.select-control {
  position: relative;
  width: 100%;
}

.select-control.disabled {
  opacity: 0.45;
}

.select-trigger {
  position: relative;
  display: flex;
  width: 100%;
  height: 38px;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 0;
  background: #f0f0f2;
  color: #1d1d1f;
  font: inherit;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  transition: background 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
}

.select-trigger:hover { background: #e8e8ed; }
.select-trigger:focus-visible { outline: none; }

.select-control:focus-within .select-trigger {
  border-color: rgba(0, 122, 255, 0.34);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.select-control.disabled .select-trigger {
  cursor: default;
}

.select-value {
  min-width: 0;
  overflow: hidden;
  padding: 0 34px 0 12px;
  font-size: 13px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chevron {
  position: absolute;
  right: 13px;
  width: 7px;
  height: 7px;
  border-right: 1.5px solid #636366;
  border-bottom: 1.5px solid #636366;
  transform: translateY(-2px) rotate(45deg);
  pointer-events: none;
  transition: transform 160ms ease;
}

.select-control.open .chevron {
  transform: translateY(2px) rotate(225deg);
}
</style>
