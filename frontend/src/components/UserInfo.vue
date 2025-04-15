<template>
  <div class="user-info">
    <el-dropdown placement="bottom">
      <el-avatar size="medium" class="user-avatar">
        {{ user?.name || "登录" }}
      </el-avatar>
      <template #dropdown>
        <el-dropdown-menu v-if="user">
          <el-dropdown-item>
            <el-text> 邮箱：{{ user?.email }}</el-text>
          </el-dropdown-item>
          <el-dropdown-item>
            <el-text> 用户名：{{ user?.name }}</el-text>
          </el-dropdown-item>
          <el-dropdown-item @click="confirmLogout">登出</el-dropdown-item>
        </el-dropdown-menu>
        <el-dropdown-item v-else @click="route.replace('/login')">
          <el-text>请登录</el-text>
        </el-dropdown-item>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/store/auth";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const route = useRouter();
const confirmLogout = () => {
  authStore.logoutUser();
  route.replace("/login");
};
</script>

<style scoped>
.user-info {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
}
.user-avatar {
  cursor: pointer;
  background-color: #409eff;
  color: white;
  font-size: 12px;
}
</style>
