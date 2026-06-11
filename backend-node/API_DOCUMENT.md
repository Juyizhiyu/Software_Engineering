# 供应链管理系统 - 后端核心 API 接口文档

本文档定义了系统当前更新的核心业务接口，包含请求路径、参数及响应格式，供前端同学进行数据联调与系统部署。

------

## 一、 用户身份认证接口

### 1. 用户登录认证接口

- **接口路径**：`/api/auth/login`
- **请求方法**：`POST`
- **数据格式**：`application/json`

#### 请求参数 (Body)

| **参数名** | **类型** | **是否必填** | **默认测试值** | **说明**   |
| ---------- | -------- | ------------ | -------------- | ---------- |
| username   | String   | 是           | admin          | 管理员账号 |
| password   | String   | 是           | 123456         | 登录密码   |

#### 请求体示例：

JSON

```
{
  "username": "admin",
  "password": "123456"
}
```

#### 返回结果 (Response)

##### 状态码 200 (登录成功)：

JSON

```
{
  "success": true,
  "message": "登录成功",
  "data": {
    "name": "供应链系统管理员",
    "role": "admin",
    "token": "mock-jwt-token-xyz-123456"
  }
}
```

##### 状态码 401 (账号或密码错误)：

JSON

```
{
  "success": false,
  "message": "账号或密码错误，请重试"
}
```

------

## 二、 业务大盘与核心数仓接口

### 2. 核心数据大盘总览接口（支持多维度筛选）

- **接口路径**：`/api/dashboard/summary`
- **请求方法**：`GET`

#### 请求参数 (Query String)

| **参数名** | **类型** | **是否必填** | **可选值示例**     | **说明**                                                     |
| ---------- | -------- | ------------ | ------------------ | ------------------------------------------------------------ |
| region     | String   | 否           | 华南 / 华东 / 华北 | 按地区筛选大盘数据。如果不传此参数，默认返回全量抖音电商总数据。 |

#### 请求 URL 示例：

- 查询全量总数据：`http://localhost:3000/api/dashboard/summary`

#### 返回结果 (Response)

##### 状态码 200 (获取成功)：

JSON

```
{
  "success": true,
  "message": "数据获取成功",
  "data": {
    "totalRevenue": 1847629500.00,
    "activeSuppliers": 154,
    "riskAlerts": 5,
    "pendingOrders": 1420
  }
}
```

### 3. 库存快照数据接口（MySQL 数仓实时关联）

- **接口路径**：`/api/data/inventory`
- **请求方法**：`GET`
- **说明**：底层已升级为基于 mysql2/promise 异步连接池的多表实时关联查询。联动商品销售表 `supply_chain_bi.douyin_sales`，自动拉取真实抖音爆款品类、单价与动态库存状态。

#### 返回结果 (Response)

##### 状态码 200 (获取成功)：

JSON

```
{
  "success": true,
  "data": [
    {
      "snapshot_date": "2026-06-11T00:00:00.000Z",
      "product_id": "SPU_773451",
      "product_name": "时瑞名表汇 卡西欧未使用 5",
      "brand": "卡西欧",
      "current_stock": 5,
      "safety_stock": 10,
      "stockStatus": "shortage",
      "unit_cost": "998.00"
    },
    {
      "snapshot_date": "2026-06-11T00:00:00.000Z",
      "product_id": "SPU_998124",
      "product_name": "柒柒力荐 路易威登 98新 市场珍稀",
      "brand": "路易威登",
      "current_stock": 1,
      "safety_stock": 5,
      "stockStatus": "shortage",
      "unit_cost": "23800.00"
    }
  ]
}
```

### 4. 订单明细宽表接口（MySQL 数仓实时关联）

- **接口路径**：`/api/data/orders`
- **请求方法**：`GET`
- **说明**：底层实时自 `supply_chain_bi.douyin_sales` 抖音高维特征事实宽表抓取，转化为包含真实清洗后的商品名、大类、客单价、真实GMV的多维可视化数据。

#### 返回结果 (Response)

##### 状态码 200 (获取成功)：

JSON

```
{
  "success": true,
  "data": [
    {
      "order_id": "ORD202606110001",
      "date": "2026-06-11",
      "customer_region": "四川省",
      "product_id": "SPU_551204",
      "product_name": "老虎专享FILA斐乐儿童装20",
      "category": "儿童服饰",
      "quantity": 3,
      "unit_price": "504.00",
      "amount": "1512.00",
      "status": "success",
      "channel_type": "抖音直播间"
    }
  ]
}
```

------

## 三、 AI 智能分析工作台核心接口 (新增)

### 5. 智能问答接口 (主智能体入口)

- **接口路径**：`/api/ai/analyze-agent`（或对应系统具体路由路径）
- **请求方法**：`POST`
- **说明**：将大盘或指定业务数据集作为 Context（上下文）发给 AI 核心，若 Python 侧云端大模型服务不可用，将自动降级为 Node 本地真数据流规则推演。

#### 请求参数 (Body)

JSON

```
{
  "question": "请结合当前所有数据，给出本周供应链运营的优先级和具体动作建议。"
}
```

#### 返回结果 (Response)

JSON

```
{
  "success": true,
  "data": {
    "answer": "AI 大模型处于断网或策略降级状态，已自动触发本地硬核规则引擎。围绕该提问，结合当前大盘突破 18.47 亿元的总体经营态势，系统扫描出当前的局部供应链瓶颈。",
    "summary": [
      "大盘真实流水已通过 MySQL 实时多维行业聚合。当前低于安全库存的核心爆款记录数为 2 条。",
      "全网开放风险监控点 1 个。"
    ],
    "suggestions": [
      "优先保障抖音核心仓的高周转 SKU 库存复盘，避免由于销售暴涨引发断货。",
      "针对千万级销量带来的物流干线压力，立刻评估并启动顺丰/邮政备选应急专线。"
    ]
  }
}
```

### 6. 需求预测接口

- **接口路径**：`/api/ai/forecast`
- **请求方法**：`POST`

#### 请求参数 (Body)

| **参数名**   | **类型** | **是否必填** | **默认测试值** | **说明**              |
| ------------ | -------- | ------------ | -------------- | --------------------- |
| product_id   | String   | 是           | SPU_773451     | 核心单品 SPU 唯一编码 |
| product_name | String   | 否           | 卡西欧手表     | 商品清洗名称          |

#### 返回结果 (Response)

JSON

```
{
  "success": true,
  "data": {
    "product_id": "SPU_773451",
    "forecast_demand_7d": 6842,
    "confidence": "medium",
    "trend": "upward",
    "analysis": "Python 预测引擎离线降级。Node.js 依据当前单品历史真实流水，推估未来 7 日全渠道销售将持续处于高位增长形态。"
  }
}
```

### 7. 异常检测预警接口

- **接口路径**：`/api/ai/anomaly`
- **请求方法**：`POST`
- **说明**：核心高能接口。采用后端的 **Z-score 统计学公式** 自动扫描千万级数据切片中的离群反常点。若 Python 侧 LLM 未启用，将降级输出基于规则计算的结构化真实反常数据。

#### 请求参数 (Body)

JSON

```
{
  "data_type": "inventory"
}
```

#### 返回结果 (Response)

JSON

```
{
  "success": true,
  "data": {
    "data_type": "inventory",
    "total_records": 50,
    "mode": "rule",
    "anomalies": [
      {
        "field": "price",
        "reason": "异常突增峰值",
        "desc": "字段 price 的值 23800.0 偏离均值 2084.4 (5.5 个标准差)"
      }
    ],
    "summary": "在 50 条 inventory 记录中检测到 1 个异常点，其中包含高严重度异常（关联对象：柒柒力荐 路易威登 98新）。"
  }
}
```

### 8. 供应商风险评分接口

- **接口路径**：`/api/ai/risk-score`
- **请求方法**：`POST`

#### 请求参数 (Body)

JSON

```
{
  "supplier_id": "SUP_成都时瑞",
  "supplier_name": "时瑞电商名表托管仓"
}
```

#### 返回结果 (Response)

JSON

```
{
  "success": true,
  "data": {
    "supplier_id": "SUP_成都时瑞",
    "score": 78,
    "risk_level": "High",
    "recommendations": [
      "由于该供应商对应的核心单品存在严重备货积压与呆滞料风险（如卡西欧、LV季度销量仅1件），系统触发高风险预警。",
      "建议联动全川直播间进行降价清仓，或实施跨仓调配。"
    ]
  }
}
```

------

## 四、 后端本地运行与底层适配说明

### 1. 本地运行步骤

- 进入后端目录：`cd backend-node`
- 安装数据库及网络通信驱动：`npm install`
- 启动本地服务：`node server.js`
- 本地接口根地址：`http://localhost:3000`

### 2. 数据库环境依赖配置

运行本项目前，请检查 `backend-node/config/db.js` 配置文件，确保其指向真实的 MySQL 实例：

JavaScript

```
module.exports = {
  host: '127.0.0.1',
  user: 'root',
  password: '你的数据库密码',
  database: 'supply_chain_bi'
};
```

### 3. 跨小组协作联调规范

- **数据注入说明**：当前系统后端数据全量接入 `supply_chain_bi.douyin_sales` 真实电商数据库。在执行 AI 异常检测和预警功能时，系统会动态抓取最高价值 23,800.0 元等反常货品进行 Z-score 排查，数据真实且具备完整的商业推演逻辑。
- **AI 算力解耦降级机制**：本系统 Node.js 端在调用 AI 核心时，默认向本地 `127.0.0.1:8000` 端口发送高维特征数据包。若成员 4 的 Python 算力环境离线或大模型 API Key 欠费未启用，系统会自动平滑降级为后端规则引擎输出。