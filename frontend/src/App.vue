<template>
  <el-header>
    <div class="logo" @click="$router.replace('/')">
      <img src="./assets/logo.png" alt="logo" />
      <span>基于四叉树的路径规划演示系统</span>
    </div>
    <div class="info">
      <UserInfo />
      <a href="https://gitee.com/bocinpity/cles-dev" target="_blank" rel="noopener noreferrer">
        <svg t="1748532675760" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
          p-id="5016" width="36" height="36">
          <path
            d="M512 1021.72444445A509.72444445 509.72444445 0 1 1 512 2.27555555a509.72444445 509.72444445 0 0 1 0 1019.4488889z m257.99338667-566.37667556H480.54272a25.19495111 25.19495111 0 0 0-25.19495111 25.19495111v62.91456c0 13.90819555 11.28675555 25.19495111 25.12213333 25.19495111h176.21902223c13.98101333 0 25.19495111 11.28675555 25.1949511 25.12213334v12.59747555c0 41.72458667-33.78744889 75.51203555-75.51203555 75.51203555H367.23825778a25.19495111 25.19495111 0 0 1-25.12213333-25.12213333V417.62816c0-41.72458667 33.78744889-75.51203555 75.43921777-75.51203555h352.43804445c13.83537778 0 25.12213333-11.28675555 25.12213333-25.19495112v-62.91456a25.19495111 25.19495111 0 0 0-25.12213333-25.19495111h-352.43804445a188.74368 188.74368 0 0 0-188.74368 188.81649778v352.36522667c0 13.90819555 11.28675555 25.19495111 25.19495111 25.19495111h371.22503112a169.88387555 169.88387555 0 0 0 169.95669333-169.88387556V480.54272a25.19495111 25.19495111 0 0 0-25.19495111-25.19495111z"
            fill="#C71D23" p-id="5017"></path>
        </svg>
      </a>
    </div>
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
    background-color: rgb(255, 255, 255);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 5%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 100;
    padding: 10px;
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

  .info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  /* 正常状态下的图标颜色 */
  .github-icon {
    fill: #000;
  }

  /* 悬停状态下的图标颜色 */
  a:hover .github-icon {
    fill: #007bff;
    transition: all 0.3s ease;
  }
</style>
