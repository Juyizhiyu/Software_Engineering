# AI 服务配置规范

> 版本：1.1 ｜ 最后更新：2026-06-02

---

## 1. 概述

供应链 BI 平台的 AI 分析功能由 `backend-python/` 下的 FastAPI 服务提供，通过调用大语言模型（LLM）实现智能供应链分析、风险研判和决策建议。

AI 服务的所有运行时参数集中在 `backend-python/config.json` 中管理。

---

## 2. 配置文件位置

| 文件 | 用途 | 是否入库 |
|---|---|---|
| `backend-python/config.example.json` | 配置模板（含注释说明） | ✅ 入库 |
| `backend-python/config.json` | 实际运行配置（含 API Key） | ❌ `.gitignore` 排除 |

**部署流程：**

```bash
# 1. 复制模板
cp backend-python/config.example.json backend-python/config.json

# 2. 编辑 config.json，填入真实 API Key 和参数
```

---

## 3. 配置字段说明

### 3.1 核心字段（必填）

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `openai_api_key` | string | `""` | LLM API 密钥。为空时系统自动降级为规则引擎模式 |
| `openai_model` | string | `"gpt-4.1-mini"` | 模型名称，需与 base_url 对应的服务商匹配 |
| `openai_base_url` | string | `"https://api.openai.com/v1"` | API 基础地址，兼容 OpenAI 接口规范 |
| `api_style` | string | `"responses"` | API 调用格式。`responses`（OpenAI Responses API）或 `chat_completions`（Chat Completions API，适用于 DeepSeek / Qwen / Kimi 等） |

### 3.2 请求控制字段

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `timeout` | int | `45` | HTTP 请求超时时间（秒），范围建议 15–120 |
| `max_retries` | int | `1` | 请求失败后的最大重试次数，0 表示不重试 |

### 3.3 降级策略字段

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `fallback_enabled` | bool | `true` | LLM 调用失败时是否自动降级为本地规则引擎分析 |
| `fallback_log_level` | string | `"warning"` | 降级日志级别，可选 `debug`/`info`/`warning`/`error`，设为空字符串 `""` 可关闭日志 |

---

## 4. 多服务商配置示例

系统支持两种 API 调用格式：OpenAI Responses API（`api_style: "responses"`）和 Chat Completions API（`api_style: "chat_completions"`）。通过 `api_style` 字段切换。

### 4.1 OpenAI 官方（Responses API）

```json
{
  "openai_api_key": "sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx",
  "openai_model": "gpt-4.1-mini",
  "openai_base_url": "https://api.openai.com/v1",
  "api_style": "responses"
}
```

### 4.2 DeepSeek（推荐国内使用，Chat Completions API）

```json
{
  "openai_api_key": "sk-xxxxxxxxxxxxxxxxxxxxxxxx",
  "openai_model": "deepseek-chat",
  "openai_base_url": "https://api.deepseek.com/v1",
  "api_style": "chat_completions"
}
```

### 4.3 阿里云百炼 / Qwen（Chat Completions API）

```json
{
  "openai_api_key": "sk-xxxxxxxxxxxxxxxxxxxxxxxx",
  "openai_model": "qwen-plus",
  "openai_base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "api_style": "chat_completions"
}
```

### 4.4 Moonshot / Kimi（Chat Completions API）

```json
{
  "openai_api_key": "sk-xxxxxxxxxxxxxxxxxxxxxxxx",
  "openai_model": "moonshot-v1-8k",
  "openai_base_url": "https://api.moonshot.cn/v1",
  "api_style": "chat_completions"
}
```

### 4.5 其他 OpenAI 兼容服务

只要服务商提供 `/v1/responses` 端点，即可替换 `openai_base_url` 和 `openai_model` 使用。

---

## 5. 运行时行为

### 5.1 配置加载流程

```
generate_report() 被调用
    │
    ▼
load_llm_config() 读取 backend-python/config.json
    │
    ├── config.json 存在 ──► 解析字段，合并默认值
    │
    └── config.json 不存在 ──► 使用 DEFAULT_CONFIG（API Key 为空）
    │
    ▼
检查 openai_api_key
    │
    ├── 有 Key ──► 调用 LLM API ──► 成功 ──► 返回 AI 分析结果
    │                        │
    │                        └── 失败 ──► 重试（max_retries 次）
    │                                        │
    │                                        └── 仍失败 ──► fallback_enabled?
    │
    └── 无 Key ──► fallback_enabled?
                    │
                    ├── true ──► 规则引擎分析（mode: "fallback"）
                    └── false ──► 返回错误提示（mode: "disabled"）
```

### 5.2 降级模式（Fallback）

当 LLM 不可用时，系统自动切换为**本地规则引擎**，基于以下维度进行分析：

- **库存预警**：当前库存 < 安全库存的记录数
- **物流延迟**：状态为 delayed 的运输任务数
- **风险敞口**：状态为 open 的风险项数
- **供应商健康度**：综合评分 < 80 的供应商数

降级模式下 `metadata.mode` 字段为 `"fallback"`，前端可据此显示"规则模式"标识。

### 5.3 健康检查

`GET /health` 端点返回当前 AI 服务状态：

```json
{
  "status": "ok",
  "service": "python-ai",
  "llm_enabled": true,
  "model": "gpt-4.1-mini"
}
```

`llm_enabled` 为 `true` 表示已配置 API Key，将调用真实 LLM。

---

## 6. 安全规范

| 规则 | 说明 |
|---|---|
| **禁止硬编码** | API Key 只能存放在 `config.json` 中，不得出现在代码、注释、日志中 |
| **禁止入库** | `config.json` 已被 `.gitignore` 排除，提交前请确认不会误提交 |
| **模板脱敏** | `config.example.json` 仅包含 `"your_api_key_here"` 占位符 |
| **日志脱敏** | 打印配置时禁止输出 `openai_api_key` 字段 |
| **环境隔离** | 开发、测试、生产环境使用不同的 API Key |

---

## 7. 故障排查

| 现象 | 可能原因 | 解决方法 |
|---|---|---|
| 前端显示"规则模式" | API Key 未配置或为空 | 检查 `config.json` 中 `openai_api_key` |
| `HTTP 401` | API Key 无效或已过期 | 到服务商后台确认 Key 状态 |
| `HTTP 404` | `openai_base_url` 路径错误 | 确认 URL 以 `/v1` 结尾、无多余路径 |
| 请求超时 | 网络问题或模型响应慢 | 增大 `timeout` 值，或切换服务商 |
| `JSONDecodeError` | 模型返回格式异常 | 重启服务重试，或临时关闭 `fallback_enabled` 查看原始错误 |
| 前端显示"AI 服务离线" | Python 服务未启动 | 运行 `start.bat` 或手动启动 `backend-python/main.py` |

---

## 8. 字段变更历史

| 版本 | 日期 | 变更内容 |
|---|---|---|
| 1.0 | 2026-06-02 | 初始版本：7 个核心字段 + 多服务商示例 |
| 1.1 | 2026-06-02 | 新增 `api_style` 字段，支持 Chat Completions API（DeepSeek / Qwen / Kimi 等） |
