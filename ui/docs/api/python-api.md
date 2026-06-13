# Python 后端 API 文档

**基础URL**: `http://127.0.0.1:8000`

Python后端提供AI分析服务，包括需求预测、异常检测、风险评分等功能。

## 目录
- [Agent智能分析](#agent智能分析)
- [需求预测](#需求预测)
- [异常检测](#异常检测)
- [风险评分](#风险评分)
- [健康检查](#健康检查)

---

## Agent智能分析

### POST /agent/analyze
智能数据分析 - 基于自然语言问题的综合分析

**请求体:**
```json
{
  "question": "当前供应链的主要风险是什么？",
  "context": {
    "summary": {},
    "overview": {},
    "datasets": {
      "inventory": [],
      "logistics": [],
      "risks": [],
      "suppliers": []
    }
  }
}
```

**响应:**
```json
{
  "answer": "根据当前数据分析，主要风险包括...",
  "summary": [
    "风险点1：库存周转率下降",
    "风险点2：供应商延迟率上升"
  ],
  "suggestions": [
    "建议1：优化库存管理策略",
    "建议2：建立备选供应商体系"
  ],
  "evidence": [
    {
      "type": "inventory",
      "object": "low_stock_count",
      "value": 5
    }
  ],
  "charts": [],
  "metadata": {
    "mode": "llm",
    "model": "gpt-4",
    "confidence": "high"
  }
}
```

**说明:**
- `context` 包含完整的业务数据上下文
- AI会分析问题并结合数据生成回答
- 返回结构化结果便于前端展示

---

## 需求预测

### POST /ai/forecast/demand
基于历史数据的产品需求预测

**请求体:**
```json
{
  "product_id": "P001",
  "product_name": "产品A",
  "history_data": [
    {
      "date": "2024-01-01",
      "amount": 1000,
      "quantity": 50
    },
    {
      "date": "2024-01-02",
      "amount": 1200,
      "quantity": 60
    }
  ]
}
```

**响应:**
```json
{
  "product_id": "P001",
  "product_name": "产品A",
  "forecast_demand_7d": 420.5,
  "forecast_demand_30d": 1805.3,
  "confidence": "medium",
  "trend": "up",
  "analysis": "基于30条历史数据的滑动平均预测，趋势上升",
  "metadata": {
    "mode": "llm_enhanced",
    "model": "gpt-4",
    "method": "moving_average"
  }
}
```

**字段说明:**
- `forecast_demand_7d`: 未来7天预测需求量
- `forecast_demand_30d`: 未来30天预测需求量
- `confidence`: 置信度 (low/medium/high)
- `trend`: 趋势 (up/down/stable)
- `analysis`: 中文分析说明

**预测模式:**
1. **规则引擎模式** (`mode: "rule"`): 基于滑动平均算法
2. **LLM增强模式** (`mode: "llm_enhanced"`): 结合大语言模型分析

---

## 异常检测

### POST /ai/anomaly/detect
数据异常检测 - 识别离群值和异常模式

**请求体:**
```json
{
  "data_type": "logistics",
  "data": [
    {
      "shipment_id": "L001",
      "delivery_days": 3,
      "cost": 500
    },
    {
      "shipment_id": "L002",
      "delivery_days": 15,
      "cost": 2000
    }
  ]
}
```

**响应:**
```json
{
  "data_type": "logistics",
  "total_records": 100,
  "anomalies": [
    {
      "index": 1,
      "severity": "high",
      "description": "字段 delivery_days 的值 15 偏离均值 4.2 (3.8 个标准差)",
      "field": "delivery_days",
      "expected": 4.2,
      "actual": 15
    },
    {
      "index": 1,
      "severity": "medium",
      "description": "字段 cost 的值 2000 偏离均值 600.5 (2.9 个标准差)",
      "field": "cost",
      "expected": 600.5,
      "actual": 2000
    }
  ],
  "summary": "在100条logistics记录中检测到2个异常点，其中包含高严重度异常",
  "metadata": {
    "mode": "llm_enhanced",
    "model": "gpt-4",
    "method": "zscore",
    "fallback_count": 5
  }
}
```

**字段说明:**
- `severity`: 严重程度 (low/medium/high)
- `field`: 异常字段名
- `expected`: 期望值（均值）
- `actual`: 实际值
- `description`: 异常描述

**检测方法:**
1. **Z-Score统计方法**: 检测偏离均值超过2.5个标准差的值
2. **LLM增强分析**: 使用大语言模型进行智能异常识别

**最佳实践:**
- 数据量建议在3-30条之间以获得LLM增强效果
- 自动检测所有数值字段
- 最多返回20个异常点

---

## 风险评分

### POST /ai/risk/score
供应商风险评估与评分

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
  "supplier_id": "S001",
  "supplier_name": "供应商A",
  "score": 92.5,
  "risk_level": "Low",
  "breakdown": {
    "on_time_rate": 0.38,
    "quality_rate": 0.294,
    "price_stability": 0.18,
    "response_score": 0.085
  },
  "recommendations": [
    "保持当前良好的交付准时率",
    "继续维持高质量标准",
    "关注价格波动趋势"
  ],
  "metadata": {
    "mode": "llm_enhanced",
    "model": "gpt-4",
    "method": "weighted_formula"
  }
}
```

**字段说明:**
- `score`: 综合评分 (0-100)
- `risk_level`: 风险等级 (Critical/High/Medium/Low)
- `breakdown`: 各维度贡献值明细
- `recommendations`: LLM生成的改进建议

**评分权重:**
- 准时交付率 (`on_time_rate`): 40%
- 质量合格率 (`quality_rate`): 30%
- 价格稳定性 (`price_stability`): 20%
- 响应速度 (`response_score`): 10%

**风险等级划分:**
- `Low`: score >= 85
- `Medium`: 70 <= score < 85
- `High`: 60 <= score < 70
- `Critical`: score < 60

**指标说明:**
- 如果指标值 > 1，系统会自动将其视为百分制（除以100）
- 所有指标应在0-1或0-100范围内

---

## 健康检查

### GET /health
检查AI服务状态

**响应:**
```json
{
  "status": "ok",
  "service": "python-ai",
  "llm_enabled": true,
  "model": "gpt-4"
}
```

**字段说明:**
- `llm_enabled`: 是否启用了LLM功能
- `model`: 当前使用的模型名称

---

## 配置说明

Python后端支持通过配置文件启用LLM功能：

**配置文件**: `backend-python/config.json`

```json
{
  "openai_api_key": "your-api-key",
  "openai_base_url": "https://api.openai.com/v1",
  "openai_model": "gpt-4",
  "timeout": 30
}
```

**工作模式:**
1. **无API Key**: 仅使用规则引擎（确定性算法）
2. **有API Key**: 规则引擎 + LLM增强（更智能的分析）

---

## 错误处理

所有API在发生错误时返回标准HTTP错误码：

- `400`: 请求参数错误
- `500`: 服务器内部错误

**错误响应示例:**
```json
{
  "detail": "错误描述信息"
}
```

---

## 性能建议

1. **需求预测**: 历史数据建议至少3条，最多100条
2. **异常检测**: 数据量3-30条可获得LLM增强效果
3. **风险评分**: 必须提供完整的4个指标
4. **超时设置**: 默认60秒，LLM调用可能需要更长时间

---

## 技术栈

- **框架**: FastAPI
- **AI集成**: OpenAI API (可选)
- **统计方法**: Z-Score、滑动平均
- **数据验证**: Pydantic models
