<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

interface AppleMenuOption {
  value: string | number
  label: string
}

const props = withDefaults(defineProps<{
  open: boolean
  options: readonly AppleMenuOption[]
  modelValue: string | number
  anchorEl: HTMLElement | null
  align?: 'left' | 'right'
  label?: string
}>(), {
  align: 'left',
  label: '选项',
})

const emit = defineEmits<{
  'update:open': [open: boolean]
  select: [value: string | number]
}>()

const menuEl = ref<HTMLElement | null>(null)
const menuStyle = ref<Record<string, string>>({})
const highlightIndex = ref(0)

function close() {
  emit('update:open', false)
}

function choose(value: string | number) {
  emit('select', value)
  close()
}

function positionMenu() {
  const anchor = props.anchorEl
  const menu = menuEl.value
  if (!anchor || !menu) return

  const rect = anchor.getBoundingClientRect()
  const gap = 6
  const margin = 10
  const menuWidth = menu.offsetWidth
  const menuHeight = menu.offsetHeight
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let left = props.align === 'right' ? rect.right - menuWidth : rect.left
  left = Math.min(Math.max(margin, left), viewportWidth - menuWidth - margin)

  const spaceBelow = viewportHeight - rect.bottom - gap - margin
  const opensUp = spaceBelow < menuHeight && rect.top - gap - menuHeight >= margin
  const top = opensUp ? rect.top - gap - menuHeight : rect.bottom + gap

  menuStyle.value = {
    ...menuStyle.value,
    position: 'fixed',
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`,
    transformOrigin: opensUp ? 'bottom center' : 'top center',
  }
}

function onPointerDown(event: PointerEvent) {
  const target = event.target as Node
  if (menuEl.value?.contains(target)) return
  if (props.anchorEl?.contains(target)) return
  close()
}

function onKeydown(event: KeyboardEvent) {
  const count = props.options.length
  if (count === 0) return
  if (event.key === 'Escape') {
    close()
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    highlightIndex.value = (highlightIndex.value + 1) % count
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    highlightIndex.value = (highlightIndex.value - 1 + count) % count
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    const option = props.options[highlightIndex.value]
    if (option) choose(option.value)
  }
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    const width = props.anchorEl?.getBoundingClientRect().width ?? 96
    menuStyle.value = {
      position: 'fixed',
      left: '0px',
      top: '0px',
      minWidth: `${Math.max(width, 96)}px`,
    }
    highlightIndex.value = Math.max(0, props.options.findIndex((option) => option.value === props.modelValue))
    nextTick(positionMenu)
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeydown)
  } else {
    document.removeEventListener('pointerdown', onPointerDown, true)
    document.removeEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown, true)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="apple-menu">
      <div
        v-if="open"
        ref="menuEl"
        class="apple-menu"
        :style="menuStyle"
        role="listbox"
        :aria-label="label"
      >
        <div class="apple-menu-scroll">
          <button
            v-for="(option, index) in options"
            :key="String(option.value)"
            type="button"
            class="apple-menu-item"
            :class="{ selected: option.value === modelValue, highlighted: index === highlightIndex }"
            role="option"
            :aria-selected="option.value === modelValue"
            @mouseenter="highlightIndex = index"
            @click="choose(option.value)"
          >
            <span class="apple-check" aria-hidden="true">{{ option.value === modelValue ? '✓' : '' }}</span>
            <span class="apple-label">{{ option.label }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.apple-menu {
  box-sizing: border-box;
  z-index: 1000;
  padding: 5px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  background: rgba(248, 248, 250, 0.82);
  color: #1d1d1f;
  box-shadow: 0 12px 44px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.06);
  backdrop-filter: saturate(180%) blur(22px);
  -webkit-backdrop-filter: saturate(180%) blur(22px);
}

.apple-menu-scroll {
  max-height: min(320px, 60vh);
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.apple-menu-item {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 30px;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 8px;
  padding: 6px 10px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 13px;
  line-height: 1.2;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}

.apple-menu-item.highlighted {
  background: var(--blue, #007aff);
  color: #ffffff;
}

.apple-check {
  display: inline-flex;
  width: 14px;
  flex: 0 0 14px;
  align-items: center;
  justify-content: center;
  color: var(--blue, #007aff);
  font-size: 13px;
  font-weight: 600;
}

.apple-menu-item.highlighted .apple-check {
  color: #ffffff;
}

.apple-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.apple-menu-enter-active,
.apple-menu-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
}

.apple-menu-enter-from,
.apple-menu-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-4px);
}
</style>
