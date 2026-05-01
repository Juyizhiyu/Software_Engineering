import axios from 'axios'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000/api',
  timeout: 8000,
})

service.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error),
)

export default service
