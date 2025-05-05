<template>
  <div class="security-setting">
    <div class="password-change">
      <h4>修改密码</h4>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="旧密码：" prop="currentPassword">
          <el-input
            v-model="form.currentPassword"
            type="password"
            placeholder="请输入当前密码"
            clearable
            show-password
          ></el-input>
        </el-form-item>

        <el-form-item label="新密码：" prop="newPassword">
          <el-input
            v-model="form.newPassword"
            type="password"
            placeholder="请输入新密码"
            clearable
            show-password
          ></el-input>
        </el-form-item>

        <el-form-item label="确认新密码：" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            clearable
            show-password
          ></el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click.prevent="handleChangePassword"
            >修改密码</el-button
          >
          <el-button type="default" @click.prevent="resetPasswordFields">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="account-deletion">
      <h4>账号注销</h4>
      <el-button type="danger" @click.prevent="handleAccountDeletion">注销账号</el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import { deleteUser, updateUserPassword } from "@/http/user";
import { useAuthStore } from "@/store/auth";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
const authStore = useAuthStore();
const router = useRouter();
const { user } = storeToRefs(authStore);
const form = ref({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const rules = {
  currentPassword: [{ required: true, message: "请输入当前密码", trigger: "blur" }],
  newPassword: [{ required: true, message: "请输入新密码", trigger: "blur" }],
  confirmPassword: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    {
      validator: (rule: unknown, value: string, callback: (error?: Error) => void) => {
        if (value !== form.value.newPassword) {
          callback(new Error("新密码和确认密码不一致！"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
};

const formRef = ref();

const handleChangePassword = async () => {
  await formRef.value.validate(async (valid: boolean) => {
    if (valid && user.value) {
      // 调用后端接口修改密码
      const pramas = {
        password: form.value.newPassword,
        oldPassword: form.value.currentPassword,
        id: user.value.id,
      };
      const { message } = await updateUserPassword(pramas);
      ElMessage.success(message);
      resetPasswordFields();
      authStore.logoutUser();
      // 跳转到登录页面
      router.push({ path: "/login" });
    } else {
      console.error("表单验证失败");
    }
  });
};

const handleAccountDeletion = () => {
  ElMessageBox.confirm(
    `确定要注销${user.value?.name}的账号吗？此操作不可撤销！`,
    "警告",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    }
  )
    .then(async () => {
      // 调用后端接口注销账号
      if (!user.value) {
        ElMessage.error("用户信息不存在");
        return;
      }
      await deleteUser(user.value?.id);
      authStore.logoutUser();
      router.push({ path: "/login" });
      ElMessage.success("账号已注销！");
    })
    .catch(() => {
      ElMessage.info("操作已取消");
    });
};

const resetPasswordFields = () => {
  form.value.currentPassword = "";
  form.value.newPassword = "";
  form.value.confirmPassword = "";
  formRef.value.clearValidate();
};
</script>

<style scoped>
.security-setting {
  max-width: 500px;
  padding: 20px;
  border-radius: 8px;
}

.password-change,
.account-deletion {
  margin-bottom: 20px;
}

.password-change h4,
.account-deletion h4 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #333;
}

.el-form-item {
  margin-bottom: 15px;
}

.el-button {
  margin-right: 10px;
}
</style>
