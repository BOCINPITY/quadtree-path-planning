<template>
  <div class="map-container">
    <el-upload drag>
      <el-image class="img-wrap" :src="uploadIcon" fit="cover" />
      <el-text size="large">
        <div>
          拖动上传或 <el-text type="primary" size="large">点击上传</el-text>您的地图
        </div>
      </el-text>

      <template #tip>
        <div class="el-upload__tip">json file</div>
      </template>
    </el-upload>
    <div class="no-map">
      <el-button size="large" text @click="noMap">没有地图?</el-button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import router from "@/router";
import uploadIcon from "@/assets/bg01.png";
const noMap = () => {
  router.push("/SystemView/editor");
};
</script>

<style scoped>
.map-container {
  border-radius: 0.5em;
  width: 100%;
  aspect-ratio: 1;
}
.img-wrap {
  border-radius: 0.5em;
  width: 50%;
  min-width: 400px;
  height: 300px;
}
.no-map {
  display: flex;
  justify-content: end;
}
</style>
