# UI 重构 - 页面规划分析

基于后端API和数据模型的页面设计分析

---

## 📊 后端数据实体分析

### 6大核心数据实体

根据 `backend-node/config/dataDefinitions.js` 和 `dataService.js`：

| 实体 | 说明 | 数据文件 | 关键字段数 | API端点 |
|------|------|----------|-----------|---------|
| **orders** | 订单 | orders.json (62.8KB) | 9个字段 | `/api/data/orders` |
| **inventory** | 库存 | inventory.json (54.7KB) | 10个字段 | `/api/data/inventory` |
| **suppliers** | 供应商 | suppliers.json (9.4KB) | 11个字段 | `/api/data/suppliers` |
| **logistics** | 物流 | logistics.json (55.6KB) | 9个字段 | `/api/data/logistics` |
| **costs** | 成本 | costs.json (35.4KB) | 7个字段 | `/api/data/costs` |
| **risks** | 风险 | risks.json (20.4KB) | 8个字段 | `/api/data/risks` |

---

## 🎯 后端API功能模块映射

### 1. 认证模块 (`/api/auth`)
- `POST /login` - 用户登录

**对应页面**: 
- ✅ **登录页 (Login)** - 需要新增

---

### 2. 仪表板模块 (`/api/dashboard`)
- `GET /summary` - 聚合指标（支持region/date/category筛选）
- `GET /overview` - 趋势图、预警列表、排行榜

**返回数据**:
```javascript
// summary
{
  totalOrders, totalSales, averageOrderAmount,
  totalStock, shortageCount, delayedShipments,
  openRisks, totalCost, supplierScoreAvg
}

// overview
{
  salesTrend[], inventoryAlerts[], topSuppliers[],
  delayedRoutes[], costTrend[], riskDistribution[],
  recentOrders[], recordCounts{}
}
```

**对应页面**:
- ✅ **全局总览页 (Overview/Dashboard)** - 合并为一个页面
  - 展示4个核心指标卡片
  - 销售趋势图 + 风险分布图
  - 库存预警Top6 + 延迟路线Top6
  - 优选供应商 + 成本变化趋势

---

### 3. 数据中心模块 (`/api/data`)
- `GET /schemas` - 获取实体schema定义
- `GET /all` - 获取所有原始数据
- `GET /:entity` - 获取单个实体数据（6个）
- `POST /:entity` - 创建实体记录（6个）

**支持的实体**:
1. orders - 订单录入
2. inventory - 库存录入
3. suppliers - 供应商录入
4. logistics - 物流录入
5. costs - 成本录入
6. risks - 风险录入

**对应页面**:
- ✅ **数据中心页 (DataCenter)** - 统一的数据管理界面
  - Tab切换6个实体
  - 每个实体：列表展示 + 表单录入
  - Schema驱动的动态表单

---

### 4. 业务分析模块 (`/api/operations`)
- `GET /snapshot` - 运营快照

**返回数据**:
```javascript
{
  inventory[],   // Top8低库存
  suppliers[],   // Top8高分供应商
  logistics[],   // Top8延迟路线
  costs[]        // Top8高成本
}
```

**对应页面**:
- ✅ **业务分析页 (OperationsHub)** - 综合分析入口
  - 4个子模块Tab或卡片布局
  - 快速查看各维度Top数据

---

### 5. 库存分析模块 (`/api/inventory`)
- `GET /analysis` - 完整库存分析数据

**返回**: 按库存量排序的完整库存列表

**对应页面**:
- 🔶 **库存详情页** - 可选，作为Operations的子页面或弹窗

---

### 6. 供应商分析模块 (`/api/suppliers`)
- `GET /performance` - 供应商绩效排名

**返回**: 按综合评分排序的供应商列表

**对应页面**:
- 🔶 **供应商详情页** - 可选，作为Operations的子页面

---

### 7. 物流分析模块 (`/api/logistics`)
- `GET /anomalies` - 物流异常（延迟）列表

**返回**: 按延迟时长排序的延迟路线

**对应页面**:
- 🔶 **物流详情页** - 可选，作为Operations的子页面

---

### 8. 成本分析模块 (`/api/costs`)
- `GET /analysis` - 成本趋势分析

**返回**: 按日期排序的成本数据

**对应页面**:
- 🔶 **成本详情页** - 可选，作为Operations的子页面

---

### 9. 风险中心模块 (`/api/risks`)
- `GET /` - 风险列表

**返回**: 按创建时间排序的风险记录

**对应页面**:
- ✅ **风险中心页 (RiskCenter)** - 风险管理专用页面
  - 风险列表（支持状态筛选）
  - 风险等级分布
  - 新建/关闭风险

---

### 10. AI助手模块 (`/api/assistant`)
- `POST /chat` - 智能问答

**对应页面**:
- ❌ 已整合到AI工作台

---

### 11. AI分析模块 (`/api/ai`)
- `POST /forecast` - 需求预测
- `POST /anomaly` - 异常检测
- `POST /risk-score` - 风险评分
- `GET /health` - 健康检查

**对应页面**:
- ✅ **AI工作台页 (AiStudio)** - 统一的AI分析界面
  - Tab1: 智能问答
  - Tab2: 需求预测
  - Tab3: 异常检测
  - Tab4: 风险评分

---

## 🏗️ 推荐的页面架构（7个页面）

基于后端API的功能划分，建议以下页面结构：

### **方案：模块化设计（7个页面）**

```
┌─────────────────────────────────────────┐
│  1. Login (登录页)                       │  ← 新增
│     POST /api/auth/login                │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  2. Overview (全局总览)                  │  ← 合并Dashboard
│     GET /api/dashboard/summary          │
│     GET /api/dashboard/overview         │
│                                         │
│  内容:                                   │
│  - 4个核心指标卡片                       │
│  - 销售趋势图 + 风险分布图               │
│  - 库存预警 + 延迟路线                   │
│  - 优选供应商 + 成本趋势                 │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  3. DataCenter (数据中心)                │  ← 保持
│     GET  /api/data/schemas              │
│     GET  /api/data/:entity (x6)         │
│     POST /api/data/:entity (x6)         │
│                                         │
│  6个Tab:                                │
│  ├─ Orders (订单录入)                    │
│  ├─ Inventory (库存录入)                 │
│  ├─ Suppliers (供应商录入)               │
│  ├─ Logistics (物流录入)                 │
│  ├─ Costs (成本录入)                     │
│  └─ Risks (风险录入)                     │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  4. Operations (业务分析)                │  ← 保持，整合4个分析
│     GET /api/operations/snapshot        │
│                                         │
│  4个子模块(卡片或Tab):                   │
│  ├─ Inventory Analysis (库存分析)        │
│  │   GET /api/inventory/analysis       │
│  ├─ Supplier Analysis (供应商分析)       │
│  │   GET /api/suppliers/performance    │
│  ├─ Logistics Analysis (物流分析)        │
│  │   GET /api/logistics/anomalies      │
│  └─ Cost Analysis (成本分析)             │
│      GET /api/costs/analysis           │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  5. RiskCenter (风险中心)                │  ← 保持
│     GET /api/risks                      │
│                                         │
│  内容:                                   │
│  - 风险列表（可筛选状态）                │
│  - 风险等级统计                          │
│  - 新建/处理风险                         │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  6. AiStudio (AI工作台)                  │  ← 保持，整合AiAssistant
│     POST /api/assistant/chat            │
│     POST /api/ai/forecast               │
│     POST /api/ai/anomaly                │
│     POST /api/ai/risk-score             │
│     GET  /api/ai/health                 │
│                                         │
│  4个Tab:                                │
│  ├─ 智能问答                             │
│  ├─ 需求预测                             │
│  ├─ 异常检测                             │
│  └─ 风险评分                             │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  7. Settings (系统设置) ⭐ 可选          │  ← 新增（未来扩展）
│     GET  /api/health                    │
│     配置管理、用户管理等                  │
└─────────────────────────────────────────┘
```

---

## 📋 页面清单与优先级

### **P0 - 核心页面（必须实现）**

| # | 页面名称 | 路由 | 主要API | 复杂度 | 说明 |
|---|---------|------|---------|--------|------|
| 1 | 登录页 | `/login` | POST /auth/login | ⭐ | 简单表单 |
| 2 | 全局总览 | `/overview` | GET /dashboard/* | ⭐⭐⭐ | 数据可视化较多 |
| 3 | 数据中心 | `/data-center` | GET+POST /data/* | ⭐⭐⭐⭐ | 6个实体的CRUD |
| 4 | 业务分析 | `/operations` | GET /operations/* | ⭐⭐⭐ | 4个子模块 |
| 5 | 风险中心 | `/risk-center` | GET /risks | ⭐⭐ | 列表+筛选 |
| 6 | AI工作台 | `/ai-studio` | POST /ai/* | ⭐⭐⭐⭐ | 4个AI功能 |

### **P1 - 增强页面（可选）**

| # | 页面名称 | 路由 | 说明 |
|---|---------|------|------|
| 7 | 系统设置 | `/settings` | 服务状态、配置管理 |

### **不需要独立页面的功能**

以下功能应作为**子组件**或**弹窗**嵌入主页面：
- ❌ Dashboard.vue → 合并到Overview
- ❌ InventoryAnalysis.vue → Operations的子Tab
- ❌ SupplierAnalysis.vue → Operations的子Tab
- ❌ LogisticsAnalysis.vue → Operations的子Tab
- ❌ CostAnalysis.vue → Operations的子Tab
- ❌ AiAssistant.vue → 合并到AiStudio的聊天Tab

---

## 🎨 页面详细设计规范

### **1. 登录页 (Login)**
```
路由: /login
API: POST /api/auth/login
组件: views/Login.vue

布局:
┌──────────────────────┐
│   Logo + 标题         │
│                      │
│   [用户名输入框]      │
│   [密码输入框]        │
│   [登录按钮]          │
│                      │
│   测试账号提示        │
└──────────────────────┘
```

---

### **2. 全局总览页 (Overview)**
```
路由: /overview
API: 
  - GET /api/dashboard/summary
  - GET /api/dashboard/overview
组件: views/Overview.vue

布局:
┌─────────────────────────────────────┐
│  Header: 经营全局总览                │
├─────────────────────────────────────┤
│  [指标卡片1] [指标卡片2]             │
│  [指标卡片3] [指标卡片4]             │
├─────────────────────────────────────┤
│  [销售趋势图]      [风险分布图]      │
├─────────────────────────────────────┤
│  [库存预警Top6]    [延迟路线Top6]    │
│  [优选供应商Top5]  [成本趋势]        │
└─────────────────────────────────────┘

筛选器:
  - 地区下拉框 (region)
  - 日期选择器 (date)
  - 类别下拉框 (category)
```

---

### **3. 数据中心页 (DataCenter)**
```
路由: /data-center
API:
  - GET /api/data/schemas
  - GET /api/data/:entity
  - POST /api/data/:entity
组件: views/DataCenter.vue

布局:
┌─────────────────────────────────────┐
│  Tab导航:                            │
│  [订单] [库存] [供应商]              │
│  [物流] [成本] [风险]                │
├─────────────────────────────────────┤
│  当前选中实体的表格列表               │
│  - 显示所有字段                      │
│  - 操作列: 编辑/删除                 │
├─────────────────────────────────────┤
│  [+ 新增记录] 按钮                   │
│  点击后弹出表单模态框                 │
└─────────────────────────────────────┘

特性:
  - Schema驱动的动态表单
  - 必填字段验证
  - 自动生成ID和计算字段
```

---

### **4. 业务分析页 (Operations)**
```
路由: /operations
API:
  - GET /api/operations/snapshot
  - GET /api/inventory/analysis
  - GET /api/suppliers/performance
  - GET /api/logistics/anomalies
  - GET /api/costs/analysis
组件: views/OperationsHub.vue

布局:
┌─────────────────────────────────────┐
│  Tab导航或卡片网格:                   │
│  [库存分析] [供应商分析]             │
│  [物流分析] [成本分析]               │
├─────────────────────────────────────┤
│  当前选中模块的详细分析:              │
│                                      │
│  库存分析:                           │
│  - 库存分布图                        │
│  - 低库存预警列表                    │
│  - 库存周转率统计                    │
│                                      │
│  供应商分析:                         │
│  - 供应商评分排行榜                  │
│  - 四维度雷达图                      │
│  - 风险等级分布                      │
│                                      │
│  物流分析:                           │
│  - 延迟路线地图/列表                 │
│  - 承运商对比                        │
│  - 平均延迟时长统计                  │
│                                      │
│  成本分析:                           │
│  - 成本构成饼图                      │
│  - 成本趋势折线图                    │
│  - Top高成本产品                     │
└─────────────────────────────────────┘
```

---

### **5. 风险中心页 (RiskCenter)**
```
路由: /risk-center
API:
  - GET /api/risks
组件: views/RiskCenter.vue

布局:
┌─────────────────────────────────────┐
│  Header: 风险管理中心                │
│  [+ 新建风险] 按钮                   │
├─────────────────────────────────────┤
│  筛选器:                             │
│  [状态: 全部/待处理/监控中/已关闭]   │
│  [等级: 全部/严重/高/中/低]          │
├─────────────────────────────────────┤
│  风险列表表格:                       │
│  - 风险ID                            │
│  - 类型                              │
│  - 等级(颜色标签)                    │
│  - 关联对象                          │
│  - 描述                              │
│  - 状态                              │
│  - 创建时间                          │
│  - 操作: 查看详情/关闭风险           │
├─────────────────────────────────────┤
│  侧边栏统计:                         │
│  - 各等级风险数量                    │
│  - 待处理风险Top5                    │
└─────────────────────────────────────┘
```

---

### **6. AI工作台页 (AiStudio)**
```
路由: /ai-studio
API:
  - POST /api/assistant/chat
  - POST /api/ai/forecast
  - POST /api/ai/anomaly
  - POST /api/ai/risk-score
  - GET  /api/ai/health
组件: views/AiStudio.vue

布局:
┌─────────────────────────────────────┐
│  Tab导航:                            │
│  [智能问答] [需求预测]               │
│  [异常检测] [风险评分]               │
├─────────────────────────────────────┤
│  Tab1 - 智能问答:                    │
│  ┌──────────────┬────────────────┐  │
│  │ 问题输入区    │ 分析结果展示区  │  │
│  │ [文本域]     │ - 结论         │  │
│  │ [快捷问题]   │ - 摘要         │  │
│  │ [分析按钮]   │ - 建议         │  │
│  │              │ - 证据         │  │
│  └──────────────┴────────────────┘  │
│                                      │
│  Tab2 - 需求预测:                    │
│  [产品ID输入] [执行预测按钮]         │
│  结果:                               │
│  - 7天预测值                         │
│  - 30天预测值                        │
│  - 置信度                            │
│  - 趋势判断                          │
│  - 分析说明                          │
│                                      │
│  Tab3 - 异常检测:                    │
│  [数据类型选择] [执行检测按钮]       │
│  结果:                               │
│  - 异常点列表                        │
│  - 严重程度标记                      │
│  - 期望值vs实际值                    │
│  - 统计摘要                          │
│                                      │
│  Tab4 - 风险评分:                    │
│  [供应商ID输入] [计算评分按钮]       │
│  结果:                               │
│  - 综合评分(0-100)                   │
│  - 风险等级                          │
│  - 四维度贡献明细                    │
│  - LLM生成的建议                     │
└─────────────────────────────────────┘
```

---

## 🔧 技术实现建议

### **路由配置 (router/index.ts)**
```typescript
const routes = [
  { path: '/login', component: () => import('../views/Login.vue') },
  { path: '/', redirect: '/overview' },
  { path: '/overview', component: () => import('../views/Overview.vue') },
  { path: '/data-center', component: () => import('../views/DataCenter.vue') },
  { path: '/operations', component: () => import('../views/OperationsHub.vue') },
  { path: '/risk-center', component: () => import('../views/RiskCenter.vue') },
  { path: '/ai-studio', component: () => import('../views/AiStudio.vue') },
]
```

### **目录结构**
```
ui/src/
├── views/
│   ├── Login.vue              ← 新增
│   ├── Overview.vue           ← 重构（合并Dashboard）
│   ├── DataCenter.vue         ← 重构（动态表单）
│   ├── OperationsHub.vue      ← 重构（4个子模块）
│   ├── RiskCenter.vue         ← 重构
│   └── AiStudio.vue           ← 重构（整合AiAssistant）
├── components/
│   ├── MetricCard.vue         ← 指标卡片组件
│   ├── DataTable.vue          ← 通用数据表格
│   ├── DynamicForm.vue        ← Schema驱动表单
│   ├── ChartLine.vue          ← 折线图
│   ├── ChartBar.vue           ← 柱状图
│   ├── ChartPie.vue           ← 饼图
│   └── StatusBadge.vue        ← 状态标签
├── composables/
│   ├── useAuth.ts             ← 认证逻辑
│   ├── useDashboard.ts        ← 仪表板数据
│   ├── useDataEntity.ts       ← 实体数据管理
│   └── useAiAnalysis.ts       ← AI分析
└── api/
    ├── request.ts             ← axios实例
    ├── auth.ts                ← 认证API
    ├── dashboard.ts           ← 仪表板API
    ├── data.ts                ← 数据中心API
    ├── operations.ts          ← 业务分析API
    ├── risks.ts               ← 风险API
    └── ai.ts                  ← AI分析API
```

---

## 📊 工作量评估

| 页面 | 预计工时 | 难度 | 依赖 |
|------|---------|------|------|
| Login | 2h | 简单 | 无 |
| Overview | 8h | 中等 | 图表库 |
| DataCenter | 12h | 复杂 | 动态表单、验证 |
| Operations | 10h | 中等 | 4个子模块 |
| RiskCenter | 6h | 简单 | 列表筛选 |
| AiStudio | 10h | 复杂 | AI交互、状态管理 |
| **总计** | **48h** | - | - |

约 **6个工作日** 完成核心功能开发

---

## ✅ 下一步行动

1. **创建项目脚手架**
   ```bash
   cd ui
   npm create vue@latest  # 如果还没有
   npm install axios vue-router pinia
   npm install echarts    # 或其他图表库
   ```

2. **搭建基础结构**
   - 配置路由
   - 配置axios拦截器
   - 创建布局组件（Sidebar、Header）

3. **按优先级开发页面**
   - Week 1: Login + Overview + DataCenter
   - Week 2: Operations + RiskCenter + AiStudio

4. **测试与优化**
   - 联调后端API
   - 性能优化
   - 响应式适配

---

## 🎯 总结

**最终页面数：6-7个**

核心原则：
- ✅ 一个路由对应一个业务模块
- ✅ 相关功能用Tab整合，避免页面过多
- ✅ 复用组件降低重复代码
- ✅ 基于后端API自然分组

这样的设计既符合后端API的结构，又保证了用户体验的简洁性。
