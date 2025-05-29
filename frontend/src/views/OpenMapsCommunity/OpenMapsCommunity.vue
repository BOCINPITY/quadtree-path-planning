<template>
  <div>
    <el-row :gutter="30" justify="start" style="flex-wrap: wrap;">

      <el-col v-for="map in openSouceMaps" :key="map.id" :span="6" class="map-card-col">

        <el-card class="map-card" shadow="hover">
          <MapPreView :map="map" />
          <div class="map-detail">
            <div class="map-name">
              {{ map.name }}
            </div>
            <div class="description">
              {{ map.description }}</div>
          </div>
        </el-card>
        <div class="author">
          <div class="user-detail">
            <el-avatar :src="map.user.avatar" />
            <div class="name">{{ map.user.name || '匿名用户' }}</div>
            <el-tooltip :content="map.user.email" placement="top">
              <div class="emial" style="cursor:pointer; color:#409EFF;">邮箱</div>
            </el-tooltip>
          </div>
          <div class="operations">
            <el-button type="primary" text bg @click="loadToMapEditor(map)">加载地图到编辑器</el-button>
            <el-button type="info" text bg @click="handleMapClick(map)" style="margin-left: 10px;">预览地图</el-button>
          </div>
        </div>
      </el-col>
    </el-row>
    <el-dialog style="background-color: #f1f2f3f4;" v-model="modalVisible" :title="mapDetail?.name">
      <p>{{ mapDetail?.description }}</p>
      <MapPreView :map="mapDetail!" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { getOpenSourceMapList } from '@/http/map';
  import type { OpenSourceMap } from '@/http/map';
  import MapPreView from '@/components/MapPreView.vue';
  import { useRouter } from 'vue-router';
  const router = useRouter();
  const loadToMapEditor = (map: OpenSourceMap) => {
    router.push({ path: '/system', query: { mapId: map.id } });
  };
  const openSouceMaps = ref<OpenSourceMap[]>([]);
  const modalVisible = ref(false);
  const mapDetail = ref<OpenSourceMap | null>(null);
  const handleMapClick = (map: OpenSourceMap) => {
    mapDetail.value = map;
    modalVisible.value = true;
  };
  onMounted(async () => {
    try {
      const res = await getOpenSourceMapList();
      openSouceMaps.value = res;
    } catch (error) {
      console.error('获取开放地图列表失败:', error);
    }
  })


</script>

<style scoped>
  .map-card-col {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
    flex-direction: column;
  }

  .map-card-col .author .operations {
    margin-top: 10px;
    display: flex;
  }

  .map-card-col .author .user-detail {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  button {
    width: 100%;
  }

  .map-card-col .author {
    display: flex;
    flex-direction: column;
    border: 15px solid #eaeaea;
    width: 300px;
    padding: 10px;
    border-bottom-left-radius: 16px;
    border-bottom-right-radius: 16px;
  }


  .map-card-col .author .user-detail .name {
    color: #8b8a8a;
    font-size: 14px;
  }

  .map-card {
    width: 300px;
    height: 300px;
    transition: transform 0.25s cubic-bezier(.4, 2, .6, 1);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    position: relative;
  }

  .map-card .map-detail {
    position: absolute;
    color: rgb(100, 123, 255);
    font-size: 16px;
    left: 0;
    bottom: 0;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    padding: 10px;
  }

  .map-card .map-detail .map-name {
    font-weight: bold;
    font-size: 1.2rem;
    margin-bottom: 5px;
  }

  .map-card .map-detail .description {
    font-size: 0.9rem;
    color: #2ba0ff;
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
