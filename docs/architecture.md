# 架构设计

## 总体架构

```
┌─────────────────────────────────────────────┐
│                   Vue 前端                   │
│ Overview / DataCenter / Operations /         │
│ RiskCenter / AiStudio                       │
└──────────────────────┬──────────────────────┘
                       │ HTTP JSON (Axios)
                       ▼
┌─────────────────────────────────────────────┐
│              Node.js API 网关层              │
│ Express 路由 → Service 层 → Repository 层    │
│ 路由管理 / 数据聚合 / 调用 AI 服务            │
└──────────────┬──────────────────────┬───────┘
               │                      │
               │ 读取业务数据          │ 调用分析服务 (Axios)
               ▼                      ▼
┌──────────────────────────┐   ┌────────────────────────────┐
│     JSON 数据文件          │   │ Python FastAPI AI 服务       │
│ data/*.json              │   │ 预测 / 异常检测 / 风险评分     │
│ (JsonRepository 抽象层)   │   │ LLM 接入 / Agent 调度         │
└──────────────────────────┘   └──────────────┬─────────────┘
                                              │
                                              ▼
                              ┌────────────────────────────┐
                              │ 外部 LLM 模型 (OpenAI API)   │
                              │ 或本地 Fallback 规则引擎     │
                              └────────────────────────────┘
```

## 五层架构说明

### 1. 前端展示层 (Vue 3 + Vite)

- **职责**：页面渲染、图表展示、用户交互、自然语言提问
- **路由设计**（5 个页面）：
  - `/overview` → Overview.vue：全局总览，核心 KPI + 趋势图 + 风险分布
  - `/data-center` → DataCenter.vue：六类业务数据的在线录入与列表查看
  - `/operations` → OperationsHub.vue：库存、供应商、物流、成本四个分析子页签
  - `/risk-center` → RiskCenter.vue：风险事件集中管理
  - `/ai-studio` → AiStudio.vue：AI 自然语言问答 + 分析结果展示
- **API 封装**：`src/api/request.js` 基于 Axios 创建实例，baseURL 指向 Node API，统一处理响应解包

### 2. Node.js API 网关层 (Express)

- **职责**：对前端提供统一 REST 接口，读取 JSON 数据，调用 Python AI 服务
- **分层设计**：
  - `routes/` — 路由层：处理 HTTP 请求/响应，不包含业务逻辑
  - `services/` — 服务层：数据聚合、统计计算、AI 调用
  - `repositories/` — 数据访问层：屏蔽 JSON 文件路径，返回标准 JS 对象
- **调用链**：`routes → services → repositories → JSON 文件`

### 3. 数据访问层

- **JsonRepository** 类提供通用的 JSON 文件 CRUD 操作
- 每个实体（orders / inventory / suppliers / logistics / costs / risks）对应一个 Repository 实例
- 后续接入 MySQL 时，只需新增 `mysqlRepository.js` 并保持返回结构一致，Service 层和前端无需修改

### 4. Python AI 分析层 (FastAPI)

- **职责**：需求预测、异常检测、风险评分、Agent 编排、LLM 调用
- **路由模块**：
  - `routers/forecast.py` — `/ai/forecast/demand`：需求预测（当前为 Mock）
  - `routers/anomaly.py` — `/ai/anomaly/detect`：异常检测（当前为 Mock）
  - `routers/risk_score.py` — `/ai/risk/score`：供应商风险评分计算
  - `routers/agent.py` — `/agent/analyze`：Agent 综合分析入口
- **服务模块**：
  - `services/llm_client.py` — LLM 调用核心，支持 OpenAI API 和本地 Fallback 两种模式
  - `services/agent_orchestrator.py` — Agent 编排器，当前为 LLM 调用的薄封装

### 5. LLM/Agent 智能层

- **LLM Client**：支持 OpenAI Responses API，通过 `config.json` 配置 API Key 和模型
- **Fallback 机制**：当 LLM 不可用时（无 API Key 或网络异常），自动降级为本地规则分析
- **Agent 工作流**：
  ```
  用户问题 → Node.js 读取全量业务数据 → Python /agent/analyze
  → LLM 基于数据上下文生成分析 → 返回结构化 JSON
  ```

## 设计原则

### 为什么使用 Node.js + Python 双后端

- Node.js 适合处理 Web API、前端请求、路由和数据聚合（I/O 密集型）
- Python 适合数据分析、机器学习、LLM 接入和 Agent 编排（计算密集型）
- 两者通过 HTTP JSON 通信，职责分离，可独立部署和扩展

### 为什么 Demo 阶段使用 JSON 文件

- 零配置：不需要数据库安装和连接配置
- 便于 Agent 自动生成测试数据
- 数据结构直观，便于前后端联调
- 后续可平滑替换为 MySQL（Repository 抽象层保证接口不变）

### 数据安全设计

- LLM 只能基于传入的 JSON 数据回答，禁止编造
- 系统提示词强制要求"数据不足时明确说明"
- 所有分析结果包含可追溯的数据依据（evidence 字段）

## 核心业务逻辑

### 库存状态判断

```
currentStock < safetyStock          → shortage（缺货风险）
currentStock > maxStock             → overstock（积压）
currentStock - safetyStock < 80     → warning（预警）
其他                                 → healthy（健康）
```

### 供应商综合评分

```
compositeScore = on_time_rate × 0.35
               + quality_rate × 0.3
               + price_stability × 0.2
               + response_score × 0.15

score < 78  → high risk
score < 87  → medium risk
score ≥ 87  → low risk
```

### 物流延误判定

```
delay_hours = actual_duration_hours - expected_duration_hours
delay_hours > 0 → status = delayed
delay_hours = 0 → status = on_time
```

### 风险分级

| 等级 | 含义 |
|---|---|
| Critical | 严重 — 需立即处理 |
| High | 高 — 24h 内处理 |
| Medium | 中 — 本周内处理 |
| Low | 低 — 持续监控 |

## 可扩展性设计

### MySQL 替换路径

```
当前：service → jsonRepository → JSON 文件
后续：service → mysqlRepository → MySQL 数据库
```

只需实现 `mysqlRepository.js` 并保持方法签名一致，其余层无须变更。

### LLM 提供商替换

修改 `config.json` 中的 `openai_base_url` 即可替换为兼容 OpenAI API 格式的其他服务（DeepSeek、Qwen 等）。

`config.json` 示例（DeepSeek）：

```json
{
  "openai_api_key": "your_deepseek_key",
  "openai_model": "deepseek-chat",
  "openai_base_url": "https://api.deepseek.com/v1"
}
```
