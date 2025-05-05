<template>
  <el-tabs v-model="activeName" class="demo-tabs">
    <el-tab-pane label="基础信息" name="basicInfo">
      <BasicInfo />
    </el-tab-pane>
    <el-tab-pane label="安全设置" name="securitySetting">
      <SecuritySetting />
    </el-tab-pane>
    <el-tab-pane label="登录日志" name="loginLogs">
      <LoginLogs />
    </el-tab-pane>
  </el-tabs>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import BasicInfo from "./components/BasicInfo.vue";
import SecuritySetting from "./components/SecuritySetting.vue";
import LoginLogs from "./components/LoginLogs.vue";

const activeName = ref("basicInfo");
</script>

<style></style>
