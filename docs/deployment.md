# 部署与运行指南

## 环境要求

| 组件 | 最低版本 |
|---|---|
| Node.js | 18+ |
| npm | 9+ |
| Python | 3.10+ |
| pip | 最新版 |

## 方式一：分步启动（推荐开发调试）

### 1. 准备 Python 环境

```bash
cd backend-python

# 创建虚拟环境（可选）
python -m venv venv

# Windows 激活
venv\Scripts\activate

# macOS/Linux 激活
source venv/bin/activate

# 安装依赖
pip install fastapi uvicorn pydantic
```

### 2. 配置 LLM（可选）

```bash
cd backend-python
cp config.example.json config.json
```

编辑 `config.json`，填入你的 OpenAI API Key：

```json
{
  "openai_api_key": "sk-your-api-key",
  "openai_model": "gpt-4.1-mini",
  "openai_base_url": "https://api.openai.com/v1"
}
```

> 不配置 API Key 也可正常启动，AI 分析将使用本地规则引擎。

### 3. 启动 Python AI 服务

```bash
cd backend-python
uvicorn main:app --reload --port 8000
```

服务启动后访问 `http://localhost:8000/health` 确认状态。

### 4. 准备 Node.js 环境

```bash
cd backend-node
npm install
```

### 5. 配置 Node.js 环境变量

编辑 `backend-node/.env`：

```env
PORT=3000
DATA_SOURCE=json
PYTHON_AI_BASE_URL=http://localhost:8000
```

### 6. 生成测试数据（可选）

```bash
cd backend-node
node generate_mock_data.js
```

### 7. 启动 Node.js 服务

```bash
cd backend-node
node server.js
```

服务启动后访问 `http://localhost:3000/api/health` 确认状态。

### 8. 启动 Vue 前端

```bash
cd frontend
npm install
npm run dev
```

前端启动后访问 `http://localhost:5173`。

---

## 方式二：一键启动（Windows）

项目根目录下的 `start.bat` 可一键启动三个服务：

```bat
start.bat
```

脚本会在三个独立命令行窗口中分别启动 Python AI、Node.js 和 Vue 前端。

> 首次运行前需确保三个服务的依赖均已安装（pip install、npm install）。

---

## 方式三：根目录 npm 脚本

```bash
# 安装根依赖
npm install

# 分别启动各服务
npm run frontend:dev    # 启动前端
npm run backend:node    # 启动 Node 后端

# 一键启动（Windows）
npm run demo
```

---

## 服务端口一览

| 服务 | 端口 | 访问地址 |
|---|---|---|
| Vue 前端 | 5173 | http://localhost:5173 |
| Node.js API | 3000 | http://localhost:3000 |
| Python AI | 8000 | http://localhost:8000 |

---

## 健康检查

启动所有服务后，可通过以下端点验证：

```bash
# Node.js 健康检查
curl http://localhost:3000/api/health

# Python AI 健康检查
curl http://localhost:8000/health

# Dashboard 数据检查
curl http://localhost:3000/api/dashboard/summary
```

前端侧边栏底部也有实时服务状态面板。

---

## Docker 部署（规划中）

后续可添加 Docker Compose 配置实现容器化部署：

```yaml
# docker-compose.yml (规划)
services:
  frontend:
    build: ./frontend
    ports: ["5173:5173"]
  backend-node:
    build: ./backend-node
    ports: ["3000:3000"]
  backend-python:
    build: ./backend-python
    ports: ["8000:8000"]
```

---

## 常见问题

### Q: Python 服务启动报错 "No module named 'fastapi'"

```bash
pip install fastapi uvicorn pydantic
```

### Q: 前端页面无法加载数据

1. 确认 Node.js 服务已启动（`http://localhost:3000/api/health` 可访问）
2. 确认浏览器控制台无 CORS 错误
3. 检查 `frontend/.env` 或 `src/api/request.js` 中的 API 地址配置

### Q: AI 助手返回"规则模式"

这表示 LLM 未连接，系统已自动回退到本地规则分析。可能原因：
- `config.json` 中未配置 `openai_api_key`
- Python AI 服务未启动或无法连接
- 网络无法访问 OpenAI API

### Q: 如何清空并重新生成测试数据

```bash
cd backend-node
node generate_mock_data.js
```

这会覆盖所有 6 个 JSON 数据文件。

### Q: 如何修改前端 API 地址

编辑 `frontend/.env` 或 `frontend/.env.development`：

```env
VITE_API_BASE_URL=http://127.0.0.1:3000/api
```

修改后需重启前端开发服务器。
