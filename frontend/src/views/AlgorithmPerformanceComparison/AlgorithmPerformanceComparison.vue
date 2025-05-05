<template>
  <div class="algorithm-performance-comparison">
    <h4>算法性能对比</h4>
    <div class="algorithm-selection">
      <el-form-item label="选择地图">
        <el-select v-model="selectedMap" placeholder="请选择地图">
          <el-option
            v-for="item in maps"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <div class="dynamic-testing">
        <el-button type="primary" @click="runTests">运行测试</el-button>
      </div>
    </div>

    <!-- 性能指标展示 -->
    <div class="performance-metrics">
      <h4>性能指标</h4>
      <el-table :data="performanceResults" style="width: 100%" border>
        <el-table-column prop="algorithm" label="算法" />
        <el-table-column prop="pathLength" label="路径总长度" />
        <el-table-column prop="computationTime" label="计算时间 (ms)" />
        <el-table-column prop="memoryUsage" label="内存使用量 (KB)" />
        <el-table-column prop="nodeExpansion" label="节点扩展数" />
      </el-table>
    </div>

    <!-- 路径可视化 -->
    <div class="path-visualization">
      <h4>算法性能测试对比可视化</h4>
      <div id="chart-container">
        <!-- 图表绘制区域 -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  ElButton,
  ElFormItem,
  ElSelect,
  ElOption,
  ElTable,
  ElTableColumn,
} from "element-plus";
import { getMapList, type GetMapListDto } from "@/http/map";
import { aStar, dijkstra, findNodeContainingPoint } from "@/utils/pathFinding";
import { buildQuadTreeFrontend } from "@/utils/quadTree";

import type { Obstacles } from "@/@types/dto";

const maps = ref<GetMapListDto[]>([]);
const selectedMap = ref<number>();
const performanceResults = ref([
  {
    algorithm: "A*算法",
    pathLength: 0,
    computationTime: 0,
    memoryUsage: 0,
    nodeExpansion: 0,
  },
  {
    algorithm: "Dijkstra算法",
    pathLength: 0,
    computationTime: 0,
    memoryUsage: 0,
    nodeExpansion: 0,
  },
]);

const fetchMaps = async () => {
  const res = await getMapList();
  maps.value = res;
};


const runTests = async () => {
  if (!selectedMap.value) {
    alert("请选择地图");
    return;
  }

  // 假设从后端获取地图数据并生成四叉树
  const mapData = maps.value.find((map) => map.id === selectedMap.value);
  if (!mapData) return;

  const quadTreeRoot = buildQuadTreeFrontend({
    width: mapData.width,
    height: mapData.height,
    obstacles:(mapData.obstacles) as Obstacles[],
    minThreshold: mapData.minThreshold,
    obstacleRatioThreshold: 0.2,
  });
  const startPoint = {
    x: Math.floor(Math.random() * mapData.width),
    y: Math.floor(Math.random() * mapData.height),
  };
  const endPoint = {
    x: Math.floor(Math.random() * mapData.width),
    y: Math.floor(Math.random() * mapData.height),
  };

  const startNode = findNodeContainingPoint(
    quadTreeRoot,
    startPoint.x,
    startPoint.y
  );
  const endNode = findNodeContainingPoint(
    quadTreeRoot,
    endPoint.x,
    endPoint.y
  );

  if (!startNode || !endNode) {
    alert("无法找到起点或终点");
    return;
  }

  // A*算法测试
  const aStarStart = performance.now();
  const aStarResult = aStar(startNode, endNode, quadTreeRoot, "manhattan");
  const aStarEnd = performance.now();

  // Dijkstra算法测试
  const dijkstraStart = performance.now();
  const dijkstraResult = dijkstra(startNode, endNode, quadTreeRoot);
  const dijkstraEnd = performance.now();

  // 更新性能结果
  performanceResults.value = [
    {
      algorithm: "A*算法",
      pathLength: Number((aStarResult.path?.reduce((acc, node) => acc + (node.gCost ? node.gCost : 0), 0) || 0).toFixed(2)),
      computationTime: aStarEnd - aStarStart,
      memoryUsage: 1024, // 假设值
      nodeExpansion: aStarResult.steps.length,
    },
    {
      algorithm: "Dijkstra算法",
      pathLength: Number((dijkstraResult.path?.reduce((acc, node) => acc + (node.gCost ? node.gCost : 0), 0) || 0).toFixed(2)),
      computationTime: dijkstraEnd - dijkstraStart,
      memoryUsage: 2048, // 假设值
      nodeExpansion: dijkstraResult.steps.length,
    },
  ];
};

onMounted(() => {
  fetchMaps();
});
</script>

<style scoped>
h4 {
  margin-bottom: 20px;
}
.algorithm-performance-comparison {
  padding: 20px;
}

.algorithm-selection {
  margin-bottom: 20px;
  max-width: 200px;
}

.path-visualization {
  margin-bottom: 20px;
}

#chart-container {
  width: 100%;
  height: 400px;
  background-color: #f0f0f0;
  border: 1px solid #e7e2e2;
  border-radius: 8px;
}
</style>
