import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

import Index from '@/views/index.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: Index,
    },
    {
      path: '/system',
      component: () => import('@/views/Layout/LayoutComponent.vue'),
      children: [
        {
          path: '',
          component: () => import('@/views/MapEditor/MapEditor.vue'),
        },
        {
          path: 'mapmanager',
          component: () => import('@/views/MapManager/MapManager.vue'),
        },
        {
          path:"user",
          component: () => import('@/views/Setting/UserSetting.vue'),
        },
        {
          path:"apc",
          component: () => import('@/views/AlgorithmPerformanceComparison/AlgorithmPerformanceComparison.vue'),
        },
        {
          path:"open_maps_community",
          component: () => import('@/views/OpenMapsCommunity/OpenMapsCommunity.vue'),
        },
      ],
    },
    {
      path: '/login',
      component: () => import('@/views/LoginAndRegister/LoginAndRegister.vue'),
    },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated

  // 公开的路由
  const publicRoutes = ['/', '/login']

  if (!publicRoutes.includes(to.path) && !isAuthenticated) {
    // 如果用户未认证且试图访问非公开路由，则重定向到登录页面
    next('/login')
  } else {
    next()
  }
})

export default router
