# API 文档

本目录包含供应链BI系统的API接口文档。

## 文档结构

- [Node.js后端API](./node-api.md) - 业务逻辑和数据管理接口
- [Python后端API](./python-api.md) - AI分析服务接口
- [前端调用示例](./frontend-examples.md) - 前端如何调用这些API

## 快速开始

### Node.js后端 (端口3000)
```bash
cd backend-node
npm start
```

### Python后端 (端口8000)
```bash
cd backend-python
python main.py
```

### 前端开发服务器 (端口5173)
```bash
cd frontend
npm run dev
```

## API概览

系统采用双后端架构：
- **Node.js后端**: 处理用户认证、数据管理、业务逻辑
- **Python后端**: 提供AI分析能力（预测、异常检测、风险评估）

前端通过Node.js后端统一访问所有服务，Node.js在需要AI功能时会调用Python后端。
