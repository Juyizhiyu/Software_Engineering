---
alwaysApply: true
scene: git_message
---

使用中文生成提交信息。

## 格式

```
<type>(<scope>): <subject>
```

## type 可选值

| type     | 说明                   |
| -------- | ---------------------- |
| feat     | 新功能                 |
| fix      | 修复缺陷               |
| refactor | 重构（不改变功能）     |
| style    | 样式调整（不影响逻辑） |
| docs     | 文档变更               |
| chore    | 构建/配置/工具变更     |

## scope 规则

保留主要范围和子范围，用 `/` 分隔：

- `ui/overview` — 前端总览页
- `ui/data-center` — 前端数据中心
- `ui/operations` — 前端业务分析
- `ui/risk-center` — 前端风险中心
- `ui/ai-studio` — 前端 AI 工作台
- `ui/layout` — 前端布局/通用组件
- `ui/styles` — 前端样式
- `ui/api` — 前端 API 层
- `ui/config` — 前端配置/基础设施
- `backend-node` — Node.js 后端
- `backend-python` — Python AI 后端
- `project` — 项目级变更

## 示例

```
feat(ui/overview): 添加销售走势柱状-折线混合图及对数切换
fix(ui/layout): 修复侧边栏折叠后宽度未更新
refactor(ui/components): 将表格组件从 common/ 移至 overview/
style(ui/styles): 调整深色模式下的卡片阴影
chore(project): 添加一键启动脚本 start.sh
```
