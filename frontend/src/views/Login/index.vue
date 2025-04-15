<template>
  <div class="login_form">
    <form class="form_container">
      <div class="logo_container">
        <img src="../../assets/logo.png" alt="" />
      </div>
      <div class="title_container">
        <p class="title">登陆您的账号</p>
        <span class="subtitle">登陆系统，欢迎使用我们的服务！</span>
      </div>
      <br />
      <div class="input_container">
        <label class="input_label" for="email">邮箱地址</label>
        <input
          placeholder="请输入您的邮箱地址"
          v-model="email"
          type="text"
          class="input_field"
          id="email"
        />
      </div>
      <div class="input_container">
        <label class="input_label" for="password">密码</label>
        <input
          placeholder="请输入您的密码"
          v-model="password"
          type="password"
          class="input_field"
          id="password"
        />
      </div>
      <button type="submit" class="sign-in_btn" @click.prevent="handleLogin">
        <span>登陆</span>
      </button>
    </form>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import "element-plus/theme-chalk/el-message.css";

const email = ref("");
const password = ref("");
const authStore = useAuthStore();
const router = useRouter();

const handleLogin = async () => {
  try {
    await authStore.loginUser(email.value, password.value);
    ElMessage.success(`登录成功，欢迎回来！${authStore.user?.name}`);
    router.push("/system");
  } catch (error) {
    ElMessage.error("登录失败，请检查您的邮箱和密码");
    console.error("Login failed:", error);
  }
};
</script>

<style scoped>
.login_form {
  display: flex;
  margin-top: 50px;
  justify-content: center;
}
.form_container {
  width: fit-content;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 50px 40px 20px 40px;
  background-color: #ffffff;
  box-shadow: 0px 106px 42px rgba(0, 0, 0, 0.01), 0px 59px 36px rgba(0, 0, 0, 0.05),
    0px 26px 26px rgba(0, 0, 0, 0.09), 0px 7px 15px rgba(0, 0, 0, 0.1);
  border-radius: 11px;
  font-family: "Inter", sans-serif;
}
.logo_container {
  width: 80px;
  height: 80px;
  background: linear-gradient(180deg, rgba(248, 248, 248, 0) 50%, #f8f8f888 100%);
  border: 1px solid #f7f7f8;
  border-radius: 11px;
}
.logo_container img {
  width: 100%;
  height: 100%;
  border-radius: 11px;
}
.title_container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #212121;
}
.subtitle {
  font-size: 0.725rem;
  max-width: 80%;
  text-align: center;
  line-height: 1.1rem;
  color: #8b8e98;
}
.input_container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.input_label {
  font-size: 0.75rem;
  color: #8b8e98;
  font-weight: 600;
}
.input_field {
  height: 40px;
  padding-left: 10px;
  border-radius: 7px;
  border: 1px solid #e5e5e5;
  transition: all 0.3s;
}
.input_field:focus {
  border: 1px solid #242424;
  background-color: transparent;
}
.sign-in_btn {
  width: 100%;
  height: 40px;
  border: none;
  background: #115dfc;
  border-radius: 7px;
  color: #ffffff;
  cursor: pointer;
}
</style>
