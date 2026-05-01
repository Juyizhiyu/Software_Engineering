# AI 赋能供应链可视化分析系统 — 项目文档

## 项目简介

本项目是一套面向企业供应链管理场景的 **BI 可视化分析系统 Demo**。系统以订单、库存、供应商、物流、成本、风险六大业务数据为基础，整合可视化分析、风险预警、LLM 智能问答和 Agent 决策辅助能力，帮助管理者实时掌握供应链运行状态。

**核心目标**：在不接入真实数据库的前提下，使用 JSON 文件模拟供应链数据，交付一个可运行、可展示、可扩展的系统原型。

## 技术栈

| 层级 | 技术 | 版本 | 用途 |
|---|---|---|---|
| 前端 | Vue 3 + Vite | Vue 3.5 / Vite 8 | SPA 页面与交互式仪表盘 |
| 前端路由 | Vue Router | 4.5 | 客户端路由 |
| HTTP 客户端 | Axios | 1.15 | 前端 API 请求 |
| 后端 API | Node.js + Express | Express 5.2 | REST API 网关，数据聚合与路由 |
| AI 分析 | Python + FastAPI | — | 预测、异常检测、风险评分、Agent 调度 |
| LLM 接入 | OpenAI API | gpt-4.1-mini | 自然语言分析、报告生成（可替换 DeepSeek 等） |
| 数据格式 | JSON | — | Demo 阶段的数据存储与传输格式 |
| 预留数据库 | MySQL | — | 后续替换 JSON 数据源 |

## 功能特性

### 已实现

- **全局总览驾驶舱**：展示订单量、销售额、库存总量、风险数量等核心 KPI，以及销售趋势、风险分布、库存预警、供应商排行、延迟物流等图表
- **数据中心**：支持订单、库存、供应商、物流、成本、风险六类业务数据的在线录入与查看
- **业务分析看板**：库存分析、供应商绩效评估、物流异常监控、成本趋势分析
- **风险中心**：集中展示风险事件，支持按等级分类、状态跟踪
- **AI 工作台**：自然语言供应链分析问答，LLM 驱动（可回退到规则引擎）
- **服务状态面板**：侧边栏实时显示 Node.js 与 Python 服务连接状态

### Demo 阶段未实现

- 未接入真实 ERP/CRM/WMS/TMS
- 未连接 MySQL（使用 JSON 文件）
- 无深度学习模型（使用规则引擎 + LLM）
- 无完整用户权限系统
- 无真实邮件/短信/企业微信告警

## 项目结构

```
supply-chain-bi-demo/
├── plan.md                         # 项目开发计划
├── package.json                    # 根 package（启动脚本）
├── start.bat                       # Windows 一键启动脚本
│
├── frontend/                       # Vue 3 前端
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.js                 # 入口
│       ├── App.vue                 # 根组件（布局 + 导航 + 服务状态）
│       ├── router/index.js         # 路由配置（5 个页面）
│       ├── api/request.js          # Axios 封装
│       ├── config/dataForms.js     # 数据录入表单配置
│       ├── utils/format.js         # 格式化工具函数
│       └── views/
│           ├── Overview.vue        # 全局总览驾驶舱
│           ├── DataCenter.vue      # 数据中心（CRUD 录入）
│           ├── OperationsHub.vue   # 业务分析（库存/供应商/物流/成本）
│           ├── RiskCenter.vue      # 风险中心
│           └── AiStudio.vue        # AI 工作台（问答 + 分析）
│
├── backend-node/                   # Node.js API 网关
│   ├── package.json
│   ├── .env                        # 环境变量
│   ├── server.js                   # Express 入口
│   ├── config/
│   │   └── dataDefinitions.js      # 实体定义（字段、校验规则）
│   ├── routes/
│   │   ├── dashboard.js            # /api/dashboard/*
│   │   ├── data.js                 # /api/data/*（CRUD）
│   │   ├── inventory.js            # /api/inventory/analysis
│   │   ├── suppliers.js            # /api/suppliers/performance
│   │   ├── logistics.js            # /api/logistics/anomalies
│   │   ├── costs.js                # /api/costs/analysis
│   │   ├── risks.js                # /api/risks
│   │   ├── assistant.js            # /api/assistant/chat
│   │   └── operations.js           # /api/operations/snapshot
│   ├── services/
│   │   ├── dataService.js          # 数据聚合、统计、规范化
│   │   └── aiService.js            # 调用 Python AI 服务（含 fallback）
│   ├── repositories/
│   │   └── jsonRepository.js       # JSON 文件读写抽象层
│   ├── data/                       # JSON 模拟数据
│   │   ├── orders.json
│   │   ├── inventory.json
│   │   ├── suppliers.json
│   │   ├── logistics.json
│   │   ├── costs.json
│   │   └── risks.json
│   └── generate_mock_data.js       # 模拟数据生成脚本
│
├── backend-python/                 # Python AI 分析服务
│   ├── main.py                     # FastAPI 入口
│   ├── config.example.json         # LLM 配置模板
│   ├── routers/
│   │   ├── agent.py                # /agent/analyze
│   │   ├── forecast.py             # /ai/forecast/demand
│   │   ├── anomaly.py              # /ai/anomaly/detect
│   │   └── risk_score.py           # /ai/risk/score
│   ├── services/
│   │   ├── llm_client.py           # LLM 调用（OpenAI / fallback）
│   │   └── agent_orchestrator.py   # Agent 编排器
│   └── models/
│       └── schemas.py              # Pydantic 数据模型
│
└── docs/                           # 项目文档
    ├── README.md                   # 本文件
    ├── architecture.md             # 架构设计
    ├── api-design.md               # API 接口文档
    ├── data-dictionary.md           # 数据字典
    └── deployment.md               # 部署与运行指南
```

## 快速开始

### 环境要求

- Node.js 18+
- Python 3.10+
- npm

### 1. 启动 Python AI 服务

```bash
cd backend-python
pip install fastapi uvicorn pydantic
uvicorn main:app --reload --port 8000
```

可选：复制 `config.example.json` 为 `config.json` 并填入 OpenAI API Key 以启用 LLM 功能。

### 2. 启动 Node.js 后端

```bash
cd backend-node
npm install
node server.js
```

服务默认运行在 `http://localhost:3000`。

### 3. 启动 Vue 前端

```bash
cd frontend
npm install
npm run dev
```

前端默认运行在 `http://localhost:5173`。

### 一键启动（Windows）

在项目根目录双击 `start.bat`，将自动启动三个服务窗口。

## 环境变量

Node.js 后端 `.env` 文件：

```env
PORT=3000
DATA_SOURCE=json
PYTHON_AI_BASE_URL=http://localhost:8000
```

Python AI 服务 `config.json`：

```json
{
  "openai_api_key": "your_api_key",
  "openai_model": "gpt-4.1-mini",
  "openai_base_url": "https://api.openai.com/v1"
}
```

## API 概览

| 端点 | 方法 | 说明 |
|---|---|---|
| `/api/health` | GET | Node.js 健康检查 |
| `/api/dashboard/summary` | GET | Dashboard 核心摘要指标 |
| `/api/dashboard/overview` | GET | Dashboard 完整面板数据 |
| `/api/inventory/analysis` | GET | 库存分析（按库存升序） |
| `/api/suppliers/performance` | GET | 供应商绩效（按评分降序） |
| `/api/logistics/anomalies` | GET | 物流异常（仅延迟记录） |
| `/api/costs/analysis` | GET | 成本分析（按日期升序） |
| `/api/risks` | GET | 风险列表（按时间降序） |
| `/api/data/schemas` | GET | 实体 Schema 定义 |
| `/api/data/all` | GET | 全部原始数据 |
| `/api/data/:entity` | GET | 指定实体数据 |
| `/api/data/:entity` | POST | 新增实体记录 |
| `/api/assistant/chat` | POST | AI 智能分析问答 |
| `/api/operations/snapshot` | GET | 四模块综合快照 |

完整 API 文档见 [api-design.md](api-design.md)。

## 架构分层

```
Vue 前端 → Node.js API 网关 → JSON 数据 / Python AI 服务 → LLM 模型
```

详细架构说明见 [architecture.md](architecture.md)。
