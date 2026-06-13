# 前端 API 调用示例

本文档展示如何在前端（Vue3）中调用后端API。

## 目录
- [基础配置](#基础配置)
- [认证相关](#认证相关)
- [数据获取示例](#数据获取示例)
- [AI功能调用](#ai功能调用)
- [错误处理](#错误处理)

---

## 基础配置

### Axios实例配置

```javascript
// src/api/request.js
import axios from 'axios'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000/api',
  timeout: 8000,
})

// 响应拦截器 - 自动提取data
service.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error),
)

export default service
```

### Vite代理配置

```javascript
// vite.config.js
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      }
    }
  },
})
```

---

## 认证相关

### 用户登录

```javascript
// 在组件中使用
import request from '@/api/request'

async function handleLogin() {
  try {
    const result = await request.post('/auth/login', {
      username: 'admin',
      password: '123456'
    })
    
    if (result.success) {
      // 保存token和用户信息
      localStorage.setItem('token', result.data.token)
      localStorage.setItem('userName', result.data.name)
      // 跳转到首页
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('登录失败:', error.message)
    alert('账号或密码错误')
  }
}
```

---

## 数据获取示例

### 获取仪表板数据

```javascript
// Dashboard.vue
import { ref, onMounted } from 'vue'
import request from '@/api/request'

const summaryData = ref(null)
const overviewData = ref(null)

onMounted(async () => {
  try {
    // 并行请求多个接口
    const [summaryRes, overviewRes] = await Promise.all([
      request.get('/dashboard/summary'),
      request.get('/dashboard/overview')
    ])
    
    summaryData.value = summaryRes.data
    overviewData.value = overviewRes.data
  } catch (error) {
    console.error('获取仪表板数据失败:', error)
  }
})
```

### 带参数的查询

```javascript
// 按地区筛选仪表板数据
async function loadDashboardByRegion(region) {
  try {
    const result = await request.get('/dashboard/summary', {
      params: { region }
    })
    return result.data
  } catch (error) {
    console.error('获取数据失败:', error)
  }
}

// 使用
const southChinaData = await loadDashboardByRegion('华南')
```

### 获取库存分析数据

```javascript
// InventoryAnalysis.vue
async function loadInventoryData() {
  try {
    const result = await request.get('/inventory/analysis')
    inventoryList.value = result.data
    
    // 计算低库存商品
    lowStockItems.value = inventoryList.value.filter(
      item => item.currentStock < item.safetyStock
    )
  } catch (error) {
    console.error('加载库存数据失败:', error)
  }
}
```

### 获取供应商绩效

```javascript
// SupplierAnalysis.vue
async function loadSupplierPerformance() {
  try {
    const result = await request.get('/suppliers/performance')
    suppliers.value = result.data
    
    // 计算平均评分
    avgScore.value = suppliers.value.reduce((sum, s) => 
      sum + s.compositeScore, 0
    ) / suppliers.value.length
  } catch (error) {
    console.error('加载供应商数据失败:', error)
  }
}
```

### 获取风险列表

```javascript
// RiskCenter.vue
async function loadRisks() {
  try {
    const result = await request.get('/risks')
    risks.value = result.data
    
    // 统计各状态风险数量
    riskStats.value = {
      open: risks.value.filter(r => r.status === 'open').length,
      closed: risks.value.filter(r => r.status === 'closed').length
    }
  } catch (error) {
    console.error('加载风险数据失败:', error)
  }
}
```

### 获取物流异常

```javascript
// LogisticsAnalysis.vue
async function loadLogisticsAnomalies() {
  try {
    const result = await request.get('/logistics/anomalies')
    anomalies.value = result.data
    
    // 统计延迟订单
    delayedCount.value = anomalies.value.filter(
      item => item.status === 'delayed'
    ).length
  } catch (error) {
    console.error('加载物流数据失败:', error)
  }
}
```

### 获取成本分析

```javascript
// CostAnalysis.vue
async function loadCostAnalysis() {
  try {
    const result = await request.get('/costs/analysis')
    costData.value = result.data
    
    // 计算各项成本占比
    totalCost.value = costData.value.totalCost
    purchasePercent.value = (costData.value.purchaseCost / totalCost.value * 100).toFixed(2)
  } catch (error) {
    console.error('加载成本数据失败:', error)
  }
}
```

### 获取运营快照

```javascript
// OperationsHub.vue
async function loadOperationsSnapshot() {
  try {
    const result = await request.get('/operations/snapshot')
    snapshot.value = result.data
    
    // 更新实时指标
    updateMetrics(snapshot.value.metrics)
  } catch (error) {
    console.error('加载运营数据失败:', error)
  }
}
```

---

## 数据中心操作

### 获取实体列表

```javascript
// DataCenter.vue
import { ref } from 'vue'
import request from '@/api/request'

const activeEntity = ref('orders')
const entityData = ref([])
const schemas = ref({})

// 加载schema定义
async function loadSchemas() {
  try {
    const result = await request.get('/data/schemas')
    schemas.value = result.data
  } catch (error) {
    console.error('加载schema失败:', error)
  }
}

// 切换实体时加载数据
async function loadEntityData(entity) {
  try {
    const result = await request.get(`/data/${entity}`)
    entityData.value = result.data
  } catch (error) {
    console.error(`加载${entity}数据失败:`, error)
  }
}
```

### 创建新记录

```javascript
async function createRecord(payload) {
  try {
    const result = await request.post(`/data/${activeEntity.value}`, payload)
    
    if (result.success) {
      // 刷新列表
      await loadEntityData(activeEntity.value)
      // 显示成功提示
      alert('记录创建成功')
    }
  } catch (error) {
    console.error('创建记录失败:', error)
    alert('创建失败: ' + error.message)
  }
}

// 使用示例
await createRecord({
  orderId: 'ORD001',
  productId: 'P001',
  quantity: 100,
  amount: 5000
})
```

---

## AI功能调用

### AI助手聊天

```javascript
// AiAssistant.vue
import { ref } from 'vue'
import request from '@/api/request'

const question = ref('')
const response = ref(null)
const loading = ref(false)

async function sendMessage() {
  if (!question.value.trim()) return
  
  loading.value = true
  try {
    const result = await request.post('/assistant/chat', {
      question: question.value
    })
    
    response.value = result
    // 清空输入
    question.value = ''
  } catch (error) {
    console.error('AI回复失败:', error)
    alert('AI服务暂时不可用')
  } finally {
    loading.value = false
  }
}
```

### 需求预测

```javascript
// AiStudio.vue
async function runForecast() {
  try {
    const result = await request.post('/ai/forecast', {
      product_id: selectedProduct.value.id,
      product_name: selectedProduct.value.name
    })
    
    if (result.success) {
      forecastData.value = result.data
      // 展示预测结果
      displayForecastChart(forecastData.value)
    }
  } catch (error) {
    console.error('预测失败:', error)
  }
}
```

### 异常检测

```javascript
async function runAnomalyDetection() {
  try {
    const result = await request.post('/ai/anomaly', {
      data_type: anomalyDataType.value
      // 不提供data参数，后端会自动加载
    })
    
    if (result.success) {
      anomalyResults.value = result.data
      // 高亮显示异常点
      highlightAnomalies(anomalyResults.value.anomalies)
    }
  } catch (error) {
    console.error('异常检测失败:', error)
  }
}
```

### 供应商风险评分

```javascript
async function calculateRiskScore() {
  try {
    const result = await request.post('/ai/risk-score', {
      supplier_id: selectedSupplier.value.id,
      supplier_name: selectedSupplier.value.name
      // metrics可选，不提供则从后端自动获取
    })
    
    if (result.success) {
      riskScore.value = result.data
      // 显示评分和建议
      displayRiskAssessment(riskScore.value)
    }
  } catch (error) {
    console.error('风险评估失败:', error)
  }
}
```

### 检查AI服务状态

```javascript
async function checkAiHealth() {
  try {
    const result = await request.get('/ai/health')
    
    if (result.success) {
      aiStatus.value = result.data
      console.log('AI服务状态:', aiStatus.value.online ? '在线' : '离线')
    }
  } catch (error) {
    console.error('健康检查失败:', error)
    aiStatus.value = { online: false }
  }
}
```

---

## 错误处理

### 全局错误处理

```javascript
// 在request.js中添加请求拦截器
service.interceptors.request.use(
  (config) => {
    // 添加token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 增强响应拦截器
service.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 统一错误处理
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，跳转登录
          router.push('/login')
          break
        case 403:
          alert('没有权限访问')
          break
        case 404:
          alert('请求的资源不存在')
          break
        case 500:
          alert('服务器错误，请稍后重试')
          break
        default:
          alert('请求失败: ' + error.message)
      }
    } else {
      alert('网络错误，请检查网络连接')
    }
    
    return Promise.reject(error)
  }
)
```

### 组件级错误处理

```javascript
async function loadData() {
  loading.value = true
  error.value = null
  
  try {
    const result = await request.get('/dashboard/summary')
    data.value = result.data
  } catch (err) {
    error.value = err.message
    console.error('加载数据失败:', err)
  } finally {
    loading.value = false
  }
}
```

### 超时处理

```javascript
// 对于可能耗时的操作，增加超时时间
async function runComplexAnalysis() {
  try {
    const result = await request.post('/ai/anomaly', {
      data_type: 'orders',
      timeout: 30000 // 30秒超时
    })
    return result
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      alert('请求超时，请稍后重试')
    }
    throw error
  }
}
```

---

## 最佳实践

### 1. 使用Composition API封装

```javascript
// composables/useDashboard.js
import { ref, onMounted } from 'vue'
import request from '@/api/request'

export function useDashboard() {
  const summary = ref(null)
  const overview = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function loadData(params = {}) {
    loading.value = true
    error.value = null
    
    try {
      const [summaryRes, overviewRes] = await Promise.all([
        request.get('/dashboard/summary', { params }),
        request.get('/dashboard/overview')
      ])
      
      summary.value = summaryRes.data
      overview.value = overviewRes.data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    loadData()
  })

  return {
    summary,
    overview,
    loading,
    error,
    refresh: loadData
  }
}
```

**在组件中使用:**
```javascript
import { useDashboard } from '@/composables/useDashboard'

const { summary, overview, loading, refresh } = useDashboard()
```

### 2. 缓存数据

```javascript
const cache = new Map()

async function getCachedData(key, apiCall, ttl = 300000) {
  // 检查缓存
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data
  }
  
  // 获取新数据
  const data = await apiCall()
  cache.set(key, {
    data,
    timestamp: Date.now()
  })
  
  return data
}

// 使用
const dashboardData = await getCachedData(
  'dashboard-summary',
  () => request.get('/dashboard/summary')
)
```

### 3. 防抖搜索

```javascript
import { debounce } from 'lodash-es'

const searchProducts = debounce(async (keyword) => {
  try {
    const result = await request.get('/data/products', {
      params: { keyword }
    })
    searchResults.value = result.data
  } catch (error) {
    console.error('搜索失败:', error)
  }
}, 300)
```

---

## 完整示例：仪表板页面

```vue
<template>
  <div class="dashboard">
    <h1>供应链仪表板</h1>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error">
      {{ error }}
      <button @click="refresh">重试</button>
    </div>
    
    <!-- 数据展示 -->
    <div v-else class="content">
      <div class="card">
        <h3>总收入</h3>
        <p>{{ formatCurrency(summary.totalRevenue) }}</p>
      </div>
      
      <div class="card">
        <h3>活跃供应商</h3>
        <p>{{ summary.activeSuppliers }}</p>
      </div>
      
      <div class="card">
        <h3>风险预警</h3>
        <p>{{ summary.riskAlerts }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api/request'

const summary = ref(null)
const loading = ref(true)
const error = ref(null)

async function loadData() {
  loading.value = true
  error.value = null
  
  try {
    const result = await request.get('/dashboard/summary')
    summary.value = result.data
  } catch (err) {
    error.value = '加载数据失败: ' + err.message
  } finally {
    loading.value = false
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(value)
}

onMounted(() => {
  loadData()
})

// 暴露刷新方法
defineExpose({ refresh: loadData })
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.card {
  background: white;
  padding: 20px;
  margin: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.loading, .error {
  text-align: center;
  padding: 40px;
}

.error button {
  margin-left: 10px;
  padding: 5px 15px;
}
</style>
```

---

## 总结

- ✅ 使用统一的axios实例
- ✅ 配置Vite代理避免跨域
- ✅ 利用响应拦截器简化代码
- ✅ 合理使用Promise.all并行请求
- ✅ 完善的错误处理机制
- ✅ 使用Composition API封装复用逻辑
- ✅ 适当的数据缓存提升性能
