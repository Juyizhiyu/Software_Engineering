# 供应链管理系统 - 后端核心 API 接口文档

本文档定义了系统当前更新的核心业务接口，包含请求路径、参数及响应格式，供前端同学进行数据联调。

---

## 1. 用户登录认证接口

* 接口路径：/api/auth/login
* 请求方法：POST
* 数据格式：application/json

### 请求参数 (Body)
| 参数名   | 类型   | 是否必填 | 默认测试值 | 说明       |
| :------- | :----- | :------- | :--------- | :--------- |
| username | String | 是       | admin      | 管理员账号 |
| password | String | 是       | 123456     | 登录密码   |

#### 请求体示例：
{
  "username": "admin",
  "password": "123456"
}

### 返回结果 (Response)

#### 状态码 200 (登录成功)：
{
  "success": true,
  "message": "登录成功",
  "data": {
    "name": "供应链系统管理员",
    "role": "admin",
    "token": "mock-jwt-token-xyz-123456"
  }
}

#### 状态码 400 (账号或密码错误)：
{
  "success": false,
  "message": "账号或密码错误，请重试"
}

---

## 2. 核心数据大盘总览接口（支持多维度筛选）

* 接口路径：/api/dashboard/summary
* 请求方法：GET

### 请求参数 (Query String)
| 参数名 | 类型   | 是否必填 | 可选值示例         | 说明                                                       |
| :----- | :----- | :------- | :----------------- | :--------------------------------------------------------- |
| region | String | 否       | 华南 / 华东 / 华北 | 按地区筛选大盘数据。如果不传此参数，默认返回全国全量数据。 |

#### 请求 URL 示例：
* 查询全国全量数据：http://localhost:3000/api/dashboard/summary
* 查询华南地区数据：http://localhost:3000/api/dashboard/summary?region=华南

### 返回结果 (Response)

#### 状态码 200 (获取成功)：
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

---

## 3. 后端本地运行与调试说明
1. 进入后端目录：cd backend-node
2. 启动本地服务：node server.js
3. 本地接口根地址：http://localhost:3000