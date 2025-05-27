<template>
  <div class="map-manager">
    <!-- 筛选表单 -->
    <el-form :inline="true" :model="filterForm" class="filter-form" @submit.prevent>
      <el-form-item label="地图名称">
        <el-input v-model="filterForm.name" placeholder="请输入地图名称" clearable style="width: 180px;" />
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker
          v-model="filterForm.createdAt"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 260px;"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleFilter">筛选</el-button>
        <el-button @click="resetFilter">重置</el-button>
      </el-form-item>
    </el-form>
    <!-- 表格 -->
    <el-table :data="pagedMaps" style="width: 100%" stripe >
      <!-- <el-table-column prop="id" label="ID" width="50" /> -->
      <el-table-column prop="name" label="地图名称" />
      <el-table-column prop="description" label="描述" width="100">
        <template #default="scope">
          <el-tooltip v-if="scope.row.description && scope.row.description.length > 10" :content="scope.row.description" placement="top">
            <span style="cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-block;max-width:90px;">
              {{ scope.row.description.slice(0, 10) + '...' }}
            </span>
          </el-tooltip>
          <span v-else>{{ scope.row.description }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="width" label="宽度" />
      <el-table-column prop="height" label="高度" />
      <el-table-column prop="minThreshold" label="最小分割阈值" />
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
      <!-- <el-table-column prop="updatedAt" label="更新时间">
        <template #default="scope">
          <span>{{ formatDate(scope.row.updatedAt) }}</span>
        </template>
      </el-table-column> -->
      <el-table-column prop="dividColor" label="分割线颜色">
        <template #default="scope">
          <span :style="{
            backgroundColor: scope.row.dividColor,
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
          }"></span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300">
        <template #default="scope">
          <el-button size="large" type="primary" @click="viewMapDetails(scope.row.id)" link>查看</el-button>
          <el-button size="large" type="success" @click="editMap(scope.row)" link>编辑</el-button>
          <el-popconfirm title="确定要删除该地图吗？" @confirm="deleteMap(scope.row.id)">
            <template #reference>
              <el-button size="large" type="danger" link>删除</el-button>
            </template>
            <template #actions="{ cancel, confirm }">
              <el-button size="small" @click="cancel">取消</el-button>
              <el-button size="small" type="primary" @click="confirm">确定</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <div style="margin-top: 16px; text-align: right;">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[5, 10, 20, 50]"
        :total="filteredMaps.length"
        layout="total, sizes, prev, pager, next, jumper"
        background
      >
      <template #total="{ total }">
        共 {{ total }} 条数据
      </template>
      <template #page-sizes>
        每页显示
        <el-select v-model="pageSize" size="small" style="width: 80px;">
          <el-option label="5" :value="5" />
          <el-option label="10" :value="10" />
          <el-option label="20" :value="20" />
          <el-option label="50" :value="50" />
        </el-select>
      </template>
      </el-pagination>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted, computed, watch } from "vue";
  import { ElMessage } from "element-plus";
  import { getMapList, type GetMapListDto, deletMapById } from "@/http/map";

  const maps = ref<GetMapListDto[]>();

  // 筛选表单数据
  const filterForm = ref({
    name: "",
    createdAt: [] as string[]
  });

  // 格式化点对象
  const formatPoint = (point: { x: number; y: number } | null) => {
    if (point?.x === -1 && point?.y === -1) {
      return "未设置";
    }
    return point ? `[${point.x}, ${point.y}]` : "无";
  };

  // 格式化日期
  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const viewMapDetails = (id: string) => {
    console.log(id);
  }


  const fetchMaps = async () => {
    const res = await getMapList();
    maps.value = res;

  };
  const editMap = (map: GetMapListDto) => {
    // 跳转到编辑地图页面
    // console.log(map);
    window.location.href = `/system/mapmanager/edit/${map.id}`;
  };




  // 删除地图
  const deleteMap = async (id: number) => {
    // console.log(id);
    await deletMapById(id);
    ElMessage.success("地图删除成功");
    await fetchMaps();
  };


  // 组件挂载时获取地图数据
  onMounted(() => {
    fetchMaps();
  });

  // 过滤后的地图列表
  const filteredMaps = computed(() => {
    if (!maps.value) return [];
    let result = maps.value;
    if (filterForm.value.name) {
      result = result.filter(m => m.name.includes(filterForm.value.name));
    }
    if (filterForm.value.createdAt && filterForm.value.createdAt.length === 2) {
      const [start, end] = filterForm.value.createdAt;
      result = result.filter(m => {
        const date = m.createdAt ? new Date(m.createdAt) : null;
        return date && date >= new Date(start) && date <= new Date(end + ' 23:59:59');
      });
    }
    return result;
  });

  // 分页相关
  const currentPage = ref(1);
  const pageSize = ref(10);

  const pagedMaps = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return filteredMaps.value.slice(start, end);
  });

  watch([filteredMaps, pageSize], () => {
    // 如果筛选后当前页超出最大页码，自动跳转到第一页
    if ((currentPage.value - 1) * pageSize.value >= filteredMaps.value.length) {
      currentPage.value = 1;
    }
  });

  const handleFilter = () => {
    // 由于 filteredMaps 是 computed，点击筛选按钮只需触发响应式即可
  };
  const resetFilter = () => {
    filterForm.value.name = "";
    filterForm.value.createdAt = [];
  };
</script>

<style scoped>
.filter-form {
  margin-bottom: 18px;
}
</style>
