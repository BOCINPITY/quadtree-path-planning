<template>
  <el-container>
    <el-aside :width="isCollapsed ? '64px' : '150px'">
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        :collapse="isCollapsed"
      >
        <RouterLink to="/system">
          <el-menu-item index="1" class="menu-item">
            <el-icon><House /></el-icon>
            <template #title>首页</template>
          </el-menu-item>
        </RouterLink>
        <RouterLink to="/system/mapmanager">
          <el-menu-item index="3" class="menu-item">
            <el-icon><Place /></el-icon>
            <template #title>地图管理</template>
          </el-menu-item>
        </RouterLink>
        <RouterLink to="/system/user">
          <el-menu-item index="2" class="menu-item">
            <el-icon><User /></el-icon>
            <template #title>用户设置</template>
          </el-menu-item>
        </RouterLink>
        <!-- <RouterLink to="/system/apc">
          <el-menu-item index="4" class="menu-item">
            <el-icon><DataAnalysis /></el-icon>
            <template #title>算法性能对比</template>
          </el-menu-item>
        </RouterLink> -->
      </el-menu>

      <div
        @click="toggleCollapse"
        :class="isCollapsed ? 'collapse-button-closed' : 'collapse-button-opened'"
        :style="{ left: isCollapsed ? '64px' : '150px' }"
      >
        <el-icon>
          <template v-if="isCollapsed">
            <ArrowRight />
          </template>
          <template v-else>
            <ArrowLeft />
          </template>
        </el-icon>
      </div>
    </el-aside>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script lang="ts" setup>
import { House, Place, User, DataAnalysis } from "@element-plus/icons-vue";
import { ref, watchEffect } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import gsap from "gsap";

const activeMenu = ref("1");
const isCollapsed = ref(false);
const router = useRouter();

const toggleCollapse = () => {
  const targetWidth = isCollapsed.value ? "150px" : "64px";
  gsap.to(".el-aside", { width: targetWidth, duration: 0.3 });
  gsap.to(".collapse-button", { left: targetWidth, duration: 0.3 });
  isCollapsed.value = !isCollapsed.value;
};

watchEffect(() => {
  activeMenu.value = router.currentRoute.value.path;
  if (activeMenu.value === "/system") {
    activeMenu.value = "1";
  } else if (activeMenu.value === "/system/user") {
    activeMenu.value = "2";
  } else if (activeMenu.value === "/system/mapmanager") {
    activeMenu.value = "3";
  } else if (activeMenu.value === "/system/apc") {
    activeMenu.value = "4";
  }
});
</script>

<style scoped>
.child-router-view {
  flex: 1;
}
.el-menu,
.el-aside,
.el-main {
  height: calc(100vh - 60px);
}
.menu-item {
  display: flex;
  align-items: center;
}
.collapse-button-opened {
  padding: 10px;
  position: absolute;
  bottom: 50%;
  transform: translateX(-70%);
  transition: left 0.3s ease;
  cursor: pointer;
}
.collapse-button-closed {
  padding: 10px;
  position: absolute;
  bottom: 50%;
  transform: translateX(-30%);
  transition: left 0.3s ease;
  cursor: pointer;
}
::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
