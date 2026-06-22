# 供应链 BI 智能分析系统

本项目是面向课程展示和原型验证的供应链 BI 系统，覆盖数据接入、业务看板、风险预警、成本分析、智能问答浮窗和智能决策支持。系统以 Vue 3 前端、Node.js API、Python AI 服务和 MySQL/CSV/JSON 数据体系组成，支持在数据库不可用时降级到本地 mock 数据，保证演示场景可运行。

## 项目亮点

- 全链路 BI 看板：提供全局总览、数据中心、业务分析、风险中心、决策分析模块和全局智能问答浮窗。
- 真实数据优先：Node API 优先读取 MySQL 中的业务表，异常时自动回退到 JSON/mock 数据。
- CSV 数据导入：支持物流、成本、风险等 CSV 数据导入数据库，供分析接口聚合使用。
- 智能决策支持：基于库存、物流、供应商、成本和风险数据生成优先级、影响范围、建议动作和证据说明。
- LLM + 规则兜底：已接入大模型调用链路；无 LLM Key 或 Python AI 不可用时使用规则引擎兜底。
- 决策分析缓存：每组筛选条件独立缓存，首次进入、数据库变动或手动刷新时重新分析。
- 多终端适配：桌面端侧边栏导航，移动端顶部栏和抽屉菜单，核心卡片和图表自适应单列布局。
- 自动化验证：包含前端单测、Node 单测、接口 smoke 测试、响应式脚本测试和构建验证。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | Vue 3、Vite、TypeScript、Element Plus、ECharts、Pinia、Vue Router |
| Node API | Express、mysql2、axios、JWT、JSON Repository |
| Python AI | FastAPI/Uvicorn、Agent Orchestrator、LLM Client、规则兜底工具 |
| 数据 | MySQL、CSV、JSON/mock 数据 |
| 测试 | Vitest、Node Test Runner、Playwright 脚本、项目级 verify 脚本 |

## 目录结构

```text
.
├── backend-node/          # Node.js API 服务
│   ├── routes/            # 业务接口路由
│   ├── services/          # 数据聚合、AI 转发、响应元数据
│   ├── repositories/      # MySQL/JSON 数据访问
│   ├── data/              # 本地 JSON 兜底数据
│   └── test/              # Node 单测和 API smoke 测试
├── backend-python/        # Python AI 服务
│   ├── routers/           # AI API 路由
│   ├── services/          # LLM 客户端和 Agent 编排
│   └── tools/             # 预测、风险、查询、报告工具
├── ui/                    # Vue 3 前端
│   ├── src/views/         # 页面模块
│   ├── src/components/    # 通用和业务组件
│   ├── src/composables/   # 组合式业务逻辑
│   └── src/api/           # 前端 API 封装
├── data/                  # CSV 数据和导入脚本
├── database/              # 建表 SQL、查询示例和数据库文档
├── docs/                  # 架构、API、部署和演示文档
├── test/                  # 项目级脚本测试
├── run.bat                # Windows 一键菜单
└── run.sh                 # Unix-like 一键脚本
```

## 功能模块

### 1. 全局总览

- 核心指标：订单量、销售额、客单价、库存、缺货、物流延迟、开放风险、成本、供应商均分。
- 图表和列表：销售趋势、库存告警、供应商排行、风险分布、近期订单。
- 数据状态：展示数据源、更新时间、降级原因和数据质量信息。

### 2. 数据中心

- 支持订单、库存、供应商、物流、成本、风险等实体数据查看。
- 提供基础 CRUD 表单能力和字段定义驱动的动态表单。
- 接口优先使用 MySQL，无法连接时回退到本地 JSON 数据。

### 3. 业务分析

- 库存优先级分析：识别缺货、预警库存和补货优先级。
- 供应商绩效分析：计算准时率、质量评分、响应评分、成本评分和综合评分。
- 物流异常分析：识别延迟路线、承运商、延迟时长和异常状态。
- 成本分析：拆分采购、仓储、运输、退货和总成本。
- 需求预测：保留商品/供应商维度预测、趋势图、预测区间、成本结构图、报告分段和处理建议。

### 4. 风险中心

- 聚合库存积压、履约延迟、高成本低销量、供应商波动等风险。
- 按风险等级、状态、关联对象和处理建议展示。
- 支持规则生成风险记录，也支持导入的风险 CSV 数据。
- 集成异常检测能力，可按成本、库存、订单、物流、供应商、风险数据类型手动触发检测。
- 集成供应商风险评分能力，可选择供应商并查看风险分、指标拆解和 AI 建议。
- 提供自动风险分析缓存，首次进入、数据库变动或手动刷新时重新分析，同条件重复访问复用缓存。

### 5. 智能问答浮窗

- 智能问答以全局右侧浮窗按钮形式提供。
- 在任意业务页面点击右下角按钮即可展开，浮窗宽度会根据当前分辨率尽可能放大。
- 问答能力调用 Python Agent 或 Node 兜底逻辑，支持快捷提问、结论、摘要、建议和证据展示。

### 6. 决策分析

- 页面能力：筛选器、指标卡、销售趋势、风险矩阵、成本拆分、智能建议、刷新、导出、配置保存。
- 筛选条件：区域、业务日期、品类、风险等级、分析维度。
- 智能建议：结合规则引擎和 LLM，输出优先级、问题、影响、行动和证据。
- 用户配置：分析维度、默认筛选条件、模块开关、紧凑布局等优先保存在浏览器 localStorage。
- 缓存策略：
  - 第一次进入或第一次使用某组筛选条件时创建缓存。
  - 每组筛选条件独享一份缓存。
  - 数据库内容变化时根据数据签名自动失效。
  - 点击刷新时通过 `forceRefresh=true` 强制重新分析。
  - 缓存为 Node 进程内存缓存，服务重启后会重新建立。

## 环境要求

- Node.js：建议 `20.19+` 或 `22.12+`
- npm：随 Node 安装
- Python：建议 `3.10+`
- MySQL：建议 `8.0+`
- Windows 用户可直接使用 `run.bat` 菜单；其他系统可使用 `run.sh` 或手动命令。

## 快速启动

### 方式一：一键菜单

```bash
npm install
npm run dev
```

Windows 下 `npm run dev` 会调用 `run.bat`，进入菜单后可选择：

- `1`：生产模式启动
- `2`：开发模式启动，包含前端 HMR
- `3`：停止服务
- `4`：MySQL 数据库初始化
- `5`：仅构建前端

### 方式二：分别启动

安装依赖：

```bash
npm install
npm --prefix backend-node install
npm --prefix ui install
pip install -r backend-python/requirements.txt
```

启动 Python AI：

```bash
cd backend-python
python -m uvicorn main:app --reload --port 8000
```

启动 Node API：

```bash
cd backend-node
npm run dev
```

启动前端：

```bash
cd ui
npm run dev
```

常用地址：

- 前端开发地址：http://localhost:5173
- Node API：http://localhost:3000/api
- Node 健康检查：http://localhost:3000/api/health
- Python AI 文档：http://localhost:8000/docs
- Python AI 健康检查：http://localhost:8000/health

默认演示登录：

```text
账号：admin
密码：123456
```

## 环境变量

复制 `backend-node/.env.example` 为 `backend-node/.env`，并按本地 MySQL 配置调整：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=supply_chain_bi

PORT=3000
AI_SERVICE_URL=http://localhost:8000
```

Python AI 的 LLM 配置可复制 `backend-python/config.example.json` 为 `backend-python/config.json`，填写兼容 Chat Completions 的模型地址和 Key。未配置时系统会使用规则兜底，不影响基础演示。

## 数据库初始化与 CSV 导入

### 一键初始化

Windows 可运行：

```bash
npm run setup
```

或运行 `run.bat` 后选择 `4. MySQL Database Setup`。脚本会创建 `supply_chain_bi` 数据库、执行建表 SQL，并可选择导入 CSV 数据。

### 手动执行建表

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS supply_chain_bi DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p --default-character-set=utf8mb4 supply_chain_bi < database/build_database.sql
mysql -u root -p --default-character-set=utf8mb4 supply_chain_bi < database/douyin_sales.sql
```

### 导入业务 CSV

基础数据导入：

```bash
python data/scripts/import_to_mysql.py
```

物流数据导入：

```bash
node data/scripts/import_logistics_to_mysql.js
```

成本和风险数据生成并导入：

```bash
node data/scripts/generate_costs_risks_import.js
```

当前 CSV 文件：

- `data/logistics.csv`
- `data/costs.csv`
- `data/risks.csv`

## 核心 API

| API | 方法 | 说明 |
| --- | --- | --- |
| `/api/health` | GET | Node 服务、数据库、数据质量和 AI 服务状态 |
| `/api/dashboard/summary` | GET | 总览核心指标 |
| `/api/dashboard/overview` | GET | 总览图表和列表数据 |
| `/api/operations/snapshot` | GET | 库存、供应商、物流、成本业务快照 |
| `/api/risks` | GET | 风险列表 |
| `/api/data/:entity` | GET/POST/PUT/DELETE | 数据中心实体 CRUD |
| `/api/decision/analysis` | GET | 决策分析聚合结果 |
| `/api/ai/chat` | POST | AI 问答 |
| `/api/ai/forecast` | POST | 需求预测 |
| `/api/ai/anomaly` | POST | 异常检测 |
| `/api/ai/risk-score` | POST | 供应商风险评分 |

决策分析示例：

```bash
curl "http://localhost:3000/api/decision/analysis?category=美妆&region=华东&dimension=cost"
```

强制刷新缓存：

```bash
curl "http://localhost:3000/api/decision/analysis?category=美妆&dimension=cost&forceRefresh=true"
```

## 响应元数据

核心接口会尽量返回 `metadata`，用于说明数据来源和降级状态：

```json
{
  "source": "mysql",
  "updatedAt": "2026-06-20T12:00:00.000Z",
  "fallbackReason": null,
  "filters": {},
  "quality": {
    "status": "complete",
    "recordCounts": {}
  }
}
```

常见字段：

- `metadata.source`：数据来源，如 `mysql`、`json`、`mixed`、`llm`。
- `metadata.updatedAt`：接口生成时间。
- `metadata.fallbackReason`：降级原因。
- `metadata.quality`：数据质量摘要。
- `metadata.ai`：AI 调用模式、模型或兜底原因。
- `metadata.cache`：决策分析缓存命中、缓存 key、数据签名等信息。

## 测试与验证

项目级完整验证：

```bash
npm run test:verify
```

该命令会依次执行：

- package manifest 校验
- 前端 lint
- 前端单元测试
- 前端类型检查和构建
- 决策分析 API smoke 脚本
- 决策分析响应式页面脚本
- Node 后端单测
- Node 语法检查
- Python 编译检查

也可以单独执行：

```bash
npm run test:ui
npm run test:node
npm run build
node test/decision-analysis-smoke.js
node test/responsive-check.js
```

说明：前端构建可能出现来自 `@vueuse/core` 的 Rolldown PURE 注解警告和 chunk size 警告，当前不影响构建通过。

## 演示流程建议

1. 打开“全局总览”，展示销售、库存、风险、成本和供应商核心指标。
2. 打开“数据中心”，展示订单、库存、供应商、物流、成本、风险数据管理。
3. 打开“业务分析”，展示库存优先级、供应商绩效、物流异常、高成本商品和需求预测。
4. 打开“风险中心”，展示开放风险、风险等级、处置建议、异常检测和供应商风险评分。
5. 点击右下角智能问答浮窗按钮，演示供应链智能问答。
6. 打开“决策分析”，切换品类、区域和分析维度，展示真实 API 聚合、LLM 决策建议和缓存刷新。
7. 在移动端视口打开页面，展示顶部栏、抽屉导航和单列自适应布局。

## 常见问题

### 1. MySQL 不可用时项目还能运行吗？

可以。Node API 会回退到 `backend-node/data/*.json` 中的 mock 数据，并在 `metadata.fallbackReason` 中说明原因。

### 2. 没有 LLM Key 会影响演示吗？

不会影响基础功能。AI 相关接口会使用 Python 或 Node 的规则兜底逻辑，仍会返回结构化建议和证据。

### 3. 决策分析为什么第二次打开没有重新调用 LLM？

这是缓存策略。相同筛选条件、数据库数据未变化且没有手动刷新时，会直接复用缓存结果。点击“刷新”会强制重新分析。

### 4. 切换不同品类后销售额会变化吗？

会。决策分析和总览汇总会按品类映射到 `douyin_sales.c1_name` 后重新聚合。

### 5. 如何确认新 CSV 已导入？

执行对应导入脚本后，可在 MySQL 中检查：

```sql
SELECT COUNT(*) FROM fact_logistics;
SELECT COUNT(*) FROM fact_costs;
SELECT COUNT(*) FROM fact_risks;
```

### 6. 端口被占用怎么办？

默认端口：

- 前端：`5173`
- Node API：`3000`
- Python AI：`8000`

Windows 下可运行 `run.bat` 并选择停止服务，或手动结束占用端口的进程。

## 相关文档

- `docs/architecture.md`：系统架构说明
- `docs/api-design.md`：API 设计说明
- `docs/deployment.md`：部署说明
- `docs/data-dictionary.md`：数据字典
- `docs/demo-script.md`：演示脚本
- `backend-node/API_DOCUMENT.md`：Node API 文档
- `ui/docs/`：前端重构和页面规划文档

## 项目定位

本项目以课程 Demo/原型系统为目标，重点展示供应链数据治理、BI 可视化、规则分析、LLM 辅助决策和端到端工程验证能力。当前版本未引入真实多用户权限体系和数据库配置表，用户个性化配置主要保存在浏览器本地。
