<template>
  <div class="map-manager">
    <el-table :data="maps" style="width: 100%" border>
      <el-table-column prop="id" label="ID" width="50" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="width" label="宽度/px" />
      <el-table-column prop="height" label="高度/px" />
      <el-table-column prop="minThreshold" label="最小分割阈值/px" />
      <el-table-column label="起点">
        <template #default="scope">
          <span>{{ formatPoint(scope.row.startPoint) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="终点">
        <template #default="scope">
          <span>{{ formatPoint(scope.row.endPoint) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间">
        <template #default="scope">
          <span>{{ formatDate(scope.row.createdAt) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间">
        <template #default="scope">
          <span>{{ formatDate(scope.row.updatedAt) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="dividColor" label="分割线颜色">
        <template #default="scope">
          <span
            :style="{
              backgroundColor: scope.row.dividColor,
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
            }"
          ></span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="scope">
          <!-- <el-button size="small" @click="handleDetail(scope.row)">查看</el-button> -->
          <el-button size="small" type="danger" @click="deleteMap(scope.row.id)"
            >删除</el-button
          >
          <!-- <el-button size="small" type="success" @click="exportMap(scope.row)"
            >导出</el-button
          > -->
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { getMapList, type GetMapListDto,deletMapById } from "@/http/map";

const maps = ref<GetMapListDto[]>();

// 格式化点对象
const formatPoint = (point: { x: number; y: number } | null) => {
  return point ? `(${point.x}, ${point.y})` : "无";
};

// 格式化日期
const formatDate = (date: string | Date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};


const fetchMaps = async () => {
    const res = await getMapList();
    maps.value = res;

};


const handleDetail = (map: GetMapListDto) => {
  console.log(map);
};

// 删除地图
const deleteMap = async (id: number) => {
  // console.log(id);
  await deletMapById(id);
  ElMessage.success("地图删除成功");
  await fetchMaps();
};
// 导出地图
const exportMap = async (map: GetMapListDto) => {
  // console.log(map);
};

// 组件挂载时获取地图数据
onMounted(() => {
  fetchMaps();
});
</script>

<style scoped></style>
