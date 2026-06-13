import axios from 'axios'
import type { ApiResponse } from '@/types'
import { useUserStore } from '@/stores/user'
import router from '@/router'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// 请求拦截器 - 添加 Token
request.interceptors.request.use((config) => {
  const userStore = useUserStore()
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`
  }
  return config
})

// 响应拦截器 - 解包数据
request.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse
    if (data.success === false) {
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      router.push('/login')
    }
    return Promise.reject(error)
  },
)

export default request
