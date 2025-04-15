<template>
  <div class="container">
    <div class="left"><MapUpload /></div>
    <el-divider direction="vertical" style="height: auto" />
    <div class="right"></div>
  </div>
</template>

<script setup lang="ts">
import MapUpload from "./components/MapUpload.vue";
</script>

<style scoped>
.container {
  display: flex;
  height: 100%;
  justify-content: space-between;
}
.left,
.right {
  flex: 1;
}
</style>
