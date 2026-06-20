# AI 赋能企业供应链的可视化分析系统 Demo 开发计划

## 1. 项目概述

本项目是一套面向企业供应链管理场景的 BI 可视化分析系统 Demo。系统以供应链全流程数据为基础，结合可视化分析、预测分析、风险预警、LLM 问答和 Agent 智能决策辅助能力，帮助企业管理者实时掌握订单、库存、供应商、物流、成本和风险状态，从而提升供应链透明度与经营决策效率。

本 Demo 的核心目标是：在不接入真实企业数据库的前提下，使用 JSON 文件模拟供应链业务数据，完成一个可运行、可展示、可扩展的系统原型。后续可逐步替换为 MySQL 数据库，并接入真实大模型 API 和企业内部数据源。

---

## 2. Demo 阶段目标

### 2.1 需要完成的内容

本阶段需要完成：

1. Vue 前端可视化驾驶舱；
2. Node.js 后端 API 服务；
3. Python 数据分析与 AI 服务；
4. JSON 文件数据源；
5. 订单、库存、供应商、物流、成本、风险等核心数据展示；
6. 风险预警、需求预测、库存分析、供应商评分等基础智能分析；
7. LLM 问答接口预留；
8. Agent 智能分析流程预留；
9. 后续 MySQL 数据库接入结构预留。

### 2.2 暂不完整实现的内容

Demo 阶段暂不实现：

1. 暂不接入真实 ERP、CRM、WMS、TMS 系统；
2. 暂不真正连接 MySQL 数据库；
3. 暂不训练复杂深度学习模型；
4. 暂不实现完整用户权限系统；
5. 暂不实现真实邮件、短信、企业微信告警推送；
6. LLM 和 Agent 可以先使用 Mock 结果或本地规则模拟，后续再接入真实大模型 API。

---

## 3. 技术架构

### 3.1 技术选型

| 层级 | 技术 | 作用 |
|---|---|---|
| 前端 | Vue 3 + Vite | 构建系统页面和交互式仪表盘 |
| 图表 | ECharts | 展示趋势图、柱状图、饼图、雷达图、风险图等 |
| 后端 | Node.js + Express | 提供统一 REST API，聚合数据，调用 Python 服务 |
| AI 分析服务 | Python + FastAPI | 实现预测、异常检测、风险评分、Agent 调度 |
| LLM 接入 | OpenAI API / DeepSeek / Qwen / 本地模型 | 实现自然语言问答、经营归因分析、报告生成 |
| Agent 框架 | LangChain / CrewAI / 自研轻量 Agent | 实现多步骤分析、工具调用和智能决策辅助 |
| 数据格式 | JSON | Demo 阶段主要数据存储与传输格式 |
| 预留数据库 | MySQL | 后续用于替代 JSON 文件数据源 |
| 通信方式 | REST + JSON | 前端、Node、Python、LLM 服务之间统一使用 JSON 通信 |

---

## 4. 整体架构

### 4.1 系统总架构

```text
┌─────────────────────────────────────────────┐
│                   Vue 前端                   │
│ Dashboard / 风险中心 / 库存分析 / 智能问答    │
└──────────────────────┬──────────────────────┘
                       │ HTTP JSON
                       ▼
┌─────────────────────────────────────────────┐
│              Node.js API 网关层              │
│ 路由管理 / 数据聚合 / 权限预留 / 调用 AI 服务   │
└──────────────┬──────────────────────┬───────┘
               │                      │
               │ 读取业务数据          │ 调用分析服务
               ▼                      ▼
┌──────────────────────────┐   ┌────────────────────────────┐
│        JSON 数据文件       │   │ Python FastAPI AI 服务       │
│ orders/inventory/...     │   │ 预测 / 异常检测 / 风险评分     │
└──────────────────────────┘   │ LLM 接入 / Agent 调度         │
               │              └──────────────┬─────────────┘
               │                             │
               ▼                             ▼
┌──────────────────────────┐   ┌────────────────────────────┐
│      MySQL 数据库预留      │   │ 外部或本地 LLM 模型            │
│ 后续替换 JSON 数据源       │   │ 经营问答 / 报告生成 / 归因分析  │
└──────────────────────────┘   └────────────────────────────┘
```

### 4.2 模块分层说明

系统分为五层：

1. **前端展示层**：负责页面展示、图表渲染、用户交互和自然语言提问入口。
2. **Node.js API 层**：负责对前端提供统一接口，读取 JSON 数据，并调用 Python 分析服务。
3. **数据访问层**：当前读取 JSON 文件，后续切换为 MySQL。
4. **Python AI 分析层**：负责预测、异常检测、风险评分和 Agent 编排。
5. **LLM/Agent 智能层**：负责自然语言分析、经营归因、报告生成和多步骤决策辅助。

---

## 5. 推荐项目目录结构

```text
supply-chain-bi-demo/
├── plan.md
├── README.md
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── router/
│       │   └── index.js
│       ├── api/
│       │   └── request.js
│       ├── views/
│       │   ├── Dashboard.vue
│       │   ├── RiskCenter.vue
│       │   ├── InventoryAnalysis.vue
│       │   ├── SupplierAnalysis.vue
│       │   ├── LogisticsAnalysis.vue
│       │   ├── CostAnalysis.vue
│       │   └── AiAssistant.vue
│       ├── components/
│       │   ├── MetricCard.vue
│       │   ├── ChartCard.vue
│       │   ├── RiskTable.vue
│       │   ├── FilterBar.vue
│       │   └── ChatPanel.vue
│       └── utils/
│           └── chartOptions.js
│
├── backend-node/
│   ├── package.json
│   ├── server.js
│   ├── routes/
│   │   ├── dashboard.js
│   │   ├── inventory.js
│   │   ├── supplier.js
│   │   ├── logistics.js
│   │   ├── cost.js
│   │   ├── risk.js
│   │   └── assistant.js
│   ├── services/
│   │   ├── dataService.js
│   │   ├── analyticsService.js
│   │   ├── aiService.js
│   │   └── llmService.js
│   ├── repositories/
│   │   ├── jsonRepository.js
│   │   └── mysqlRepository.js
│   ├── config/
│   │   └── index.js
│   └── data/
│       ├── orders.json
│       ├── inventory.json
│       ├── suppliers.json
│       ├── logistics.json
│       ├── costs.json
│       └── risks.json
│
├── backend-python/
│   ├── requirements.txt
│   ├── main.py
│   ├── routers/
│   │   ├── forecast.py
│   │   ├── anomaly.py
│   │   ├── risk_score.py
│   │   ├── llm.py
│   │   └── agent.py
│   ├── services/
│   │   ├── demand_forecast.py
│   │   ├── anomaly_detection.py
│   │   ├── risk_scoring.py
│   │   ├── llm_client.py
│   │   ├── prompt_templates.py
│   │   └── agent_orchestrator.py
│   ├── tools/
│   │   ├── data_query_tool.py
│   │   ├── risk_analysis_tool.py
│   │   ├── forecast_tool.py
│   │   ├── report_tool.py
│   │   └── chart_explain_tool.py
│   └── models/
│       └── schemas.py
│
└── docs/
    ├── api-design.md
    ├── data-dictionary.md
    └── demo-script.md
```

---

## 6. 核心业务模块

## 6.1 首页驾驶舱 Dashboard

### 功能目标

展示供应链整体运行状态，让管理者快速判断当前企业供应链是否健康。

### 主要指标

1. 总订单量；
2. 总销售额；
3. 当前库存总量；
4. 缺货商品数量；
5. 高风险供应商数量；
6. 物流异常数量；
7. 总成本变化趋势；
8. 供应链综合风险等级；
9. AI 生成的经营摘要。

### 推荐图表

| 展示内容 | 图表形式 |
|---|---|
| 销售额趋势 | 折线图 |
| 订单量趋势 | 柱状图 |
| 库存状态分布 | 环形图 |
| 风险等级分布 | 堆叠柱状图 |
| 供应商评分排行 | 横向柱状图 |
| 成本构成 | 饼图 |
| 物流异常记录 | 表格 |

---

## 6.2 供应链数据整合模块

### 功能目标

模拟企业多业务系统数据整合，将订单、库存、供应商、物流、成本、风险等数据统一为标准 JSON 格式。

### 模拟数据来源

| 业务系统 | Demo 文件 | 数据内容 |
|---|---|---|
| ERP | orders.json | 订单、销售额、商品类别 |
| WMS | inventory.json | 库存数量、安全库存、仓库位置 |
| SRM | suppliers.json | 供应商评分、交付及时率、质量合格率 |
| TMS | logistics.json | 运输状态、延迟时间、物流路径 |
| 财务系统 | costs.json | 采购成本、运输成本、仓储成本 |
| 风险系统 | risks.json | 风险事件、等级、处理状态 |

### 实现原则

1. 所有数据文件均使用 JSON 数组；
2. 每条记录必须有唯一 ID；
3. 不同文件通过 `order_id`、`product_id`、`supplier_id` 等字段关联；
4. Node.js 不在路由层直接读取文件，而是通过 Repository 层读取；
5. 后续接入 MySQL 时，保持 API 返回结构不变。

---

## 6.3 库存分析模块

### 功能目标

监控库存数量、安全库存和预测需求，判断是否存在缺货或积压风险。

### 核心指标

| 指标 | 含义 |
|---|---|
| current_stock | 当前库存 |
| safety_stock | 安全库存 |
| max_stock | 最大库存 |
| forecast_demand_7d | 未来 7 日预测需求 |
| stock_status | 库存状态 |
| suggested_replenishment | 建议补货量 |

### 状态判断规则

```text
如果 current_stock < safety_stock：
    stock_status = Shortage

如果 current_stock > forecast_demand_7d * 3：
    stock_status = Overstock

如果 current_stock 接近 safety_stock：
    stock_status = Warning

否则：
    stock_status = Normal
```

---

## 6.4 供应商绩效评估模块

### 功能目标

根据供应商的交付、质量、价格稳定性和响应速度，计算综合评分并判断风险等级。

### 评分公式

```text
score = on_time_rate * 0.4
      + quality_rate * 0.3
      + price_stability * 0.2
      + response_score * 0.1
```

评分结果乘以 100 后得到百分制分数。

### 风险等级

| 分数区间 | 风险等级 |
|---|---|
| 85 - 100 | Low |
| 70 - 84 | Medium |
| 60 - 69 | High |
| 0 - 59 | Critical |

---

## 6.5 物流异常分析模块

### 功能目标

识别运输延迟、路径异常和运输成本异常。

### 延误判断规则

```text
delay_ratio = actual_duration_hours / expected_duration_hours

如果 delay_ratio <= 1.1：
    status = Normal

如果 1.1 < delay_ratio <= 1.3：
    status = Slight Delay

如果 delay_ratio > 1.3：
    status = Serious Delay
```

---

## 6.6 成本分析模块

### 功能目标

分析供应链成本构成和变化趋势，辅助企业发现成本异常来源。

### 成本类型

1. 采购成本；
2. 仓储成本；
3. 运输成本；
4. 退货成本；
5. 缺货损失；
6. 库存积压成本。

---

## 6.7 风险预警模块

### 功能目标

对供应链运行中的异常情况进行统一展示，并给出风险等级、原因和处理建议。

### 风险类型

1. 库存不足风险；
2. 库存积压风险；
3. 供应商交付延迟风险；
4. 供应商质量风险；
5. 物流延误风险；
6. 成本异常风险；
7. 订单需求突增风险。

### 风险输出字段

```json
{
  "risk_id": "R20260401001",
  "risk_type": "库存不足",
  "risk_level": "High",
  "related_object": "P001",
  "description": "核心零件A库存低于安全库存，可能影响后续生产",
  "suggestion": "建议立即补货并联系备用供应商",
  "status": "open",
  "created_at": "2026-04-01 11:00:00"
}
```

---

## 7. LLM 与 Agent 设计

## 7.1 LLM 接入目标

后续系统需要接入 LLM，使管理者可以通过自然语言方式理解供应链数据，而不是只依赖图表。

### 典型问题示例

1. “本月供应链最大的风险是什么？”
2. “为什么华南地区订单增长但利润下降？”
3. “哪些商品未来一周可能缺货？”
4. “哪些供应商需要重点关注？”
5. “请生成一份本周供应链运营简报。”
6. “如果物流成本继续上涨，应该优先调整哪些环节？”

### LLM 输出内容

LLM 应当输出：

1. 结论；
2. 关键数据依据；
3. 原因分析；
4. 风险等级；
5. 建议措施；
6. 可追溯的数据来源。

---

## 7.2 Agent 接入目标

Agent 的作用不是简单聊天，而是根据用户问题自动拆解任务、调用工具、查询数据、分析指标，并生成结构化结论。

例如用户输入：

```text
分析一下本周供应链风险，并给出处理建议。
```

Agent 应执行：

```text
1. 读取订单数据；
2. 读取库存数据；
3. 读取供应商数据；
4. 读取物流数据；
5. 调用风险评分工具；
6. 调用需求预测工具；
7. 汇总主要风险；
8. 调用 LLM 生成自然语言分析报告；
9. 返回结构化结果给前端。
```

---

## 7.3 Agent 工作流

```text
用户自然语言问题
        ↓
前端 AiAssistant 页面
        ↓
Node.js /api/assistant/chat
        ↓
Python /agent/analyze
        ↓
Agent 任务规划
        ↓
调用工具：
    - 数据查询工具
    - 需求预测工具
    - 异常检测工具
    - 风险评分工具
    - 报告生成工具
        ↓
调用 LLM 整理分析结论
        ↓
返回 JSON 结构化结果
        ↓
前端展示文本、表格和图表建议
```

---

## 7.4 推荐 Agent 类型

Demo 阶段可以设计一个主 Agent 和多个工具，不必实现复杂多 Agent 协作。

### 7.4.1 主 Agent：SupplyChainAnalysisAgent

职责：

1. 理解用户问题；
2. 判断需要哪些数据；
3. 调用对应工具；
4. 汇总分析结果；
5. 调用 LLM 生成最终回答。

### 7.4.2 工具 Tool 设计

| 工具名称 | 职责 |
|---|---|
| DataQueryTool | 查询订单、库存、供应商、物流、成本、风险数据 |
| ForecastTool | 调用需求预测算法 |
| RiskAnalysisTool | 根据规则和模型计算风险 |
| SupplierScoreTool | 计算供应商绩效 |
| CostAnalysisTool | 分析成本变化 |
| ReportTool | 生成经营简报 |
| ChartExplainTool | 解释图表含义 |

---

## 7.5 LLM Prompt 设计原则

LLM 需要严格基于系统传入的数据回答，不能凭空编造。

### 系统提示词建议

```text
你是一个企业供应链 BI 分析助手。
你只能根据输入的 JSON 数据进行分析。
如果数据不足，请明确说明“当前数据不足，无法判断”。
你的回答需要包括：
1. 核心结论；
2. 数据依据；
3. 风险原因；
4. 处理建议；
5. 后续观察指标。
不要编造不存在的数据。
```

### 用户问题与数据输入格式

```json
{
  "question": "本周供应链有哪些风险？",
  "context": {
    "orders": [],
    "inventory": [],
    "suppliers": [],
    "logistics": [],
    "costs": [],
    "risks": []
  }
}
```

---

## 7.6 LLM/Agent 返回格式

前端展示时不建议直接只接收一段纯文本，而应返回结构化 JSON。

```json
{
  "answer": "本周供应链主要风险集中在库存不足和物流延误两个方面。",
  "summary": [
    "核心零件A库存低于安全库存",
    "华东线路出现多次物流延误",
    "供应商S003准时交付率下降"
  ],
  "evidence": [
    {
      "type": "inventory",
      "object": "P001",
      "value": "current_stock=220, safety_stock=300"
    }
  ],
  "suggestions": [
    "立即补充核心零件A库存",
    "启用备用供应商",
    "调整华东区域物流承运商"
  ],
  "charts": [
    {
      "chart_type": "line",
      "title": "近7日订单需求趋势",
      "data_key": "order_trend"
    }
  ]
}
```

---

## 7.7 Demo 阶段实现方式

如果暂时没有真实 LLM API，可以先使用 Mock LLM：

1. Agent 根据规则得到分析结果；
2. `llm_client.py` 暂时返回模板化回答；
3. 前端仍然按照真实 LLM 返回格式展示；
4. 后续只需要替换 `llm_client.py` 即可接入真实大模型。

### Mock LLM 示例

```python
def generate_report(context):
    return {
        "answer": "根据当前数据，供应链主要风险集中在库存不足、物流延误和供应商交付波动。",
        "summary": [
            "部分商品库存低于安全库存",
            "部分运输线路存在延迟",
            "个别供应商准时交付率偏低"
        ],
        "suggestions": [
            "优先补充高销量商品库存",
            "关注高延迟物流线路",
            "为高风险供应商设置备用供应商"
        ]
    }
```

---

## 8. JSON 数据设计

## 8.1 orders.json

```json
[
  {
    "order_id": "O20260401001",
    "date": "2026-04-01",
    "customer_region": "华南",
    "product_id": "P001",
    "product_name": "核心零件A",
    "category": "零部件",
    "quantity": 120,
    "unit_price": 300,
    "amount": 36000,
    "status": "completed"
  }
]
```

## 8.2 inventory.json

```json
[
  {
    "product_id": "P001",
    "product_name": "核心零件A",
    "warehouse_id": "W001",
    "warehouse_name": "广州中心仓",
    "current_stock": 500,
    "safety_stock": 300,
    "max_stock": 1500,
    "unit_cost": 180,
    "last_update": "2026-04-01 10:00:00"
  }
]
```

## 8.3 suppliers.json

```json
[
  {
    "supplier_id": "S001",
    "supplier_name": "华南电子供应商",
    "region": "广东",
    "on_time_rate": 0.92,
    "quality_rate": 0.96,
    "price_stability": 0.85,
    "response_score": 0.88,
    "cooperation_years": 5
  }
]
```

## 8.4 logistics.json

```json
[
  {
    "shipment_id": "L20260401001",
    "order_id": "O20260401001",
    "origin": "广州",
    "destination": "上海",
    "carrier": "顺达物流",
    "expected_duration_hours": 36,
    "actual_duration_hours": 42,
    "status": "delayed",
    "transport_cost": 1200
  }
]
```

## 8.5 costs.json

```json
[
  {
    "date": "2026-04-01",
    "product_id": "P001",
    "purchase_cost": 21600,
    "storage_cost": 1200,
    "transport_cost": 1800,
    "return_cost": 300,
    "total_cost": 24900
  }
]
```

## 8.6 risks.json

```json
[
  {
    "risk_id": "R20260401001",
    "risk_type": "库存不足",
    "risk_level": "High",
    "related_object": "P001",
    "description": "核心零件A库存低于安全库存，可能影响后续生产",
    "suggestion": "建议立即补货并联系备用供应商",
    "status": "open",
    "created_at": "2026-04-01 11:00:00"
  }
]
```

---

## 9. API 设计

## 9.1 前端调用 Node.js API

### 获取首页总览

```http
GET /api/dashboard/summary
```

### 获取趋势数据

```http
GET /api/dashboard/trends?start=2026-04-01&end=2026-04-30
```

### 获取库存分析

```http
GET /api/inventory/analysis
```

### 获取供应商绩效

```http
GET /api/suppliers/performance
```

### 获取物流异常

```http
GET /api/logistics/anomalies
```

### 获取成本分析

```http
GET /api/costs/analysis
```

### 获取风险列表

```http
GET /api/risks
```

### 智能助手对话

```http
POST /api/assistant/chat
```

请求示例：

```json
{
  "question": "本周供应链最大的风险是什么？",
  "time_range": {
    "start": "2026-04-01",
    "end": "2026-04-07"
  }
}
```

返回示例：

```json
{
  "answer": "本周最大风险是核心零件A库存不足，可能影响后续订单交付。",
  "summary": [
    "核心零件A当前库存低于安全库存",
    "未来7日预测需求高于当前库存",
    "供应商S003准时交付率偏低"
  ],
  "suggestions": [
    "立即补货核心零件A",
    "联系备用供应商",
    "提高该商品的安全库存阈值"
  ],
  "evidence": [
    {
      "type": "inventory",
      "object": "P001",
      "value": "current_stock=220, safety_stock=300"
    }
  ]
}
```

---

## 9.2 Node.js 调用 Python API

### 需求预测

```http
POST /ai/forecast/demand
```

### 异常检测

```http
POST /ai/anomaly/detect
```

### 风险评分

```http
POST /ai/risk/score
```

### LLM 报告生成

```http
POST /llm/report
```

### Agent 智能分析

```http
POST /agent/analyze
```

请求示例：

```json
{
  "question": "分析本周供应链风险",
  "context": {
    "orders": [],
    "inventory": [],
    "suppliers": [],
    "logistics": [],
    "costs": [],
    "risks": []
  }
}
```

---

## 10. 数据访问层设计

### 10.1 设计原则

Node.js 后端不能在路由层直接读取 JSON 文件，必须通过数据访问层。

调用关系：

```text
routes -> services -> repositories -> json/mysql
```

### 10.2 jsonRepository.js

职责：

1. 读取 `data/*.json`；
2. 返回标准 JavaScript 对象；
3. 屏蔽文件路径；
4. 保证 service 层不关心数据来源。

### 10.3 mysqlRepository.js

本阶段只保留结构和 TODO。

后续职责：

1. 连接 MySQL；
2. 执行 SQL 查询；
3. 将数据库结果转换为统一 JSON；
4. 保持对 service 层接口不变。

### 10.4 推荐接口

```js
getOrders()
getInventory()
getSuppliers()
getLogistics()
getCosts()
getRisks()
```

---

## 11. 实现原理

## 11.1 基础数据分析流程

```text
JSON 文件
   ↓
Node.js Repository 读取数据
   ↓
Node.js Service 聚合统计
   ↓
必要时调用 Python 分析服务
   ↓
Node.js 封装 REST JSON
   ↓
Vue 前端展示图表
```

## 11.2 LLM/Agent 智能分析流程

```text
用户输入自然语言问题
   ↓
Vue 智能助手页面
   ↓
Node.js assistant API
   ↓
Node.js 读取相关业务 JSON 数据
   ↓
Node.js 将问题和数据上下文传给 Python Agent
   ↓
Agent 判断任务类型并调用工具
   ↓
工具完成数据查询、预测、异常检测、风险评分
   ↓
LLM 根据工具结果生成自然语言分析
   ↓
前端展示回答、证据、建议和图表推荐
```

## 11.3 为什么使用 Node.js + Python 双后端

Node.js 适合处理 Web API、前端请求、路由和数据聚合；Python 适合实现数据分析、机器学习、LLM 接入和 Agent 编排。因此本系统采用 Node.js 作为业务 API 网关，Python 作为 AI 分析服务。

## 11.4 为什么当前使用 JSON 文件

Demo 阶段使用 JSON 文件有以下优点：

1. 不需要配置数据库，降低运行门槛；
2. 方便 Agent 自动生成测试数据；
3. 方便前后端接口联调；
4. 数据结构直观，便于展示；
5. 后续可以平滑替换为 MySQL。

---

## 12. 前端页面设计

## 12.1 Dashboard.vue

页面结构：

```text
顶部：系统标题 + 时间筛选 + 地区筛选
第一行：核心指标卡片
第二行：销售趋势图 + 风险等级分布图
第三行：库存状态图 + 供应商评分排行
第四行：物流异常表 + 成本构成图
底部：AI 生成经营摘要
```

## 12.2 RiskCenter.vue

页面结构：

```text
左侧：风险等级统计
右侧：风险事件列表
下方：风险原因与处理建议
```

## 12.3 InventoryAnalysis.vue

页面结构：

```text
顶部：商品类别筛选、仓库筛选
中部：库存状态分布、库存趋势图
底部：库存明细表、补货建议表
```

## 12.4 SupplierAnalysis.vue

页面结构：

```text
顶部：供应商总体情况
中部：供应商排行、评分雷达图
底部：高风险供应商列表
```

## 12.5 AiAssistant.vue

页面结构：

```text
左侧：问题输入与对话记录
右侧：Agent 分析结果
下方：数据依据、建议措施、相关图表
```

功能要求：

1. 用户可以输入自然语言问题；
2. 前端调用 `/api/assistant/chat`；
3. 展示 LLM 生成的回答；
4. 展示 Agent 调用得到的数据依据；
5. 展示建议措施；
6. 如果返回图表建议，可以显示对应图表卡片。

---

## 13. Agent 开发任务拆解

### 阶段一：项目初始化

1. 创建项目根目录；
2. 创建 `frontend`、`backend-node`、`backend-python`；
3. 初始化 Vue 3 + Vite；
4. 初始化 Node.js + Express；
5. 初始化 Python FastAPI；
6. 创建 JSON 数据目录；
7. 创建 `README.md` 和 `plan.md`。

### 阶段二：JSON 数据准备

1. 编写 `orders.json`；
2. 编写 `inventory.json`；
3. 编写 `suppliers.json`；
4. 编写 `logistics.json`；
5. 编写 `costs.json`；
6. 编写 `risks.json`；
7. 每类数据至少 20 条；
8. 保证不同文件之间 ID 可以关联。

### 阶段三：Node.js 后端开发

1. 编写 `server.js`；
2. 配置 CORS；
3. 实现 routes；
4. 实现 `jsonRepository.js`；
5. 实现 `dataService.js`；
6. 实现 `aiService.js`；
7. 实现 `llmService.js`；
8. 实现 `/api/dashboard/summary`；
9. 实现 `/api/inventory/analysis`；
10. 实现 `/api/suppliers/performance`；
11. 实现 `/api/logistics/anomalies`；
12. 实现 `/api/costs/analysis`；
13. 实现 `/api/risks`；
14. 实现 `/api/assistant/chat`。

### 阶段四：Python AI 服务开发

1. 创建 FastAPI 入口；
2. 实现需求预测接口；
3. 实现异常检测接口；
4. 实现风险评分接口；
5. 实现 LLM 报告生成接口；
6. 实现 Agent 分析接口；
7. 编写工具函数；
8. 保证所有接口输入输出均为 JSON。

### 阶段五：LLM/Agent 开发

1. 编写 `llm_client.py`；
2. 编写 `prompt_templates.py`；
3. 编写 `agent_orchestrator.py`；
4. 实现 DataQueryTool；
5. 实现 ForecastTool；
6. 实现 RiskAnalysisTool；
7. 实现 ReportTool；
8. 先实现 Mock LLM；
9. 后续替换为真实 LLM API；
10. 确保 LLM 只根据传入 JSON 数据回答。

### 阶段六：Vue 前端开发

1. 配置 Vue Router；
2. 封装 Axios；
3. 创建通用指标卡片；
4. 创建通用图表卡片；
5. 创建风险表格组件；
6. 创建 Dashboard；
7. 创建库存分析页面；
8. 创建供应商分析页面；
9. 创建物流分析页面；
10. 创建成本分析页面；
11. 创建风险中心页面；
12. 创建 AI 智能助手页面；
13. 接入所有后端 API；
14. 完成页面样式和展示效果优化。

### 阶段七：联调与演示

1. 启动 Python 服务；
2. 启动 Node.js 服务；
3. 启动 Vue 前端；
4. 检查 Dashboard 数据展示；
5. 检查风险列表；
6. 检查预测接口；
7. 检查 Agent 问答接口；
8. 准备演示问题；
9. 准备答辩说明。

---

## 14. 运行方式

### 14.1 启动 Python 服务

```bash
cd backend-python
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 14.2 启动 Node.js 服务

```bash
cd backend-node
npm install
npm run dev
```

默认运行地址：

```text
http://localhost:3000
```

### 14.3 启动 Vue 前端

```bash
cd frontend
npm install
npm run dev
```

默认运行地址：

```text
http://localhost:5173
```

---

## 15. 环境变量设计

Node.js `.env`：

```env
PORT=3000
DATA_SOURCE=json
PYTHON_AI_BASE_URL=http://localhost:8000
```

后续接入 MySQL：

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=123456
MYSQL_DATABASE=supply_chain_bi
```

后续接入 LLM：

```env
LLM_PROVIDER=openai
LLM_API_KEY=your_api_key
LLM_MODEL=gpt-4o-mini
```

也可以替换为：

```env
LLM_PROVIDER=deepseek
LLM_API_KEY=your_api_key
LLM_MODEL=deepseek-chat
```

---

## 16. MySQL 后续扩展方案

### 16.1 数据表建议

1. `orders`：订单表；
2. `products`：商品表；
3. `inventory`：库存表；
4. `warehouses`：仓库表；
5. `suppliers`：供应商表；
6. `shipments`：物流运输表；
7. `costs`：成本表；
8. `risks`：风险事件表；
9. `users`：用户表；
10. `roles`：角色表。

### 16.2 替换方式

当前：

```text
service -> jsonRepository -> JSON 文件
```

后续：

```text
service -> mysqlRepository -> MySQL 数据库
```

只要 Repository 返回的数据结构保持一致，前端和 Service 层不需要大改。

---

## 17. Demo 演示脚本建议

演示时可以按照以下顺序：

1. 打开 Dashboard，展示供应链总体状态；
2. 说明系统整合了订单、库存、供应商、物流、成本和风险数据；
3. 展示库存分析页面，说明系统可以识别缺货和积压；
4. 展示供应商分析页面，说明系统可以计算供应商评分；
5. 展示物流分析页面，说明系统可以发现运输延迟；
6. 展示风险中心，说明系统可以统一管理风险事件；
7. 打开 AI 智能助手，输入“本周供应链最大的风险是什么？”；
8. 展示 Agent 返回的结论、证据和建议；
9. 说明后续可接入 MySQL、真实 LLM 和企业业务系统。

---

## 18. 开发优先级

### 第一优先级

1. JSON 数据；
2. Node.js API；
3. Vue Dashboard；
4. 风险预警；
5. 基础图表展示。

### 第二优先级

1. Python 需求预测；
2. Python 异常检测；
3. 供应商评分；
4. 库存补货建议。

### 第三优先级

1. LLM 智能问答；
2. Agent 工具调用；
3. 自动生成经营简报；
4. 图表解释。

### 第四优先级

1. MySQL 接入；
2. 权限管理；
3. 企业真实系统接入；
4. 部署上线。

---

## 19. 对 Agent 的开发要求

代码生成 Agent 在开发时必须遵守以下要求：

1. 优先保证 Demo 可以运行；
2. 不要一开始实现复杂数据库；
3. 所有接口优先使用 JSON；
4. 前端页面先完成核心图表，再优化样式；
5. 后端路由、服务、数据访问层必须分离；
6. Python AI 服务必须独立运行；
7. LLM 接入必须可替换；
8. Agent 分析结果必须包含数据依据；
9. 不允许让 LLM 编造不存在的数据；
10. 所有 Mock 数据都要贴合供应链业务场景。

---

## 20. 最小可行版本 MVP

MVP 至少需要包含：

1. 一个 Dashboard 页面；
2. 一个风险中心页面；
3. 一个 AI 智能助手页面；
4. 一组 JSON 数据文件；
5. Node.js 能返回 Dashboard 数据；
6. Python 能返回风险分析或预测结果；
7. Agent 能回答一个固定问题：
   “本周供应链最大的风险是什么？”

MVP 完成后，即可作为课程项目 Demo 进行展示。
