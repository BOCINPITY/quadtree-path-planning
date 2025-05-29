<template>
  <div class="map-manager">
    <!-- 筛选表单 -->
    <el-form :inline="true" :model="filterForm" class="filter-form" @submit.prevent>
      <el-form-item label="地图名称">
        <el-input v-model="filterForm.name" placeholder="请输入地图名称" clearable style="width: 180px;" />
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker v-model="filterForm.createdAt" type="daterange" range-separator="至" start-placeholder="开始日期"
          end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 260px;" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleFilter">筛选</el-button>
        <el-button @click="resetFilter">重置</el-button>
      </el-form-item>
    </el-form>
    <!-- 表格 -->
    <el-table :data="pagedMaps" style="width: 100%" stripe>
      <!-- <el-table-column prop="id" label="ID" width="50" /> -->
      <el-table-column prop="name" label="地图名称" />
      <el-table-column prop="description" label="描述" width="100">
        <template #default="scope">
          <el-tooltip v-if="scope.row.description && scope.row.description.length > 10" :content="scope.row.description"
            placement="top">
            <span
              style="cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-block;max-width:90px;">
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
      <el-table-column prop="isOpenSource" label="是否开放社区">
        <template #default="scope">
          <span>{{ scope.row.isOpenSource ? '是' : '否' }}</span>
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
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]"
        :total="filteredMaps.length" layout="total, sizes, prev, pager, next, jumper" background>
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
    <el-dialog style="background-color: #f1f2f3f4;" v-model="modalVisible" :title="mapDetail?.name">
      <p>{{ mapDetail?.description }}</p>
      <MapPreView :map="mapDetail!" />
    </el-dialog>
    <el-dialog v-model="editModalVisible" :title="`编辑地图`" width="600px">
      <el-form :model="editForm" label-width="100px" label-position="left" v-loading="loading">
        <el-form-item label="地图名称">
          <el-input v-model="editForm.name" placeholder="请输入地图名称" />
        </el-form-item>
        <el-form-item label="地图描述">
          <el-input v-model="editForm.description" type="textarea" placeholder="请输入地图描述" />
        </el-form-item>
        <el-form-item label="是否开放社区">
          <el-switch v-model="editForm.isOpenSource" :active-value="true" :inactive-value="false" active-text="是"
            inactive-text="否" />
        </el-form-item>
        <el-form-item label="分割线颜色">
          <el-color-picker v-model="editForm.dividColor" />
        </el-form-item>
        <el-form-item label="最小分割阈值">
          <el-input-number v-model="editForm.minThreshold" :min="1" :max="9999" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleEditSubmit">保存</el-button>
          <el-button @click="editModalVisible = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted, computed, watch } from "vue";
  import { ElMessage } from "element-plus";
  import { getMapList, type GetMapListDto, deletMapById } from "@/http/map";
  import MapPreView from '@/components/MapPreView.vue';
  import { updateMapById } from "@/http/map";

  const maps = ref<GetMapListDto[]>();
  const mapDetail = ref<GetMapListDto | null>(null);
  const modalVisible = ref(false);
  const editModalVisible = ref(false);
  const loading = ref(false);
  // 筛选表单数据
  const filterForm = ref({
    name: "",
    createdAt: [] as string[]
  });

  // 编辑表单数据
  const editForm = ref({
    id: -1,
    name: '',
    description: '',
    isOpenSource: 0,
    dividColor: '#0077ff',
    minThreshold: 20,
    width: 0,
    height: 0,
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
  const viewMapDetails = (id: number) => {
    modalVisible.value = true;
    const map = maps.value?.find(m => m.id === id);
    if (map) {
      mapDetail.value = map;
    } else {
      ElMessage.error("地图未找到");
    }
  }

  const fetchMaps = async () => {
    const res = await getMapList();
    maps.value = res;

  };
  const editMap = (map: GetMapListDto) => {
    editModalVisible.value = true
    editForm.value = {
      ...map
    };
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

  const handleEditSubmit = async () => {
    try {
      // 这里可以提交 editForm.value 到后端，或 emit 事件
      loading.value = true;
      await updateMapById(editForm.value.id, {
        name: editForm.value.name,
        description: editForm.value.description,
        isOpenSource: editForm.value.isOpenSource,
        width: editForm.value.width,
        height: editForm.value.height,
        dividColor: editForm.value.dividColor,
        minThreshold: editForm.value.minThreshold,
      });
      ElMessage.success("地图信息更新成功");
      await fetchMaps();

    } catch (e) {
      console.error(e);
    } finally {
      loading.value = false;
      editModalVisible.value = false;
    }

  };
</script>

<style scoped>
  .filter-form {
    margin-bottom: 18px;
  }
</style>
