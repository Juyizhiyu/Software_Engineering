#!/bin/bash

# 供应链 BI 系统一键启动脚本

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "========================================="
echo "  供应链 BI 系统 - 启动中..."
echo "========================================="

# 清理函数：退出时杀掉所有后台进程
cleanup() {
    echo ""
    echo "正在停止所有服务..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# 启动 Node.js 后端
echo "[1/3] 启动 Node.js 后端 (端口 3000)..."
cd "$PROJECT_DIR/backend-node" && node server.js &
PID_NODE=$!

# 启动 Python AI 后端
echo "[2/3] 启动 Python AI 后端 (端口 8000)..."
cd "$PROJECT_DIR/backend-python" && uv run uvicorn main:app --reload --port 8000 &
PID_PYTHON=$!

# 启动前端
echo "[3/3] 启动前端 (端口 5173)..."
cd "$PROJECT_DIR/ui" && npm run dev &
PID_FRONTEND=$!

# 等待服务启动
sleep 3

echo ""
echo "========================================="
echo "  所有服务已启动！"
echo "========================================="
echo "  前端:        http://localhost:5173"
echo "  Node 后端:   http://localhost:3000"
echo "  Python 后端: http://localhost:8000"
echo "  登录账号:    admin / 123456"
echo "========================================="
echo "  按 Ctrl+C 停止所有服务"
echo "========================================="

# 等待任意进程退出
wait
