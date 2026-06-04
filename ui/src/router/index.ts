import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      component: () => import('@/components/layout/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/overview',
        },
        {
          path: 'overview',
          name: 'Overview',
          component: () => import('@/views/Overview.vue'),
        },
        {
          path: 'data-center',
          name: 'DataCenter',
          component: () => import('@/views/DataCenter.vue'),
        },
        {
          path: 'operations',
          name: 'OperationsHub',
          component: () => import('@/views/OperationsHub.vue'),
        },
        {
          path: 'risk-center',
          name: 'RiskCenter',
          component: () => import('@/views/RiskCenter.vue'),
        },
        {
          path: 'ai-studio',
          name: 'AiStudio',
          component: () => import('@/views/AiStudio.vue'),
        },
      ],
    },
  ],
})

// 路由守卫
router.beforeEach((to) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth !== false && !userStore.isLoggedIn) {
    return '/login'
  }
  if (to.path === '/login' && userStore.isLoggedIn) {
    return '/overview'
  }
})

export default router
