<template>
  <div class="login_form">
    <form class="form_container">
      <div class="logo_container">
        <img src="../../assets/logo.png" alt="" />
      </div>
      <div class="title_container">
        <p class="title">
          {{ isLoginView ? "登录您的账号" : "注册一个账号来使用我们的系统" }}
        </p>
        <span class="subtitle">登录系统，欢迎使用我们的服务！</span>
        <span class="no-account" v-if="isLoginView" @click="toggleView">还没有账号？去注册</span>
        <span class="no-account" v-if="!isLoginView" @click="toggleView">已有账号？去登录</span>
      </div>
      <br />
      <div class="input_container">
        <label class="input_label" for="email">邮箱地址</label>
        <input placeholder="请输入您的邮箱地址" v-model="email" type="text" class="input_field" id="email" />
      </div>
      <div class="input_container " v-if="!isLoginView">
        <label class="input_label" for="code">验证码</label>
        <div class="code">
          <input placeholder="请输入验证码" v-model="code" type="text" class="input_field" id="code" />
          <el-button :disabled="getverifyCodeStatus" @click="getverifyCode" type="primary"
            style="height: 40px;border-radius: 8px;margin-left: 20px;"> {{ countdown > 0 ? countdown + '秒后重新获取' :
              '获取验证码' }}
          </el-button>
        </div>
      </div>
      <div class="input_container" v-if="!isLoginView">
        <label class="input_label" for="username">用户名</label>
        <input placeholder="请输入您的用户名" v-model="username" type="text" class="input_field" id="username" />
      </div>
      <div class="input_container">
        <label class="input_label" for="password">密码</label>
        <input placeholder="请输入您的密码" v-model="password" type="password" class="input_field" id="password" />
      </div>
      <button type="submit" class="sign-in_btn" @click.prevent="handleSubmit">
        <span>
          {{ isLoginView ? "登录" : "注册" }}
        </span>
      </button>
    </form>
    <div class="forget_password">忘记密码</div>
  </div>
</template>

<script lang="ts" setup>
  import { onUnmounted, ref } from "vue";
  import { useAuthStore } from "@/store/auth";
  import { useRouter } from "vue-router";
  import { ElMessage } from "element-plus";
  import "element-plus/theme-chalk/el-message.css";
  import { gsap } from "gsap";
  import { getCode,register } from "@/http/auth"

  const email = ref("");
  const password = ref("");
  const username = ref("");
  const code = ref("");
  const getverifyCodeStatus = ref(false);
  //验证码倒计时
  const countdown = ref(0);
  const authStore = useAuthStore();
  const router = useRouter();
  const isLoginView = ref(true);
  const timer = ref<number | null>(null);


  const validateInputs = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      ElMessage.error("请输入有效的邮箱地址");
      return false;
    }
    if (!isLoginView.value && !code.value) {
      ElMessage.error("请输入验证码");
      return false;
    }
    if (!isLoginView.value && !username.value) {
      ElMessage.error("请输入用户名");
      return false;
    }
    if (!password.value) {
      ElMessage.error("请输入密码");
      return false;
    }
    if (password.value.length < 6) {
      ElMessage.error("密码长度不能少于六位");
      return false;
    }
    return true;
  };
  const loginSubmit = async() => {
    try {
      await authStore.loginUser(email.value, password.value);
      ElMessage.success(`登录成功，欢迎回来！${authStore.user?.name}`);
      router.push("/system");
    } catch (error) {
      ElMessage.error("登录失败，请检查您的邮箱和密码");
      console.error("Login failed:", error);
    }
  }
  const registerSubmit = async() => {
    try {
      const res = await register(email.value, code.value, username.value, password.value);
      ElMessage.success(res.message);
      isLoginView.value = true; // 切换到登录视图
    } catch (error) {
      ElMessage.error("注册失败，请检查您的输入");
      console.error("Register failed:", error);
    }
  }

  const handleSubmit = async () => {
    if (!validateInputs()) return;
    // 如果是登录
    if (isLoginView.value) {
      await loginSubmit();
    }else{
      await registerSubmit();
    }
  };
  const getverifyCode = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      ElMessage.error("请输入有效的邮箱地址");
      return false;
    }
    if (countdown.value > 0) return; // 防止重复点击
    try {
      getverifyCodeStatus.value = true;
      const res = await getCode(email.value);
      ElMessage.success(res.message);
      countdown.value = 60; // 设置倒计时为60秒
      timer.value = setInterval(() => {
        if (countdown.value > 0) {
          countdown.value--;
        } else {
          clearInterval(timer.value!);
          timer.value = null;
        }
      }, 1000);
    } catch (error) {
      console.error("获取验证码失败:", error);
      ElMessage.error("获取验证码失败，请稍后再试");
    }
  }

  const toggleView = () => {
    const formContainer = document.querySelector(".form_container");
    if (formContainer) {
      gsap.to(formContainer, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
          isLoginView.value = !isLoginView.value;
          email.value = "";
          password.value = "";
          username.value = "";
          gsap.fromTo(
            formContainer,
            { opacity: 0, x: 0 },
            { opacity: 1, x: 0, duration: 0.5 }
          );
        },
      });
    }
  };
  onUnmounted(() => {
    if (timer.value !== -1) {
      clearInterval(timer.value as number);
    }
  });
</script>

<style scoped>
  .login_form {
    display: flex;
    justify-content: flex-end;
    background-image: url("../../assets/loginbg.png");
    background-size: contain;
    height: calc(100vh - 60px);
  }

  .form_container {
    width: fit-content;
    width: 420px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    padding: 50px 40px 20px 40px;
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 0px 106px 42px rgba(0, 0, 0, 0.01), 0px 59px 36px rgba(0, 0, 0, 0.05),
      0px 26px 26px rgba(0, 0, 0, 0.09), 0px 7px 15px rgba(0, 0, 0, 0.1);
    font-family: "Inter", sans-serif;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
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

  .no-account {
    font-size: 0.8rem;
    color: #0e8cf3;
    cursor: pointer;
  }

  .input_container.code {
    display: flex;
    flex-direction: row;

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

  .forget_password {
    position: absolute;
    font-size: 0.8rem;
    color: #0e8cf3;
    cursor: pointer;
    text-align: center;
    bottom: 10px;
  }

  .forget_password:hover {
    text-decoration: underline;
  }

  .sign-in_btn:hover {
    background: #0e8cf3;
    transition: all 0.3s ease;
  }
</style>
