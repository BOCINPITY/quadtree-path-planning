<template>
  <el-header>
    <div class="logo" @click="$router.replace('/')">
      <img src="./assets/logo.png" alt="logo" />
      <span>基于四叉树的路径规划演示系统</span>
    </div>
    <UserInfo />
  </el-header>
  <div style="height: 60px"></div>
  <main>
    <RouterView />
  </main>
</template>
<script lang="ts" setup>
import UserInfo from "./components/UserInfo.vue";
</script>
<style scoped>
.el-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 5%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
}
.logo {
  cursor: pointer;
  color: #000;
  border-radius: 8px;
  font-weight: bold;
  display: flex;
  align-items: center;
}
.logo img {
  margin: 0 10px;
  width: 2vw;
  min-width: 30px;
}
</style>
