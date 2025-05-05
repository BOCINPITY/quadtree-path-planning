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
      ],
    },
    {
      path: '/login',
      component: () => import('@/views/Login/index.vue'),
    },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login']

  if (!publicRoutes.includes(to.path) && !isAuthenticated) {
    // Redirect to login if not authenticated
    next('/login')
  } else {
    next()
  }
})

export default router
