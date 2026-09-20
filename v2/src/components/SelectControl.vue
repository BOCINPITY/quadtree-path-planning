<script setup lang="ts">
interface SelectOption {
  value: string
  label: string
}

const props = withDefaults(defineProps<{
  modelValue: string
  options: readonly SelectOption[]
  label: string
  disabled?: boolean
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function updateValue(event: Event) {
  emit('update:modelValue', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <label class="select-control" :class="{ disabled }">
    <span class="select-value">{{ options.find((option) => option.value === modelValue)?.label ?? '请选择' }}</span>
    <span class="chevron" aria-hidden="true"></span>
    <select :value="props.modelValue" :aria-label="label" :disabled="disabled" @change="updateValue">
      <option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
    </select>
  </label>
</template>

<style scoped>
.select-control {
  position: relative;
  display: flex;
  width: 100%;
  height: 38px;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 10px;
  background: #f0f0f2;
  color: #1d1d1f;
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
}

.select-control:hover { background: #e8e8ed; }

.select-control:focus-within {
  border-color: rgba(0, 122, 255, 0.34);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.select-control.disabled { opacity: 0.45; cursor: default; }

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
