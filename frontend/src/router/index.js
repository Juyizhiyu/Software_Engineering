import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/overview' },
  { path: '/overview', component: () => import('../views/Overview.vue') },
  { path: '/data-center', component: () => import('../views/DataCenter.vue') },
  { path: '/operations', component: () => import('../views/OperationsHub.vue') },
  { path: '/risk-center', component: () => import('../views/RiskCenter.vue') },
  { path: '/ai-studio', component: () => import('../views/AiStudio.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
