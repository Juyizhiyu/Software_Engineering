# UI 重构 - 技术栈准备清单

基于 Element Plus + SCSS + useDark() 的完整配置指南

---

## ✅ 已安装的依赖

根据 `package.json`，以下依赖已就绪：

```json
{
  "dependencies": {
    "@vueuse/core": "^14.3.0",      // ✅ 包含 useDark, useToggle 等
    "element-plus": "^2.14.1",      // ✅ UI组件库
    "pinia": "^3.0.4",              // ✅ 状态管理
    "vue": "^3.5.32",               // ✅ Vue 3
    "vue-router": "^5.0.4"          // ✅ 路由
  },
  "devDependencies": {
    "sass": "^1.10.0"               // ✅ SCSS编译器
  }
}
```

---

## 📦 需要额外安装的依赖

### 1. **图标库** (必需)
```bash
npm install @element-plus/icons-vue
```

Element Plus 的图标需要单独安装。

### 2. **HTTP 客户端** (必需)
```bash
npm install axios
```

用于调用后端 API。

### 3. **图表库** (推荐)
```bash
npm install echarts vue-echarts
```

或使用 Element Plus 推荐的图表方案。

### 4. **工具库** (可选但推荐)
```bash
npm install dayjs lodash-es
```

- `dayjs`: 日期格式化（比 moment.js 轻量）
- `lodash-es`: 工具函数（防抖、节流等）

### 5. **类型定义** (TypeScript项目必需)
```bash
npm install -D @types/lodash-es
```

---

## 🔧 配置文件设置

### 1. **Element Plus 自动导入配置**

安装自动导入插件（强烈推荐，减少样板代码）：

```bash
npm install -D unplugin-vue-components unplugin-auto-import
```

**vite.config.ts 配置:**
```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [
        ElementPlusResolver(),
        // 自动导入 VueUse
        {
          from: '@vueuse/core',
          imports: ['useDark', 'useToggle', 'useStorage'],
          type: false
        }
      ],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      resolvers: [
        ElementPlusResolver({
          importStyle: 'sass', // 使用 SCSS主题
        })
      ],
      dts: 'src/components.d.ts',
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        // Element Plus SCSS 变量自定义
        additionalData: `@use "@/styles/element-variables.scss" as *;`,
      },
    },
  },
})
```

---

### 2. **SCSS 变量配置**

创建 `src/styles/element-variables.scss`:

```scss
// 自定义 Element Plus 主题色
@forward 'element-plus/theme-chalk/src/common/var.scss' with (
  $colors: (
    'primary': (
      'base': #409eff,
    ),
    'success': (
      'base': #67c23a,
    ),
    'warning': (
      'base': #e6a23c,
    ),
    'danger': (
      'base': #f56c6c,
    ),
    'error': (
      'base': #f56c6c,
    ),
  ),
  $border-radius: (
    'base': 4px,
    'small': 2px,
    'round': 20px,
    'circle': 100%,
  )
);

// 全局 SCSS 变量
$sidebar-width: 240px;
$header-height: 60px;
$transition-base: all 0.3s ease;
```

创建 `src/styles/global.scss`:

```scss
// 全局样式重置
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', Arial, sans-serif;
}

// 深色模式过渡
html {
  transition: background-color 0.3s ease, color 0.3s ease;
}

// 通用工具类
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.card-shadow {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
```

---

### 3. **main.ts 入口配置**

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn' // 中文语言包

import App from './App.vue'
import router from './router'

// 导入全局样式
import '@/styles/global.scss'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
  size: 'default', // default | small | large
})

app.mount('#app')
```

---

### 4. **Vite 路径别名配置**

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})
```

**tsconfig.json 添加:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

---

## 🎨 深色模式配置

### 1. **使用 useDark() 组合式函数**

创建 `src/composables/useTheme.ts`:

```typescript
import { useDark, useToggle } from '@vueuse/core'

export function useTheme() {
  const isDark = useDark({
    selector: 'html',
    attribute: 'class',
    valueDark: 'dark',
    valueLight: 'light',
    storageKey: 'theme',
  })

  const toggleDark = useToggle(isDark)

  return {
    isDark,
    toggleDark,
  }
}
```

### 2. **在组件中使用**

```vue
<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import { ElSwitch } from 'element-plus'

const { isDark, toggleDark } = useTheme()
</script>

<template>
  <ElSwitch
    v-model="isDark"
    active-text="深色"
    inactive-text="浅色"
    @change="toggleDark()"
  />
</template>
```

### 3. **Element Plus 深色模式 CSS**

在 `src/styles/dark.scss` 中添加自定义深色样式：

```scss
html.dark {
  --el-bg-color: #141414;
  --el-bg-color-overlay: #1d1e1f;
  --el-text-color-primary: #ffffff;
  --el-text-color-regular: #d0d0d0;
  --el-border-color: #434343;
  
  // 自定义深色背景
  .page-container {
    background-color: var(--el-bg-color);
  }
  
  .card-shadow {
    background-color: var(--el-bg-color-overlay);
  }
}
```

在 `main.ts` 中导入：
```typescript
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/styles/dark.scss'
```

---

## 📁 推荐的目录结构

```
ui/src/
├── main.ts                    # 入口文件
├── App.vue                    # 根组件
├── router/
│   └── index.ts               # 路由配置
├── stores/                    # Pinia stores
│   ├── user.ts                # 用户状态
│   ├── theme.ts               # 主题状态（可选）
│   └── app.ts                 # 应用全局状态
├── views/                     # 页面组件
│   ├── Login.vue
│   ├── Overview.vue
│   ├── DataCenter.vue
│   ├── OperationsHub.vue
│   ├── RiskCenter.vue
│   └── AiStudio.vue
├── components/                # 可复用组件
│   ├── common/
│   │   ├── AppHeader.vue      # 顶部导航
│   │   ├── AppSidebar.vue     # 侧边栏
│   │   ├── MetricCard.vue     # 指标卡片
│   │   ├── DataTable.vue      # 数据表格
│   │   └── StatusBadge.vue    # 状态标签
│   └── charts/
│       ├── LineChart.vue
│       ├── BarChart.vue
│       └── PieChart.vue
├── composables/               # 组合式函数
│   ├── useTheme.ts            # 主题切换
│   ├── useAuth.ts             # 认证逻辑
│   ├── useApi.ts              # API请求封装
│   └── useForm.ts             # 表单处理
├── api/                       # API模块
│   ├── request.ts             # axios实例
│   ├── auth.ts
│   ├── dashboard.ts
│   ├── data.ts
│   ├── operations.ts
│   ├── risks.ts
│   └── ai.ts
├── utils/                     # 工具函数
│   ├── format.ts              # 格式化函数
│   ├── validate.ts            # 验证规则
│   └── constants.ts           # 常量定义
├── styles/                    # 样式文件
│   ├── global.scss            # 全局样式
│   ├── element-variables.scss # Element主题变量
│   ├── dark.scss              # 深色模式自定义
│   └── mixins.scss            # SCSS混入
├── types/                     # TypeScript类型
│   ├── api.d.ts               # API响应类型
│   ├── entity.d.ts            # 实体类型
│   └── common.d.ts            # 通用类型
└── assets/                    # 静态资源
    ├── images/
    └── icons/
```

---

## 🛠️ 核心配置文件模板

### 1. **axios 请求封装** (`src/api/request.ts`)

```typescript
import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 8000,
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
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

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const message = error.response?.data?.message || '请求失败'
    
    switch (error.response?.status) {
      case 401:
        ElMessage.error('未授权，请重新登录')
        router.push('/login')
        break
      case 403:
        ElMessage.error('没有权限访问')
        break
      case 404:
        ElMessage.error('请求的资源不存在')
        break
      case 500:
        ElMessage.error('服务器错误')
        break
      default:
        ElMessage.error(message)
    }
    
    return Promise.reject(error)
  }
)

export default service
```

### 2. **用户 Store** (`src/stores/user.ts`)

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loginApi } from '@/api/auth'

export interface UserInfo {
  name: string
  role: string
  token: string
}

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null)
  const isLoggedIn = ref(false)

  async function login(username: string, password: string) {
    const res = await loginApi(username, password)
    if (res.success) {
      userInfo.value = res.data
      isLoggedIn.value = true
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('userName', res.data.name)
    }
    return res
  }

  function logout() {
    userInfo.value = null
    isLoggedIn.value = false
    localStorage.removeItem('token')
    localStorage.removeItem('userName')
  }

  return {
    userInfo,
    isLoggedIn,
    login,
    logout,
  }
})
```

### 3. **API 模块示例** (`src/api/dashboard.ts`)

```typescript
import request from './request'

export interface DashboardSummary {
  totalOrders: number
  totalSales: number
  averageOrderAmount: number
  totalStock: number
  shortageCount: number
  delayedShipments: number
  openRisks: number
  totalCost: number
  supplierScoreAvg: number
}

export function getDashboardSummary(params?: {
  region?: string
  date?: string
  category?: string
}) {
  return request.get<DashboardSummary>('/dashboard/summary', { params })
}

export function getDashboardOverview() {
  return request.get('/dashboard/overview')
}
```

---

## 📝 开发检查清单

### 第一阶段：基础配置 (Day 1)

- [ ] 安装额外依赖（icons, axios, echarts等）
- [ ] 配置 vite.config.ts（自动导入、代理、别名）
- [ ] 配置 tsconfig.json（路径别名）
- [ ] 创建 SCSS 变量文件和全局样式
- [ ] 配置 Element Plus 中文语言包
- [ ] 配置深色模式 CSS
- [ ] 设置 axios 请求封装
- [ ] 创建基础目录结构

### 第二阶段：核心功能 (Day 2-3)

- [ ] 实现路由配置（6个页面路由）
- [ ] 创建布局组件（Sidebar + Header）
- [ ] 实现登录页
- [ ] 实现用户认证 Store
- [ ] 实现主题切换功能
- [ ] 创建通用组件（MetricCard, DataTable等）

### 第三阶段：页面开发 (Day 4-6)

- [ ] 全局总览页（Overview）
- [ ] 数据中心页（DataCenter）
- [ ] 业务分析页（Operations）
- [ ] 风险中心页（RiskCenter）
- [ ] AI工作台页（AiStudio）

### 第四阶段：优化与测试 (Day 7)

- [ ] API 联调测试
- [ ] 响应式适配
- [ ] 性能优化
- [ ] 错误边界处理
- [ ] 加载状态优化

---

## 🎯 快速启动命令

```bash
# 1. 进入项目目录
cd ui

# 2. 安装额外依赖
npm install @element-plus/icons-vue axios echarts dayjs lodash-es
npm install -D unplugin-vue-components unplugin-auto-import @types/lodash-es

# 3. 创建必要的配置文件
# (按照上面的模板创建)

# 4. 启动开发服务器
npm run dev
```

---

## ⚠️ 常见坑与注意事项

### 1. **Element Plus 自动导入问题**
- 确保安装了 `unplugin-vue-components` 和 `unplugin-auto-import`
- 检查 `components.d.ts` 和 `auto-imports.d.ts` 是否正确生成
- 如果使用 TypeScript，需要在 `tsconfig.json` 中包含这些文件

### 2. **SCSS 变量不生效**
- 检查 `vite.config.ts` 中的 `additionalData` 配置
- 确保路径正确（使用 `@/` 别名）
- 重启开发服务器

### 3. **深色模式闪烁**
- 在 `index.html` 的 `<head>` 中添加内联脚本防止闪烁：
```html
<script>
  const theme = localStorage.getItem('theme')
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  }
</script>
```

### 4. **TypeScript 类型错误**
- 确保所有 API 响应都有类型定义
- 使用 `interface` 或 `type` 定义数据结构
- 利用 Element Plus 提供的类型（如 `ElFormRules`）

### 5. **路由守卫**
- 记得添加登录验证的路由守卫
- 白名单路由（如 `/login`）不需要验证

---

## 📚 参考资源

- [Element Plus 官方文档](https://element-plus.org/zh-CN/)
- [VueUse 文档 - useDark](https://vueuse.org/core/useDark/)
- [Vite 配置指南](https://cn.vitejs.dev/config/)
- [Pinia 状态管理](https://pinia.vuejs.org/zh/)
- [Vue Router 5 文档](https://router.vuejs.org/zh/)

---

## ✅ 总结

你需要准备的：

1. **额外依赖**: icons, axios, echarts, dayjs, 自动导入插件
2. **配置文件**: vite.config.ts, tsconfig.json, SCSS变量
3. **核心代码**: axios封装, Store, 路由守卫, 主题切换
4. **目录结构**: 按模块化组织代码
5. **开发计划**: 分4个阶段，预计7天完成

准备好了吗？开始重构吧！🚀
