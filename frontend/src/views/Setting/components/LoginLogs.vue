<template>
  <div class="login-logs">
    <el-table :data="logs" style="width: 100%" border stripe>
      <el-table-column prop="id" label="ID" width="50" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="ipAddress" label="IP地址" />
      <el-table-column prop="loginTime" label="登录时间" />
      <el-table-column prop="userAgent" label="用户代理" width="700" />
    </el-table>
    <el-pagination
      background
      layout="prev, pager, next"
      :total="total"
      :page-size="pageSize"
      :current-page="currentPage"
      @current-change="handlePageChange"
      style="padding: 20px 0"
    />
  </div>
</template>

<script lang="ts" setup>
import { getLoginLogs } from "@/http/user";
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/store/auth";
import { storeToRefs } from "pinia";

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

interface Log {
  id: number;
  username: string;
  ipAddress: string;
  loginTime: string;
  userAgent: string;
}

const logs = ref<Log[]>([]);
const total = ref(0);
const pageSize = ref(10);
const currentPage = ref(1);

const fetchLogs = async (page: number) => {
  if (!user.value?.id) {
    console.error("用户信息未加载完成，请稍后再试");
    return;
  }

  try {
    const res = await getLoginLogs({
      page,
      limit: pageSize.value,
      id: user.value.id,
    });

    if (res.code === 200) {
      logs.value = res.data.logs.map((log: Log) => ({
        ...log,
        loginTime: new Date(log.loginTime).toLocaleString(),
        username: user.value?.name,
      }));
      total.value = res.data.total;
    } else {
      console.error("获取登录日志失败", res.message);
    }
  } catch (error) {
    console.error("请求登录日志时发生错误", error);
  }
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchLogs(page);
};

onMounted(() => {
  fetchLogs(currentPage.value);
});
</script>

<style scoped>
/* .login-logs {
  max-width: 1080px;
} */
</style>
