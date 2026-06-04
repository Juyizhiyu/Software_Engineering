# Node.js 后端 API 文档

**基础URL**: `http://127.0.0.1:3000/api`

## 目录
- [认证模块](#认证模块)
- [仪表板模块](#仪表板模块)
- [库存分析模块](#库存分析模块)
- [风险管理模块](#风险管理模块)
- [供应商分析模块](#供应商分析模块)
- [物流分析模块](#物流分析模块)
- [成本分析模块](#成本分析模块)
- [运营中心模块](#运营中心模块)
- [数据中心模块](#数据中心模块)
- [AI助手模块](#ai助手模块)
- [AI分析模块](#ai分析模块)

---

## 认证模块

### POST /api/auth/login
用户登录接口

**请求体:**
```json
{
  "username": "admin",
  "password": "123456"
}
```

**成功响应 (200):**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "name": "供应链总监",
    "role": "admin",
    "token": "mock-jwt-token-xyz-123456"
  }
}
```

**失败响应 (400/401):**
```json
{
  "success": false,
  "message": "账号或密码错误，请重试"
}
```

---

## 仪表板模块

### GET /api/dashboard/summary
获取仪表板摘要数据（支持多维度筛选）

**查询参数:**
- `region` (可选): 地区筛选（华南/华东/华北）
- `date` (可选): 日期筛选
- `category` (可选): 类别筛选

**示例:**
```
GET /api/dashboard/summary?region=华南
```

**响应:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 12500000,
    "activeSuppliers": 48,
    "riskAlerts": 3,
    "pendingOrders": 12
  }
}
```

### GET /api/dashboard/overview
获取仪表板概览数据

**响应:**
```json
{
  "success": true,
  "data": {
    // 概览数据对象
  }
}
```

---

## 库存分析模块

### GET /api/inventory/analysis
获取库存分析数据

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "productId": "P001",
      "productName": "产品A",
      "currentStock": 100,
      "safetyStock": 50,
      "turnoverRate": 0.85
    }
  ]
}
```

---

## 风险管理模块

### GET /api/risks
获取风险数据列表

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "riskId": "R001",
      "type": "supplier_delay",
      "severity": "high",
      "status": "open",
      "description": "供应商延迟交货风险"
    }
  ]
}
```

---

## 供应商分析模块

### GET /api/suppliers/performance
获取供应商绩效数据

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "supplierId": "S001",
      "supplierName": "供应商A",
      "onTimeRate": 0.95,
      "qualityRate": 0.98,
      "compositeScore": 92
    }
  ]
}
```

---

## 物流分析模块

### GET /api/logistics/anomalies
获取物流异常数据

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "shipmentId": "L001",
      "route": "上海->北京",
      "status": "delayed",
      "expectedDays": 3,
      "actualDays": 5
    }
  ]
}
```

---

## 成本分析模块

### GET /api/costs/analysis
获取成本分析数据

**响应:**
```json
{
  "success": true,
  "data": {
    "totalCost": 5000000,
    "purchaseCost": 3500000,
    "storageCost": 800000,
    "transportCost": 700000,
    "costByCategory": []
  }
}
```

---

## 运营中心模块

### GET /api/operations/snapshot
获取运营快照数据

**响应:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-01T00:00:00Z",
    "metrics": {
      "orderCount": 150,
      "inventoryTurnover": 4.5,
      "fulfillmentRate": 0.96
    }
  }
}
```

---

## 数据中心模块

### GET /api/data/schemas
获取数据实体schema定义

**响应:**
```json
{
  "success": true,
  "data": {
    "entities": ["orders", "inventory", "suppliers", "logistics", "costs", "risks"]
  }
}
```

### GET /api/data/all
获取所有原始数据

**响应:**
```json
{
  "success": true,
  "data": {
    "orders": [],
    "inventory": [],
    "suppliers": [],
    "logistics": [],
    "costs": [],
    "risks": []
  }
}
```

### GET /api/data/:entity
获取特定实体数据

**示例:**
```
GET /api/data/orders
GET /api/data/inventory
```

**响应:**
```json
{
  "success": true,
  "data": [
    // 实体数据数组
  ]
}
```

### POST /api/data/:entity
创建特定实体记录

**请求体:**
```json
{
  // 实体字段
}
```

**响应 (201):**
```json
{
  "success": true,
  "data": {
    // 创建的记录
  }
}
```

---

## AI助手模块

### POST /api/assistant/chat
AI聊天问答

**请求体:**
```json
{
  "question": "当前库存状况如何？"
}
```

**响应:**
```json
{
  "answer": "当前库存整体状况良好...",
  "summary": ["关键发现1", "关键发现2"],
  "suggestions": ["建议1", "建议2"],
  "evidence": [],
  "charts": [],
  "metadata": {
    "mode": "llm",
    "model": "gpt-4"
  }
}
```

---

## AI分析模块

### POST /api/ai/forecast
需求预测

**请求体:**
```json
{
  "product_id": "P001",
  "product_name": "产品A"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "product_id": "P001",
    "forecast_demand_7d": 150.5,
    "forecast_demand_30d": 650.2,
    "confidence": "medium",
    "trend": "up",
    "analysis": "基于历史数据的预测分析"
  }
}
```

### POST /api/ai/anomaly
异常检测

**请求体:**
```json
{
  "data_type": "logistics",
  "data": [] // 可选，不提供则自动加载
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "data_type": "logistics",
    "total_records": 100,
    "anomalies": [
      {
        "index": 5,
        "severity": "high",
        "description": "运输时间异常",
        "field": "delivery_days",
        "expected": 3.5,
        "actual": 7
      }
    ],
    "summary": "检测到2个异常点"
  }
}
```

### POST /api/ai/risk-score
供应商风险评分

**请求体:**
```json
{
  "supplier_id": "S001",
  "supplier_name": "供应商A",
  "metrics": {
    "on_time_rate": 0.95,
    "quality_rate": 0.98,
    "price_stability": 0.90,
    "response_score": 0.85
  }
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "supplier_id": "S001",
    "score": 92.5,
    "risk_level": "Low",
    "breakdown": {
      "on_time_rate": 0.38,
      "quality_rate": 0.294,
      "price_stability": 0.18,
      "response_score": 0.085
    },
    "recommendations": ["建议1", "建议2", "建议3"]
  }
}
```

### GET /api/ai/health
AI服务健康检查

**响应:**
```json
{
  "success": true,
  "data": {
    "online": true,
    "status": "ok",
    "service": "python-ai",
    "llm_enabled": true,
    "model": "gpt-4"
  }
}
```

---

## 通用响应格式

所有API响应遵循以下格式：

**成功响应:**
```json
{
  "success": true,
  "data": {}
}
```

**失败响应:**
```json
{
  "success": false,
  "message": "错误描述"
}
```

## 错误码

- `200`: 成功
- `400`: 请求参数错误
- `401`: 未授权
- `500`: 服务器内部错误
