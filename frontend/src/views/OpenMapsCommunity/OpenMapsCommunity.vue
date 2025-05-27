<template>
  <div>
    <el-row :gutter="30" justify="start" style="flex-wrap: wrap;">
      <el-col
        v-for="item in demoMaps"
        :key="item.id"
        :span="6"
        class="map-card-col"
      >
        <el-card
          class="map-card"
          shadow="hover"
        >
        <el-image
          :src="`https://picsum.photos/seed/${item.id}/340/340`"
          fit="cover"
          style="width: 240px; height: 240px;"
          :preview-src-list="[]"
          :lazy="true"
          :loading="true"
          :error="true"
          :alt="item.name"
        />
          <div class="map-card-content">
            <div class="map-title">{{ item.name }}</div>
            <div class="map-desc">{{ item.description }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const demoMaps = ref([
  { id: 1, name: '开放地图A', description: '这是一个开放的地图A，支持社区共享。' },
  { id: 2, name: '开放地图B', description: '地图B，适合路径规划演示。' },
  { id: 3, name: '开放地图C', description: '地图C，包含多种障碍物。' },
  { id: 4, name: '开放地图D', description: '地图D，适合算法性能测试。' },
  { id: 5, name: '开放地图E', description: '地图E，社区成员上传。' },
  { id: 6, name: '开放地图E', description: '地图E，社区成员上传。' },
  { id: 7, name: '开放地图E', description: '地图E，社区成员上传。' },
  { id: 8, name: '开放地图E', description: '地图E，社区成员上传。' },
  { id: 9, name: '开放地图E', description: '地图E，社区成员上传。' },
  { id: 10, name: '开放地图E', description: '地图E，社区成员上传。' },
  { id: 11, name: '开放地图E', description: '地图E，社区成员上传。' },
  { id: 12, name: '开放地图E', description: '地图E，社区成员上传。' },
  { id: 13, name: '开放地图E', description: '地图E，社区成员上传。' },
  { id: 14, name: '开放地图E', description: '地图E，社区成员上传。' },
]);

</script>

<style scoped>
.map-card-col {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
}
.map-card {
  width: 340px;
  height: 340px;
  transition: transform 0.25s cubic-bezier(.4,2,.6,1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.map-card:hover {
  transform: scale(1.01);
  z-index: 2;
}
.map-card-content {
  text-align: center;
}
.map-title {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 10px;
}
.map-desc {
  color: #888;
  font-size: 0.95rem;
}
</style>
