<script setup lang="ts">
defineProps<{
  disabled: boolean
  playing: boolean
  canStepBack: boolean
  canStepForward: boolean
}>()

defineEmits<{
  stepBack: []
  toggle: []
  stepForward: []
}>()
</script>

<template>
  <div class="transport" role="group" aria-label="播放控制">
    <button
      type="button"
      :disabled="disabled || !canStepBack"
      aria-label="上一步"
      title="上一步"
      @click="$emit('stepBack')"
    >
      <span aria-hidden="true">┃◀</span>
    </button>
    <button
      type="button"
      class="play"
      :disabled="disabled"
      :aria-label="playing ? '暂停' : '播放'"
      :title="playing ? '暂停' : '播放'"
      @click="$emit('toggle')"
    >
      <span aria-hidden="true">{{ playing ? 'Ⅱ' : '▶' }}</span>
    </button>
    <button
      type="button"
      :disabled="disabled || !canStepForward"
      aria-label="下一步"
      title="下一步"
      @click="$emit('stepForward')"
    >
      <span aria-hidden="true">▶┃</span>
    </button>
  </div>
</template>

<style scoped>
.transport {
  display: inline-flex;
  width: 104px;
  height: 32px;
  align-items: center;
  justify-content: space-between;
  padding: 2px;
  border-radius: 10px;
  background: #f0f0f2;
}

button {
  display: grid;
  width: 30px;
  height: 28px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #636366;
  font: inherit;
  font-size: 9px;
  cursor: pointer;
  transition: background 140ms ease, color 140ms ease, transform 140ms ease;
}

button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.78);
  color: #1d1d1f;
}

button:active:not(:disabled) { transform: scale(0.92); }

button:focus-visible {
  outline: 2px solid rgba(0, 122, 255, 0.56);
  outline-offset: 1px;
}

button.play {
  background: #ffffff;
  color: #1d1d1f;
  font-size: 11px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

button:disabled {
  opacity: 0.28;
  cursor: default;
}
</style>
