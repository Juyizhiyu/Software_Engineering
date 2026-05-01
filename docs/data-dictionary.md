# 数据字典

## 概述

Demo 阶段所有数据以 JSON 文件形式存储在 `backend-node/data/` 目录下。每类数据至少 20 条记录，不同文件之间通过 `order_id`、`product_id`、`supplier_id` 等字段进行关联。

---

## 1. 订单 (orders.json)

**文件**：`backend-node/data/orders.json`
**实体标识**：`orders`
**说明**：模拟 ERP 系统中的销售订单数据。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| order_id | string | 自动生成 | 订单唯一编号，格式 `O` + 时间戳 |
| date | string | 是 | 订单日期，格式 `YYYY-MM-DD` |
| customer_region | string | 是 | 客户区域（华南/华东/华北/西南） |
| product_id | string | 是 | 产品编号，关联库存表 |
| product_name | string | 是 | 产品名称 |
| category | string | 否 | 产品类别，默认 `核心零部件` |
| quantity | number | 是 | 订购数量 |
| unit_price | number | 是 | 单价 |
| amount | number | 自动计算 | 金额 = quantity × unit_price |
| status | string | 是 | 订单状态：`pending` / `completed` |

**示例**：

```json
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
```

---

## 2. 库存 (inventory.json)

**文件**：`backend-node/data/inventory.json`
**实体标识**：`inventory`
**说明**：模拟 WMS 系统中的库存数据。同一产品可能在不同仓库有多条记录。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| product_id | string | 是 | 产品编号 |
| product_name | string | 是 | 产品名称 |
| warehouse_id | string | 是 | 仓库编号（W001/W002/W003） |
| warehouse_name | string | 是 | 仓库名称（广州中心仓/上海前置仓/北京分仓） |
| current_stock | number | 是 | 当前库存数量 |
| safety_stock | number | 是 | 安全库存阈值 |
| max_stock | number | 是 | 最大库存容量 |
| unit_cost | number | 是 | 单位成本 |
| last_update | string | 自动生成 | 最后更新时间 |

**库存状态判断（Node.js 计算字段）**：

| 条件 | 状态 | 标签 |
|---|---|---|
| current_stock < safety_stock | shortage | 缺货风险 |
| current_stock > max_stock | overstock | 积压 |
| current_stock - safety_stock < 80 | warning | 预警 |
| 其他 | healthy | 健康 |

**示例**：

```json
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
```

---

## 3. 供应商 (suppliers.json)

**文件**：`backend-node/data/suppliers.json`
**实体标识**：`suppliers`
**说明**：模拟 SRM 系统中的供应商数据。每个供应商唯一，供应商编号自动生成。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| supplier_id | string | 自动生成 | 供应商编号，格式 `S` + 序号 |
| supplier_name | string | 是 | 供应商名称 |
| region | string | 是 | 所在区域（如：广东/江苏/浙江/四川） |
| on_time_rate | number | 是 | 准时交付率，支持 0-1 小数或百分数（>1 时自动转换） |
| quality_rate | number | 是 | 质量合格率 |
| price_stability | number | 是 | 价格稳定性 |
| response_score | number | 是 | 响应评分 |
| cooperation_years | number | 是 | 合作年限 |

**综合评分计算**：

```
compositeScore = on_time_rate × 0.35 + quality_rate × 0.3
               + price_stability × 0.2 + response_score × 0.15
compositeScore = compositeScore × 100  （百分制）

score < 78  → high    (高风险)
score < 87  → medium  (中风险)
score ≥ 87  → low     (低风险)
```

**示例**：

```json
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
```

---

## 4. 物流 (logistics.json)

**文件**：`backend-node/data/logistics.json`
**实体标识**：`logistics`
**说明**：模拟 TMS 系统中的物流运输数据。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| shipment_id | string | 自动生成 | 运输编号，格式 `L` + 时间戳 |
| order_id | string | 是 | 关联订单编号 |
| origin | string | 是 | 起点城市 |
| destination | string | 是 | 终点城市 |
| carrier | string | 是 | 承运商名称 |
| expected_duration_hours | number | 是 | 预计运输时长（小时） |
| actual_duration_hours | number | 是 | 实际运输时长（小时） |
| status | string | 是 | 运输状态：`on_time` / `delayed` |
| transport_cost | number | 是 | 运输成本 |

**路线名称映射**：

| 路由 | 名称 |
|---|---|
| 广州-上海 | 华南到华东 |
| 深圳-北京 | 华南到华北 |
| 上海-成都 | 华东到西南 |

**示例**：

```json
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
```

---

## 5. 成本 (costs.json)

**文件**：`backend-node/data/costs.json`
**实体标识**：`costs`
**说明**：模拟财务系统中的成本数据。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| date | string | 是 | 日期，格式 `YYYY-MM-DD` |
| product_id | string | 是 | 产品编号 |
| purchase_cost | number | 是 | 采购成本 |
| storage_cost | number | 是 | 仓储成本 |
| transport_cost | number | 是 | 运输成本 |
| return_cost | number | 是 | 退货成本 |
| total_cost | number | 自动计算 | 总成本 = purchase + storage + transport + return |

**示例**：

```json
{
  "date": "2026-04-01",
  "product_id": "P001",
  "purchase_cost": 21600,
  "storage_cost": 1200,
  "transport_cost": 1800,
  "return_cost": 300,
  "total_cost": 24900
}
```

---

## 6. 风险事件 (risks.json)

**文件**：`backend-node/data/risks.json`
**实体标识**：`risks`
**说明**：风险预警系统核心数据，记录已识别的供应链风险事件。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| risk_id | string | 自动生成 | 风险编号，格式 `R` + 时间戳 |
| risk_type | string | 是 | 风险类型 |
| risk_level | string | 是 | 风险等级：`Critical` / `High` / `Medium` / `Low` |
| related_object | string | 是 | 关联对象（如产品编号 P001 或供应商编号 S003） |
| description | string | 是 | 风险描述 |
| suggestion | string | 是 | 处理建议 |
| status | string | 是 | 状态：`open` / `resolved` |
| created_at | string | 自动生成 | 创建时间 |

**风险类型枚举**（非强制）：

- 库存不足
- 库存积压
- 供应商交付延迟
- 供应商质量
- 物流延误
- 成本异常
- 订单需求突增

**示例**：

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

## ID 关联关系

```
orders.order_id ────────────── logistics.order_id
orders.product_id ─────────── inventory.product_id
orders.product_id ─────────── costs.product_id
suppliers.supplier_id ─────── (预留关联)
risks.related_object ──────── product_id 或 supplier_id
```

## 模拟数据生成

运行 `backend-node/generate_mock_data.js` 可重新生成 6 个 JSON 数据文件，每类生成 20 条记录。数据值使用随机函数，符合供应链业务场景。
