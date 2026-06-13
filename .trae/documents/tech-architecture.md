# 技术架构文档 - AI 赋能供应链可视化分析系统

## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端 (ui/)"
        "Vue 3 + TypeScript" --> "Vue Router 5"
        "Vue 3 + TypeScript" --> "Pinia 3"
        "Vue 3 + TypeScript" --> "Element Plus"
        "Vue 3 + TypeScript" --> "ECharts 6"
        "Vue 3 + TypeScript" --> "VueUse (useDark)"
        "Element Plus" --> "SCSS 主题变量"
        "SCSS 主题变量" --> "深色模式"
    end

    subgraph "Node.js 后端 (:3000)"
        "Express API" --> "业务路由"
        "业务路由" --> "JSON Repository"
        "业务路由" --> "AI 代理转发"
    end

    subgraph "Python AI 后端 (:8000)"
        "FastAPI" --> "Agent 分析"
        "FastAPI" --> "需求预测"
        "FastAPI" --> "异常检测"
        "FastAPI" --> "风险评分"
        "FastAPI" --> "LLM / 规则引擎"
    end

    "前端 (ui/)" -->|"Vite Proxy /api"| "Node.js 后端 (:3000)"
    "Node.js 后端 (:3000)" -->|"HTTP 转发"| "Python AI 后端 (:8000)"
```

## 2. 技术说明

- **前端框架**：Vue 3.5 + TypeScript 6 + Vite 8
- **UI 组件库**：Element Plus 2.14 + @element-plus/icons-vue
- **样式方案**：SCSS + CSS 变量（支持深色模式）
- **状态管理**：Pinia 3
- **路由**：Vue Router 5（History 模式）
- **图表**：ECharts 6
- **HTTP 客户端**：Axios 1.17
- **工具库**：VueUse 14.3（useDark）、dayjs、lodash-es
- **自动导入**：unplugin-auto-import + unplugin-vue-components
- **后端**：Node.js Express (:3000) + Python FastAPI (:8000)，已有后端无需修改

## 3. 路由定义

| 路由 | 组件 | 用途 |
|------|------|------|
| `/login` | `views/Login.vue` | 登录页 |
| `/` | 重定向到 `/overview` | - |
| `/overview` | `views/Overview.vue` | 全局总览 |
| `/data-center` | `views/DataCenter.vue` | 数据中心 |
| `/operations` | `views/OperationsHub.vue` | 业务分析 |
| `/risk-center` | `views/RiskCenter.vue` | 风险中心 |
| `/ai-studio` | `views/AiStudio.vue` | AI 工作台 |

## 4. API 定义

### 4.1 认证 API

```typescript
// POST /api/auth/login
interface LoginRequest {
  username: string
  password: string
}
interface LoginResponse {
  success: boolean
  message: string
  data: {
    name: string
    role: string
    token: string
  }
}
```

### 4.2 仪表盘 API

```typescript
// GET /api/dashboard/summary
interface DashboardSummary {
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

// GET /api/dashboard/overview
interface DashboardOverview {
  salesTrend: Array<{ date: string; amount: number; quantity: number }>
  inventoryAlerts: InventoryItem[]
  topSuppliers: SupplierItem[]
  delayedRoutes: LogisticsItem[]
  costTrend: Array<{ date: string; totalCost: number; purchaseCost: number }>
  riskDistribution: Array<{ level: string; count: number }>
  recentOrders: Array<{ orderId: string; date: string; amount: number }>
  recordCounts: Record<string, number>
}
```

### 4.3 库存 API

```typescript
// GET /api/inventory/analysis
interface InventoryItem {
  id: string
  productId: string
  productName: string
  warehouseId: string
  warehouseName: string
  currentStock: number
  safetyStock: number
  maxStock: number
  stockGap: number
  fillRate: number
  unitCost: number
  lastUpdate: string
  stockStatus: 'healthy' | 'shortage' | 'overstock' | 'warning'
  stockStatusLabel: string
}
```

### 4.4 供应商 API

```typescript
// GET /api/suppliers/performance
interface SupplierItem {
  id: string
  supplierId: string
  supplierName: string
  region: string
  onTimeRate: number
  qualityRate: number
  priceStability: number
  responseScore: number
  cooperationYears: number
  compositeScore: number
  riskLevel: 'low' | 'medium' | 'high'
  riskLabel: string
  totalGmv: number
  totalUnits: number
  productCount: number
}
```

### 4.5 物流 API

```typescript
// GET /api/logistics/anomalies
interface LogisticsItem {
  shipmentId: string
  orderId: string
  routeName: string
  origin: string
  destination: string
  carrier: string
  expectedHours: number
  actualHours: number
  delayHours: number
  status: string
  statusLabel: string
  transportCost: number
}
```

### 4.6 成本 API

```typescript
// GET /api/costs/analysis
interface CostItem {
  date: string
  productId: string
  productName: string
  purchaseCost: number
  storageCost: number
  transportCost: number
  returnCost: number
  totalCost: number
}
```

### 4.7 风险 API

```typescript
// GET /api/risks
interface RiskItem {
  riskId: string
  riskType: string
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low'
  riskLevelLabel: string
  relatedObject: string
  description: string
  suggestion: string
  status: 'open' | 'resolved' | 'monitoring'
  statusLabel: string
  createdAt: string
}
```

### 4.8 运营快照 API

```typescript
// GET /api/operations/snapshot
interface OperationsSnapshot {
  inventory: InventoryItem[]
  suppliers: SupplierItem[]
  logistics: LogisticsItem[]
  costs: CostItem[]
}
```

### 4.9 数据中心 API

```typescript
// GET /api/data/schemas
interface EntitySchema {
  fields: Array<{
    key: string
    label: string
    type: 'text' | 'number' | 'select' | 'date'
    required: boolean
    options?: string[]
    placeholder?: string
  }>
}

// GET /api/data/:entity
// POST /api/data/:entity
// entity: 'orders' | 'inventory' | 'suppliers' | 'logistics' | 'costs' | 'risks'
```

### 4.10 AI 助手 API

```typescript
// POST /api/assistant/chat
interface ChatRequest {
  question: string
}
interface ChatResponse {
  answer: string
  summary: string[]
  suggestions: string[]
  evidence: Array<{ type: string; object: string; value: unknown }>
  charts: unknown[]
  metadata: { mode: string; model?: string; reason?: string }
}
```

### 4.11 AI 分析 API

```typescript
// POST /api/ai/forecast
interface ForecastRequest {
  product_id: string
  product_name?: string
}
interface ForecastResponse {
  product_id: string
  product_name: string
  forecast_demand_7d: number
  forecast_demand_30d: number
  confidence: 'low' | 'medium' | 'high'
  trend: 'up' | 'down' | 'stable' | 'unknown'
  analysis: string
  metadata: { mode: string; method: string }
}

// POST /api/ai/anomaly
interface AnomalyRequest {
  data_type: string
  data?: Record<string, unknown>[]
}
interface AnomalyResponse {
  data_type: string
  total_records: number
  anomalies: Array<{
    index: number
    severity: 'high' | 'medium' | 'low'
    description: string
    field: string
    expected: number
    actual: number
  }>
  summary: string
  metadata: { mode: string; method: string }
}

// POST /api/ai/risk-score
interface RiskScoreRequest {
  supplier_id: string
  supplier_name?: string
  metrics?: {
    on_time_rate: number
    quality_rate: number
    price_stability: number
    response_score: number
  }
}
interface RiskScoreResponse {
  supplier_id: string
  supplier_name: string
  score: number
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical'
  breakdown: {
    on_time_rate: number
    quality_rate: number
    price_stability: number
    response_score: number
  }
  recommendations: string[]
  metadata: { mode: string; method: string }
}

// GET /api/ai/health
interface AiHealthResponse {
  success: boolean
  data: {
    online: boolean
    status: string
    service: string
    llm_enabled: boolean
    model: string
  }
}
```

## 5. 目录结构

```
ui/src/
├── api/                          # API 请求层
│   ├── request.ts                # Axios 实例与拦截器
│   ├── auth.ts                   # 认证 API
│   ├── dashboard.ts              # 仪表盘 API
│   ├── data.ts                   # 数据中心 API
│   ├── operations.ts             # 运营快照 API
│   ├── inventory.ts              # 库存 API
│   ├── suppliers.ts              # 供应商 API
│   ├── logistics.ts              # 物流 API
│   ├── costs.ts                  # 成本 API
│   ├── risks.ts                  # 风险 API
│   └── ai.ts                     # AI 分析 API
├── composables/                  # 组合式函数（业务逻辑）
│   ├── useAuth.ts                # 认证逻辑
│   ├── useDashboard.ts           # 仪表盘数据逻辑
│   ├── useDataCenter.ts          # 数据中心逻辑
│   ├── useOperations.ts          # 运营分析逻辑
│   ├── useRisks.ts               # 风险管理逻辑
│   ├── useAiChat.ts              # AI 问答逻辑
│   ├── useAiForecast.ts          # AI 预测逻辑
│   ├── useAiAnomaly.ts           # AI 异常检测逻辑
│   └── useAiRiskScore.ts         # AI 风险评分逻辑
├── components/                   # 可复用组件
│   ├── common/                   # 通用组件
│   │   ├── StatCard.vue          # 统计指标卡片
│   │   ├── PageHeader.vue        # 页面标题
│   │   ├── EmptyState.vue        # 空状态
│   │   └── ServiceStatus.vue     # 服务状态指示
│   ├── charts/                   # 图表组件
│   │   ├── SalesTrendChart.vue   # 销售趋势图
│   │   ├── RiskDistChart.vue     # 风险分布图
│   │   └── CostTrendChart.vue    # 成本趋势图
│   └── layout/                   # 布局组件
│       ├── AppLayout.vue         # 主布局
│       ├── AppSidebar.vue        # 侧边栏
│       └── AppHeader.vue         # 顶部栏
├── views/                        # 页面视图
│   ├── Login.vue                 # 登录页
│   ├── Overview.vue              # 全局总览
│   ├── DataCenter.vue            # 数据中心
│   ├── OperationsHub.vue         # 业务分析
│   ├── RiskCenter.vue            # 风险中心
│   └── AiStudio.vue              # AI 工作台
├── stores/                       # Pinia 状态
│   └── user.ts                   # 用户状态（Token/角色）
├── styles/                       # 全局样式
│   ├── variables.scss            # SCSS 变量（颜色/间距/字体）
│   ├── mixins.scss               # SCSS 混合宏
│   ├── element-overrides.scss    # Element Plus 样式覆盖
│   ├── global.scss               # 全局基础样式
│   └── dark.scss                 # 深色模式变量覆盖
├── types/                        # TypeScript 类型
│   └── index.ts                  # 全局类型定义
├── config/                       # 配置
│   └── dataForms.ts              # 数据中心表单字段配置
├── utils/                        # 工具函数
│   └── format.ts                 # 格式化工具（货币/数字/百分比/风险等级）
├── router/
│   └── index.ts                  # 路由配置
├── App.vue                       # 根组件
└── main.ts                       # 入口文件
```

## 6. 关键架构决策

### 6.1 深色模式实现

- 使用 VueUse 的 `useDark()` 管理深色模式状态
- Element Plus 通过 `@element-plus/theme-chalk/dark/css-vars.css` 支持深色模式
- 自定义 SCSS 变量通过 CSS 自定义属性（CSS Variables）实现主题切换
- ECharts 图表通过监听深色模式变化动态切换配色方案

### 6.2 业务逻辑分离策略

- **API 层**（`api/`）：仅负责 HTTP 请求，返回原始数据
- **Composable 层**（`composables/`）：封装业务逻辑、状态管理、数据转换
- **组件层**（`components/` + `views/`）：仅负责 UI 渲染和用户交互

### 6.3 样式可维护性设计

- **SCSS 变量集中管理**：所有颜色、间距、字体大小在 `variables.scss` 中定义
- **混合宏封装**：常用样式模式（如卡片样式、响应式断点）封装为混合宏
- **CSS 变量桥接**：SCSS 变量同时输出为 CSS 变量，支持运行时主题切换
- **组件样式隔离**：使用 `scoped` + BEM 命名，避免样式污染
- **Element Plus 覆盖**：通过 `element-overrides.scss` 统一管理组件库样式定制

### 6.4 状态管理策略

- **全局状态**（Pinia）：仅用户认证信息（Token、角色、用户名）
- **页面级状态**（Composable）：各页面数据加载、筛选、分页等状态
- **组件级状态**（ref/reactive）：组件内部 UI 状态（如 Tab 切换、表单输入）
