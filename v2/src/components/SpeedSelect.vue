<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: number
  options?: readonly number[]
  label?: string
}>(), {
  options: () => [0.5, 1, 2, 4],
  label: '播放速度',
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

function updateValue(event: Event) {
  emit('update:modelValue', Number((event.target as HTMLSelectElement).value))
}
</script>

<template>
  <label class="speed-select">
    <span class="speed-value">{{ modelValue }}×</span>
    <span class="chevron" aria-hidden="true"></span>
    <select :value="modelValue" :aria-label="label" @change="updateValue">
      <option v-for="option in options" :key="option" :value="option">{{ option }}×</option>
    </select>
  </label>
</template>

<style scoped>
.speed-select {
  position: relative;
  display: inline-flex;
  width: 72px;
  height: 30px;
  align-items: center;
  border: 1px solid rgba(60, 60, 67, 0.16);
  border-radius: 9px;
  background: #f0f0f2;
  color: #1d1d1f;
  cursor: pointer;
  transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;
}

.speed-select:hover { background: #e8e8ed; }

.speed-select:focus-within {
  border-color: rgba(0, 122, 255, 0.58);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.14);
}

.speed-value {
  min-width: 0;
  padding-left: 10px;
  padding-right: 26px;
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
}

select {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}
</style>
