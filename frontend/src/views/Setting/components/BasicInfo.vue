<template>
  <div class="basic-info">
    <el-form :model="form" label-width="100px">
      <el-form-item label="昵称" required>
        <el-input v-model="form.name" placeholder="请输入昵称"></el-input>
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="form.email" placeholder="请输入邮箱" disabled></el-input>
      </el-form-item>
      <el-form-item label="头像">
        <el-upload
          class="avatar-uploader"
          action="https://clesbit.top/api/fileUpLoad"
          :show-file-list="false"
          :on-success="handleAvatarSuccess"
          :before-upload="beforeAvatarUpload"
        >
          <img v-if="form.avatar" :src="form.avatar" class="avatar" />
          <i v-else class="el-icon-plus avatar-uploader-icon"></i>
        </el-upload>
      </el-form-item>
      <el-form-item label="性别">
        <el-radio-group v-model="form.gender">
          <el-radio value="male">男</el-radio>
          <el-radio value="female">女</el-radio>
          <el-radio value="other">保密</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="生日">
        <el-date-picker
          v-model="form.birthday"
          type="date"
          placeholder="请选择生日"
          :disabled-date="disabledDate"
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="简介">
        <el-input
          type="textarea"
          v-model="form.bio"
          placeholder="请输入简介"
          maxlength="100"
          show-word-limit
          :rows="3"
        ></el-input>
      </el-form-item>
      <el-form-item label="地址">
        <el-input v-model="form.address" placeholder="请输入地址"></el-input>
      </el-form-item>
      <el-form-item label="领域">
        <el-input v-model="form.field" placeholder="你所在的行业"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm">更新信息</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { useAuthStore } from "@/store/auth";
import { storeToRefs } from "pinia";
import { updateUser } from "@/http/user";
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const form = ref({
  name: user.value?.name || "",
  email: user.value?.email || "",
  avatar: user.value?.avatar || "",
  bio: user.value?.bio || "",
  address: user.value?.address || "",
  field: user.value?.field || "",
  gender: user.value?.gender || "other",
  birthday: user.value?.birthday,
});

const handleAvatarSuccess = (response: {
  code: number;
  message: string;
  data: { url: string };
}) => {
  form.value.avatar = response.data.url;
  ElMessage.success("头像上传成功");
};

const beforeAvatarUpload = (file: File) => {
  const isJPG = file.type === "image/jpeg" || file.type === "image/png";
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isJPG) {
    ElMessage.error("上传头像图片只能是 JPG 或 PNG 格式!");
  }
  if (!isLt2M) {
    ElMessage.error("上传头像图片大小不能超过 2MB!");
  }
  return isJPG && isLt2M;
};

// 限制日期不能超过今天
const disabledDate = (date: Date) => {
  return date.getTime() > Date.now();
};

const submitForm = async () => {
  if (user.value?.id === undefined) {
    ElMessage.error("用户信息未加载完成，请稍后再试");
    return;
  }
  const res = await updateUser(user.value?.id, form.value);
  //同步更新pinia store
  authStore.updateUserInfo(res);
  ElMessage.success("用户信息更新成功");
};

const resetForm = () => {
  form.value = {
    name: user.value?.name || "",
    email: user.value?.email || "",
    avatar: user.value?.avatar || "",
    bio: user.value?.bio || "",
    address: user.value?.address || "",
    field: user.value?.field || "",
    gender: user.value?.gender || "other",
    birthday: user.value?.birthday,
  };
};
</script>

<style scoped>
.basic-info {
  max-width: 500px;
}
.avatar-uploader {
  display: inline-block;
  width: 100px;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  cursor: pointer;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  line-height: 100px;
  text-align: center;
}
/* 修改头像样式以确保填充满位置 */
.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover; /* 确保图片填充满容器 */
  display: block;
}
</style>
