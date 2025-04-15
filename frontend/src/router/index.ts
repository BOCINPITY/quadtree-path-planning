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
      component: () => import('@/views/Layout/Layout.vue'),
      children: [
        {
          path: '',
          component: () => import('@/views/Home/SystemHome.vue'),
        },
        {
          path: 'editor',
          component: () => import('@/views/MapEditor/MapEditor.vue'),
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
