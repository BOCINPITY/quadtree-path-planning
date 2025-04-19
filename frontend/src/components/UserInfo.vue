<template>
  <div class="user-info">
    <el-dropdown placement="bottom">
      <el-avatar
        class="user-avatar"
        :icon="UserFilled"
        :src="
          user?.name
            ? 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
            : ''
        "
      >
        {{ "登录" }}
      </el-avatar>
      <template #dropdown>
        <el-dropdown-menu v-if="user">
          <el-dropdown-item>
            <div>个人信息</div>
          </el-dropdown-item>
          <el-dropdown-item @click="confirmLogout">登出</el-dropdown-item>
        </el-dropdown-menu>
        <el-dropdown-item v-else @click="route.replace('/login')">
          <div>请登录</div>
        </el-dropdown-item>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/store/auth";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { UserFilled } from "@element-plus/icons-vue";

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
.user-avatar:hover {
  background-color: #66b1ff;
}
</style>
