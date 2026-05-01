# API 接口文档

## 概述

- **Base URL**：`http://localhost:3000/api`
- **Content-Type**：`application/json`
- **响应格式**：所有接口统一返回

```json
{
  "success": true,
  "data": { ... }
}
```

错误时返回：

```json
{
  "success": false,
  "message": "错误描述"
}
```

---

## 1. 健康检查

### GET /api/health

检查 Node.js 服务状态。

**响应示例**：

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "node-backend",
    "port": 3000
  }
}
```

---

## 2. Dashboard

### GET /api/dashboard/summary

获取 Dashboard 核心摘要指标。

**响应字段**：

| 字段 | 类型 | 说明 |
|---|---|---|
| totalOrders | number | 订单总数 |
| totalSales | number | 销售总额 |
| averageOrderAmount | number | 平均订单金额 |
| totalStock | number | 库存总量 |
| shortageCount | number | 缺货商品数 |
| delayedShipments | number | 延迟运输数 |
| openRisks | number | 未关闭风险数 |
| totalCost | number | 总成本 |
| supplierScoreAvg | number | 供应商均分（百分制） |

### GET /api/dashboard/overview

获取 Dashboard 完整面板数据。

**响应字段**：

| 字段 | 类型 | 说明 |
|---|---|---|
| salesTrend | array | 最近 8 条销售记录 |
| inventoryAlerts | array | 非健康库存（最多 6 条，按缺货优先排序） |
| topSuppliers | array | 供应商评分 Top 5 |
| delayedRoutes | array | 延迟物流记录（最多 6 条，按延迟时长降序） |
| costTrend | array | 最近 8 条成本记录 |
| riskDistribution | array | 按等级统计的开放风险数量 |
| recentOrders | array | 最近 6 条订单（逆序） |
| recordCounts | object | 各实体记录总数 |

---

## 3. 库存分析

### GET /api/inventory/analysis

获取库存分析数据，按当前库存升序排列。

**响应数据**：库存项数组，每项包含：

| 字段 | 类型 | 说明 |
|---|---|---|
| productId | string | 产品编号 |
| productName | string | 产品名称 |
| warehouseId | string | 仓库编号 |
| warehouseName | string | 仓库名称 |
| currentStock | number | 当前库存 |
| safetyStock | number | 安全库存 |
| maxStock | number | 最大库存 |
| stockGap | number | 库存差（当前 - 安全） |
| fillRate | number | 满足率百分比 |
| unitCost | number | 单位成本 |
| stockStatus | string | 库存状态：`healthy` / `warning` / `shortage` / `overstock` |
| stockStatusLabel | string | 状态中文标签 |

---

## 4. 供应商绩效

### GET /api/suppliers/performance

获取供应商绩效数据，按综合评分降序排列。

**响应数据**：供应商数组，每项包含：

| 字段 | 类型 | 说明 |
|---|---|---|
| supplierId | string | 供应商编号 |
| supplierName | string | 供应商名称 |
| region | string | 所在区域 |
| onTimeRate | number | 准时交付率（百分制） |
| qualityRate | number | 质量合格率（百分制） |
| priceStability | number | 价格稳定性（百分制） |
| responseScore | number | 响应评分（百分制） |
| cooperationYears | number | 合作年限 |
| compositeScore | number | 综合评分（百分制） |
| riskLevel | string | 风险等级：`low` / `medium` / `high` |
| riskLabel | string | 等级中文标签 |

**评分公式**：

```
compositeScore = on_time_rate × 0.35 + quality_rate × 0.3
               + price_stability × 0.2 + response_score × 0.15
```

---

## 5. 物流异常

### GET /api/logistics/anomalies

获取物流异常数据（仅返回延迟记录），按延迟时长降序排列。

**响应数据**：延迟运输记录数组，每项包含：

| 字段 | 类型 | 说明 |
|---|---|---|
| shipmentId | string | 运输编号 |
| orderId | string | 关联订单编号 |
| routeName | string | 路线名称 |
| origin | string | 起点 |
| destination | string | 终点 |
| carrier | string | 承运商 |
| expectedHours | number | 预计时长（小时） |
| actualHours | number | 实际时长（小时） |
| delayHours | number | 延迟时长（小时） |
| status | string | `delayed` / `on_time` |
| statusLabel | string | 状态中文标签 |
| transportCost | number | 运输成本 |

---

## 6. 成本分析

### GET /api/costs/analysis

获取成本分析数据，按日期升序排列。

**响应数据**：成本记录数组，每项包含：

| 字段 | 类型 | 说明 |
|---|---|---|
| date | string | 日期 YYYY-MM-DD |
| productId | string | 产品编号 |
| productName | string | 产品名称 |
| purchaseCost | number | 采购成本 |
| storageCost | number | 仓储成本 |
| transportCost | number | 运输成本 |
| returnCost | number | 退货成本 |
| totalCost | number | 总成本 |

---

## 7. 风险中心

### GET /api/risks

获取所有风险事件，按创建时间降序排列。

**响应数据**：风险事件数组，每项包含：

| 字段 | 类型 | 说明 |
|---|---|---|
| riskId | string | 风险编号 |
| riskType | string | 风险类型（如：库存不足、物流延误、供应商质量等） |
| riskLevel | string | 风险等级：`Critical` / `High` / `Medium` / `Low` |
| riskLevelLabel | string | 等级中文标签 |
| relatedObject | string | 关联对象（如：P001） |
| description | string | 风险描述 |
| suggestion | string | 处理建议 |
| status | string | 状态：`open` / `resolved` |
| statusLabel | string | 状态中文标签 |
| createdAt | string | 创建时间 |

---

## 8. 数据中心

### GET /api/data/schemas

获取所有实体的 Schema 定义（字段、必填项、默认值）。

### GET /api/data/all

获取全部 6 类实体的原始数据。

### GET /api/data/:entity

获取指定实体的数据。

**路径参数**：`entity` — 取值 `orders` / `inventory` / `suppliers` / `logistics` / `costs` / `risks`

### POST /api/data/:entity

新增一条实体记录。

**请求体**：根据实体类型提供必填字段，详见 [数据字典](data-dictionary.md)。

**请求示例**（新增订单）：

```json
{
  "date": "2026-05-01",
  "customer_region": "华东",
  "product_id": "P006",
  "product_name": "核心零件 F",
  "quantity": 100,
  "unit_price": 350,
  "status": "pending"
}
```

---

## 9. 业务综合快照

### GET /api/operations/snapshot

获取四个业务模块的综合快照，用于快速浏览。

**响应数据**：

```json
{
  "success": true,
  "data": {
    "inventory": [...],     // 前 8 条库存（按库存升序）
    "suppliers": [...],     // 前 8 条供应商（按评分降序）
    "logistics": [...],     // 前 8 条物流（按延迟降序）
    "costs": [...]          // 前 8 条成本（按金额降序）
  }
}
```

---

## 10. AI 智能助手

### POST /api/assistant/chat

提交自然语言问题，获取 AI 分析结果。

**请求体**：

```json
{
  "question": "本周供应链最大的风险是什么？"
}
```

**响应体**：

```json
{
  "answer": "本周主要风险集中在库存不足和物流延误...",
  "summary": [
    "核心零件A当前库存低于安全库存",
    "华东线路出现多次物流延误"
  ],
  "suggestions": [
    "立即补充核心零件A库存",
    "启用备用供应商"
  ],
  "evidence": [
    {
      "type": "inventory",
      "object": "P001",
      "value": "current_stock=220, safety_stock=300"
    }
  ],
  "charts": [],
  "metadata": {
    "mode": "openai",
    "model": "gpt-4.1-mini",
    "response_id": "resp_xxx"
  }
}
```

**metadata.mode 取值**：

| 值 | 说明 |
|---|---|
| `openai` | 成功调用 OpenAI LLM |
| `fallback` | Python 侧 Fallback（LLM 不可用） |
| `node-fallback` | Node 侧 Fallback（Python 服务不可用） |

**工作原理**：

1. Node.js 读取全量业务数据（`loadAll`）
2. 将问题 + 数据上下文 POST 到 Python `/agent/analyze`
3. Python Agent Orchestrator 调用 `llm_client.generate_report`
4. 若有 API Key 且网络正常 → 调用 OpenAI Responses API
5. 若无 API Key 或网络异常 → 执行本地规则分析（统计低库存/延迟/风险数）
6. 若 Python 服务不可用 → Node.js 侧执行 Fallback 规则分析

---

## 11. Python AI 服务 API

Python 服务运行在 `http://localhost:8000`。

### GET /health

Python 服务健康检查。

```json
{
  "status": "ok",
  "service": "python-ai",
  "llm_enabled": true,
  "model": "gpt-4.1-mini"
}
```

### POST /agent/analyze

Agent 综合分析。

**请求体**：

```json
{
  "question": "分析本周供应链风险",
  "context": {
    "summary": { ... },
    "overview": { ... },
    "datasets": { ... }
  }
}
```

### POST /ai/forecast/demand

需求预测（目前返回固定 Mock 值）。

**请求体**：

```json
{
  "product_id": "P001",
  "history_data": []
}
```

**响应**：

```json
{
  "product_id": "P001",
  "forecast_demand_7d": 150
}
```

### POST /ai/anomaly/detect

异常检测（目前返回固定 Mock 值）。

**请求体**：

```json
{
  "data_type": "orders",
  "data": []
}
```

**响应**：

```json
{
  "message": "No anomaly detected",
  "anomalies": []
}
```

### POST /ai/risk/score

供应商风险评分。

**请求体**：

```json
{
  "supplier_id": "S001",
  "metrics": {
    "on_time_rate": 0.92,
    "quality_rate": 0.96,
    "price_stability": 0.85,
    "response_score": 0.88
  }
}
```

**评分逻辑**：

```
score = on_time_rate × 0.4 + quality_rate × 0.3
      + price_stability × 0.2 + response_score × 0.1
score = score × 100

score ≥ 85 → Low Risk
70 ≤ score < 85 → Medium Risk
60 ≤ score < 70 → High Risk
score < 60 → Critical Risk
```
