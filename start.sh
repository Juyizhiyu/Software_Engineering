#!/bin/bash
# ============================================================
# Supply Chain BI — 一键启动脚本 (Git Bash / WSL / msys2)
# ============================================================
set +e  # 单个服务失败不影响其他服务启动

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
MYSQL_BIN="/c/Program Files/MySQL/MySQL Server 8.0/bin/mysqld.exe"
MYSQL_CLI="/c/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe"
MYSQL_DATA="$HOME/mysql-data"
PYTHON_EXE="/d/Users/13937/anaconda3/python.exe"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ---------- helper: 检查端口是否被占用 ----------
port_in_use() {
  netstat -ano 2>/dev/null | grep ":$1 " | grep -q LISTENING
}

# ---------- 1. MySQL ----------
start_mysql() {
  if port_in_use 3306; then
    log_ok "MySQL 已在运行 (端口 3306)"
    return 0
  fi

  log_info "启动 MySQL..."

  if [ ! -f "$MYSQL_BIN" ]; then
    log_error "找不到 mysqld.exe，路径: $MYSQL_BIN"
    return 1
  fi

  if [ ! -d "$MYSQL_DATA" ]; then
    log_info "首次初始化 MySQL data 目录..."
    "$MYSQL_BIN" --initialize-insecure --datadir="$MYSQL_DATA" --console 2>&1 | tail -5
  fi

  "$MYSQL_BIN" --standalone --datadir="$MYSQL_DATA" --port=3306 &
  sleep 3

  # 等待 MySQL 就绪
  for i in $(seq 1 10); do
    if "$MYSQL_CLI" -u root -p123456 -e "SELECT 1" 2>/dev/null >/dev/null; then
      log_ok "MySQL 已就绪 (端口 3306)"
      return 0
    fi
    sleep 1
  done

  # 可能密码不对（首次初始化后 root 无密码）
  if "$MYSQL_CLI" -u root -e "SELECT 1" 2>/dev/null >/dev/null; then
    log_info "首次设置 root 密码..."
    "$MYSQL_CLI" -u root -e "
      ALTER USER 'root'@'localhost' IDENTIFIED BY '123456';
      FLUSH PRIVILEGES;
    " 2>/dev/null
    log_ok "MySQL 已就绪 (端口 3306, 密码已设置)"
    return 0
  fi

  log_error "MySQL 启动失败，请检查日志"
  return 1
}

# ---------- 2. Python AI ----------
start_python_ai() {
  if port_in_use 8000; then
    log_ok "Python AI 服务已在运行 (端口 8000)"
    return 0
  fi

  log_info "启动 Python AI 服务..."
  cd "$ROOT_DIR/backend-python"

  if [ -f "$PYTHON_EXE" ]; then
    "$PYTHON_EXE" -m uvicorn main:app --port 8000 &
  elif command -v python &>/dev/null; then
    python -m uvicorn main:app --port 8000 &
  else
    log_error "找不到 Python，请修改 PYTHON_EXE 变量"
    return 1
  fi

  sleep 2
  if port_in_use 8000; then
    log_ok "Python AI 服务已就绪 (端口 8000)"
  else
    log_error "Python AI 服务启动失败"
    return 1
  fi
  cd "$ROOT_DIR"
}

# ---------- 3. Node.js 后端 ----------
start_node_backend() {
  if port_in_use 3000; then
    log_ok "Node.js 后端已在运行 (端口 3000)"
    return 0
  fi

  log_info "启动 Node.js 后端..."
  cd "$ROOT_DIR/backend-node"

  # 检查依赖
  if [ ! -d "node_modules" ]; then
    log_info "安装后端依赖..."
    npm install --silent
  fi

  node server.js &
  sleep 2

  if port_in_use 3000; then
    log_ok "Node.js 后端已就绪 (端口 3000)"
  else
    log_error "Node.js 后端启动失败"
    return 1
  fi
  cd "$ROOT_DIR"
}

# ---------- 4. 前端构建 ----------
build_frontend() {
  if [ -d "$ROOT_DIR/frontend/dist" ]; then
    log_ok "前端 dist 已存在，跳过构建"
    return 0
  fi

  log_info "构建前端..."
  cd "$ROOT_DIR/frontend"

  if [ ! -d "node_modules" ]; then
    npm install --silent
  fi

  npm run build
  log_ok "前端构建完成"
  cd "$ROOT_DIR"
}

# ===================== 主流程 =====================
echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}  Supply Chain BI — 启动中...${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""

start_mysql
build_frontend
start_python_ai
start_node_backend

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${GREEN}  全部服务已启动！${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""
echo -e "  ${YELLOW}前端页面:${NC}       http://localhost:3000"
echo -e "  ${YELLOW}Node.js API:${NC}    http://localhost:3000/api"
echo -e "  ${YELLOW}健康检查:${NC}       http://localhost:3000/api/health"
echo -e "  ${YELLOW}Python AI 文档:${NC} http://localhost:8000/docs"
echo ""
echo -e "  运行 ${GREEN}./stop.sh${NC} 停止所有服务"
echo ""
