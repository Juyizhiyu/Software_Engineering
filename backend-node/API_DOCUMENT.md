# 供应链管理系统 - 后端核心 API 接口文档

本文档定义了系统当前更新的核心业务接口，包含请求路径、参数及响应格式，供前端同学进行数据联调与系统部署。

---

## 一、 用户身份认证接口

### 1. 用户登录认证接口
* **接口路径**：/api/auth/login
* **请求方法**：POST
* **数据格式**：application/json

#### 请求参数 (Body)
| 参数名   | 类型   | 是否必填 | 默认测试值 | 说明       |
| :------- | :----- | :------- | :--------- | :--------- |
| username | String | 是       | admin      | 管理员账号 |
| password | String | 是       | 123456     | 登录密码   |

#### 请求体示例：
{
  "username": "admin",
  "password": "123456"
}

#### 返回结果 (Response)
##### 状态码 200 (登录成功)：
{
  "success": true,
  "message": "登录成功",
  "data": {
    "name": "供应链系统管理员",
    "role": "admin",
    "token": "mock-jwt-token-xyz-123456"
  }
}

##### 状态码 400 (账号或密码错误)：
{
  "success": false,
  "message": "账号或密码错误，请重试"
}

---

## 二、 业务大盘与核心数仓接口

### 2. 核心数据大盘总览接口（支持多维度筛选）
* **接口路径**：/api/dashboard/summary
* **请求方法**：GET

#### 请求参数 (Query String)
| 参数名 | 类型   | 是否必填 | 可选值示例         | 说明                                                       |
| :----- | :----- | :------- | :----------------- | :--------------------------------------------------------- |
| region | String | 否       | 华南 / 华东 / 华北 | 按地区筛选大盘数据。如果不传此参数，默认返回全国全量数据。 |

#### 请求 URL 示例：
* 查询全国全量数据：http://localhost:3000/api/dashboard/summary
* 查询华南地区数据：http://localhost:3000/api/dashboard/summary?region=华南

#### 返回结果 (Response)
##### 状态码 200 (获取成功)：
{
  "success": true,
  "message": "数据获取成功",
  "data": {
    "totalRevenue": 12500000,
    "activeSuppliers": 48,
    "riskAlerts": 3,
    "pendingOrders": 12
  }
}

### 3. 库存快照数据接口（MySQL 数仓实时关联）
* **接口路径**：/api/data/inventory
* **请求方法**：GET
* **说明**：底层已升级为基于 mysql2/promise 异步连接池的多表 LEFT JOIN 关联查询。联动商品表与库存快照事实表，自动拉取仓库名、品类、单价等核心属性。

#### 返回结果 (Response)
##### 状态码 200 (获取成功)：
{
  "success": true,
  "data": [
    {
      "snapshot_date": "2026-05-29T16:00:00.000Z",
      "product_id": "P001",
      "product_name": "AI 智能空气净化器",
      "warehouse_id": "W001",
      "warehouse_name": "广州中心仓",
      "current_stock": 50,
      "on_order_qty": 0,
      "safety_stock": 100,
      "unit_cost": "899.00"
    },
    {
      "snapshot_date": "2026-05-29T16:00:00.000Z",
      "product_id": "P002",
      "product_name": "无线降噪蓝牙耳机",
      "warehouse_id": "W002",
      "warehouse_name": "上海前置仓",
      "current_stock": 400,
      "on_order_qty": 0,
      "safety_stock": 150,
      "unit_cost": "499.00"
    }
  ]
}

### 4. 订单明细宽表接口（MySQL 数仓实时关联）
* **接口路径**：/api/data/orders
* **请求方法**：GET
* **说明**：底层实时联动订单事实表、商品表、渠道地区表，将原始的 ID 数据转化为包含商品名、大类、省份、销售额的多维可视化数据。

#### 返回结果 (Response)
##### 状态码 200 (获取成功)：
{
  "success": true,
  "data": [
    {
      "order_id": "O20260601001",
      "date": "2026-05-31T16:00:00.000Z",
      "customer_region": "广东省",
      "product_id": "P001",
      "product_name": "AI 智能空气净化器",
      "category": "智能家电",
      "quantity": 2,
      "unit_price": "899.00",
      "amount": "1798.00",
      "status": "success",
      "year": null,
      "channel_type": "线上电商"
    },
    {
      "order_id": "O20260601002",
      "date": "2026-05-31T16:00:00.000Z",
      "customer_region": "上海市",
      "product_id": "P002",
      "product_name": "无线降噪蓝牙耳机",
      "category": "数码电子",
      "quantity": 1,
      "unit_price": "499.00",
      "amount": "499.00",
      "status": "success",
      "year": null,
      "channel_type": "线下零售"
    }
  ]
}

---

## 三、 后端本地运行与底层适配说明

### 1. 本地运行步骤
* 进入后端目录：cd backend-node
* 安装新增的数据库驱动：npm install
* 启动本地服务：node server.js
* 本地接口根地址：http://localhost:3000

### 2. 数据库环境依赖配置
运行本项目前，请检查 backend-node/config/db.js 配置文件，确保其指向本地或公共的 MySQL 实例：

module.exports = {
  host: '127.0.0.1',
  user: 'root',
  password: '你的数据库密码',
  database: 'supply_chain_bi'
};

### 3. 跨小组协作联调规范
* 新重构的 MySQL 数据层已在底层使用 AS 别名完成了映射升级。返回的字段命名（如 current_stock、customer_region）与原型设计百分之百完全保持一致。前端现有的 Vue 组件可以直接请求上述接口无缝绘制图表，无需重构变量。
* 由于数仓在 MySQL 中建立了严格的物理外键约束，当在本地使用 Python、ETL 工具或者手工插入模拟测试数据时，请务必确保先导入维度表（dim_*）后，再导入事实表（fact_*），避免触发外键失败拦截。