<template>
  <div>
    <main>
      <section class="hero">
        <h1>基于四叉树路径规划，高效又精准</h1>
        <p>走进四叉树的奇妙世界，体验前所未有的路径规划解决方案。</p>
        <div class="buttons">
          <el-button type="primary" round @click="start">立即开始</el-button>
          <a href="#" class="login-link"><el-text>了解更多</el-text></a>
        </div>
      </section>
      <section class="features" id="features">
        <h2>路径规划可视化</h2>
        <p>我们的系统提供一系列强大的功能，帮助您更好的学习四叉树与路径规划。</p>
        <div class="feature-row">
          <div class="feature-content">
            <h3>专业地图编辑器</h3>
            <p>地图编辑器，自定义您的地图</p>
            <ul class="feature-list">
              <li>障碍物添加</li>
              <li>地图保存</li>
              <li>地图导入导出</li>
            </ul>
          </div>
          <div class="feature-image1"></div>
        </div>
        <div class="feature-row">
          <div class="feature-image2"></div>
          <div class="feature-content">
            <h3>多算法支持</h3>
            <p>支持切换路径规划算法，满足不同需求</p>
            <ul class="feature-list">
              <li>多种算法</li>
              <li>性能对比</li>
              <li>自定义参数</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import router from "@/router";
import { useAuthStore } from "@/store/auth";

const start = () => {
  const authStore = useAuthStore();
  if (authStore.isAuthenticated) {
    router.push("/system");
  } else {
    router.push("/login");
  }
};
</script>

<style scoped>
.login-link {
  margin-right: 20px;
  text-decoration: none;
  color: var(--link-color);
}

.login-link:hover {
  color: var(--link-hover-color);
  text-decoration: underline;
}

.el-button.secondary {
  background-color: var(--secondary-button-color);
  color: var(--main-text-color);
}

.el-button.primary {
  background-color: var(--primary-button-color);
  color: white;
}

.el-button:hover {
  background-color: var(--button-hover-color);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.hero {
  background-image: url("https://p3-flow-imagex-sign.byteimg.com/ocean-cloud-tos/image_generation/698c6b92200ce778c6d504711ddad14a_1741676559693567649.jpeg~tplv-a9rns2rl98-image.jpeg?rk3s=25bff839&x-expires=1773212559&x-signature=qGR6OZo4EXnztqMSLEtyOP8gHf4%3D");
  background-size: cover;
  background-position: center;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 0 5%;
}

.hero h1 {
  font-size: 3em;
  margin-bottom: 20px;
}

.hero p {
  font-size: 1.2em;
  color: var(--sub-text-color);
  margin-bottom: 30px;
}

.hero .buttons {
  display: flex;
  gap: 20px;
  align-items: center;
}

.trust {
  text-align: center;
  padding: 50px 5%;
}

.trust h2 {
  font-size: 1em;
  color: var(--sub-text-color);
  margin-bottom: 30px;
}

.trust-logos {
  display: flex;
  justify-content: center;
  gap: 30px;
}

.trust-logo1 {
  width: 100px;
  height: 100px;
  background-color: #f0f0f0;
  background-image: url("https://p9-flow-imagex-sign.byteimg.com/ocean-cloud-tos/image_generation/de0657782dc01c396884b7c85532bcb9_1741676433461770969.jpeg~tplv-a9rns2rl98-image.jpeg?rk3s=25bff839&x-expires=1773212433&x-signature=J7fV4VQyU8nKx1yuBx3h6RZaZEs%3D");
  background-size: cover;
  background-position: center;
  transition: transform 0.3s ease;
}

.trust-logo2 {
  width: 100px;
  height: 100px;
  background-color: #f0f0f0;
  background-image: url("https://p3-flow-imagex-sign.byteimg.com/ocean-cloud-tos/image_generation/82f7e943302c25dcd2668412559bbfc2_1741676521967071416.jpeg~tplv-a9rns2rl98-image.jpeg?rk3s=25bff839&x-expires=1773212522&x-signature=OUM6LPQy0VbclS1JIy1bHiuVKtw%3D");
  background-size: cover;
  background-position: center;
  transition: transform 0.3s ease;
}

.trust-logo3 {
  width: 100px;
  height: 100px;
  background-color: #f0f0f0;
  background-image: url("https://p9-flow-imagex-sign.byteimg.com/ocean-cloud-tos/image_generation/54864213467edcaf9f485721042361ba_1741676537082617644.jpeg~tplv-a9rns2rl98-image.jpeg?rk3s=25bff839&x-expires=1773212537&x-signature=ha9ZXKn4bWuNPpp4OaLfA66nGAk%3D");
  background-size: cover;
  background-position: center;
  transition: transform 0.3s ease;
}

.features {
  padding: 50px 10%;
}

.features h2 {
  font-size: 2.5em;
  text-align: center;
  margin-bottom: 20px;
}

.features p {
  font-size: 1.2em;
  color: var(--sub-text-color);
  text-align: center;
  margin-bottom: 50px;
}

.feature-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 50px;
}

.feature-content {
  width: 45%;
}

.feature-content h3 {
  font-size: 1.8em;
  margin-bottom: 20px;
}

.feature-content p {
  text-align: left;
  margin-bottom: 20px;
}

.feature-list {
  list-style-type: none;
  padding: 0;
  margin-bottom: 30px;
}

.feature-list li {
  margin-bottom: 10px;
}

.feature-list li::before {
  content: "✓";
  margin-right: 10px;
  color: var(--primary-button-color);
}

.feature-image1 {
  width: 45%;
  height: 300px;
  background-color: #f0f0f0;
  background-image: url("https://p3-flow-imagex-sign.byteimg.com/ocean-cloud-tos/image_generation/cd9623c20d45bbc713cc4963d1497878_1741676569049154135.jpeg~tplv-a9rns2rl98-image.jpeg?rk3s=25bff839&x-expires=1773212569&x-signature=a68ifjODqgC8EclaUNWWyYlWZx4%3D");
  background-size: cover;
  background-position: center;
  transition: transform 0.3s ease;
}

.feature-image1:hover {
  transform: scale(1.05);
}

.feature-image2 {
  width: 45%;
  height: 300px;
  background-color: #f0f0f0;
  background-image: url("https://p9-flow-imagex-sign.byteimg.com/ocean-cloud-tos/image_generation/5247eb0d8bf1f68ec2604b4b93b91073_1741676579771426625.jpeg~tplv-a9rns2rl98-image.jpeg?rk3s=25bff839&x-expires=1773212579&x-signature=Ez9PgFO50n3nkXJKOxYWC7zZmTQ%3D");
  background-size: cover;
  background-position: center;
  transition: transform 0.3s ease;
}

.feature-image2:hover {
  transform: scale(1.05);
}

/* Responsive design */
@media (max-width: 768px) {
  .el-header {
    flex-wrap: wrap;
  }

  .el-menu {
    display: none;
  }

  .hero h1 {
    font-size: 2em;
  }

  .hero p {
    font-size: 1em;
  }

  .hero .buttons {
    flex-direction: column;
  }

  .feature-row {
    flex-direction: column;
  }

  .feature-content,
  .feature-image {
    width: 100%;
  }

  .feature-image {
    margin-bottom: 20px;
  }
}
</style>
