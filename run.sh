#!/bin/bash
# ============================================================
# Supply Chain BI — 统一入口
# ============================================================
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log_info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

port_in_use() { netstat -ano 2>/dev/null | grep ":$1 " | grep -q LISTENING; }

detect_python() {
  # Anaconda priority
  if [ -f "D:/ProgramData/anaconda3/python.exe" ]; then echo "D:/ProgramData/anaconda3/python.exe"
  elif command -v python3 &>/dev/null; then echo "python3"
  elif command -v python &>/dev/null; then echo "python"
  elif [ -f "/d/Users/13937/anaconda3/python.exe" ]; then echo "/d/Users/13937/anaconda3/python.exe"
  else echo ""; fi
}

MYSQL_CLI=""
detect_mysql() {
  if command -v mysql &>/dev/null; then MYSQL_CLI="mysql"
  elif [ -f "/c/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe" ]; then MYSQL_CLI="/c/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe"
  fi
}

# ═══════════════════════════════════════════════════════════
#  功能函数
# ═══════════════════════════════════════════════════════════

cmd_start() {
  echo ""; echo -e "${CYAN}>>> 生产模式启动${NC}"; echo ""

  if [ -d "$ROOT/ui/dist" ]; then
    log_ok "前端 dist 已存在，跳过构建"
  else
    log_info "构建前端..."
    cd "$ROOT/ui"
    [ ! -d "node_modules" ] && npm install --silent
    npm run build
    cd "$ROOT"
    log_ok "前端构建完成"
  fi

  if port_in_use 8000; then
    log_ok "Python AI 已在运行"
  else
    PYTHON=$(detect_python)
    if [ -z "$PYTHON" ]; then log_error "找不到 Python"; else
      log_info "启动 Python AI..."
      cd "$ROOT/backend-python"
      $PYTHON main.py --port 8000 &
      sleep 2; cd "$ROOT"
      log_ok "Python AI 就绪 (port 8000)"
    fi
  fi

  if port_in_use 3000; then
    log_ok "Node.js 已在运行"
  else
    log_info "启动 Node.js 后端..."
    cd "$ROOT/backend-node"
    [ ! -d "node_modules" ] && npm install --silent
    node server.js &
    sleep 2; cd "$ROOT"
    log_ok "Node.js 就绪 (port 3000)"
  fi

  echo ""
  echo -e "  ${GREEN}前端:${NC}  http://localhost:3000"
  echo -e "  ${GREEN}API:${NC}   http://localhost:3000/api"
  echo -e "  ${GREEN}AI:${NC}   http://localhost:8000/docs"
  echo ""
}

cmd_dev() {
  echo ""; echo -e "${CYAN}>>> 开发模式（热重载）${NC}"; echo ""

  cleanup() { echo ""; log_info "停止所有服务..."; kill $(jobs -p) 2>/dev/null; exit 0; }
  trap cleanup SIGINT SIGTERM

  log_info "启动 Node.js 后端 (port 3000)..."
  cd "$ROOT/backend-node"
  [ ! -d "node_modules" ] && npm install --silent
  node server.js &
  cd "$ROOT"

  PYTHON=$(detect_python)
  if [ -z "$PYTHON" ]; then log_error "找不到 Python"; else
    log_info "启动 Python AI (port 8000)..."
    cd "$ROOT/backend-python"
    $PYTHON main.py --port 8000 &
    cd "$ROOT"
  fi

  log_info "启动前端 Vite (port 5173)..."
  cd "$ROOT/ui"
  [ ! -d "node_modules" ] && npm install --silent
  npm run dev &
  cd "$ROOT"

  sleep 3
  echo ""
  echo -e "  ${GREEN}前端 (HMR):${NC} http://localhost:5173"
  echo -e "  ${GREEN}API:${NC}        http://localhost:3000/api"
  echo -e "  ${GREEN}AI:${NC}         http://localhost:8000/docs"
  echo -e "  ${GREEN}登录:${NC}        admin / 123456"
  echo -e "  ${RED}按 Ctrl+C 停止${NC}"
  echo ""

  wait
}

cmd_stop() {
  echo ""; echo -e "${CYAN}>>> 停止所有服务${NC}"; echo ""
  for port in 3000 8000 5173; do
    pids=$(netstat -ano 2>/dev/null | grep ":$port " | grep LISTENING | awk '{print $5}' | sort -u)
    if [ -z "$pids" ]; then
      log_ok "端口 $port — 未运行"
    else
      for pid in $pids; do
        log_info "停止 PID $pid (port $port)..."
        powershell.exe -Command "Stop-Process -Id $pid -Force" 2>/dev/null || true
      done
      sleep 0.5
      log_ok "端口 $port — 已停止"
    fi
  done
  echo ""
}

cmd_setup() {
  echo ""; echo -e "${CYAN}>>> MySQL 数据库初始化${NC}"; echo ""

  detect_mysql
  if [ -z "$MYSQL_CLI" ]; then
    log_error "找不到 MySQL 客户端"; return
  fi

  read -p "MySQL 用户名 [root]: " MYSQL_USER; MYSQL_USER=${MYSQL_USER:-root}
  read -sp "MySQL 密码: " MYSQL_PASS; echo ""

  log_info "测试连接..."
  if ! "$MYSQL_CLI" -u "$MYSQL_USER" -p"$MYSQL_PASS" -e "SELECT 1" 2>/dev/null >/dev/null; then
    log_error "连接失败，请检查用户名/密码"; return
  fi
  log_ok "连接成功"

  log_info "创建数据库..."
  "$MYSQL_CLI" -u "$MYSQL_USER" -p"$MYSQL_PASS" -e "CREATE DATABASE IF NOT EXISTS supply_chain_bi DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null
  log_ok "数据库 supply_chain_bi 就绪"

  log_info "构建星型模型表..."
  "$MYSQL_CLI" -u "$MYSQL_USER" -p"$MYSQL_PASS" --default-character-set=utf8mb4 supply_chain_bi < "$ROOT/database/build_database.sql" 2>/dev/null
  log_ok "星型模型表已创建"

  log_info "创建 douyin_sales 表..."
  "$MYSQL_CLI" -u "$MYSQL_USER" -p"$MYSQL_PASS" --default-character-set=utf8mb4 supply_chain_bi < "$ROOT/database/douyin_sales.sql" 2>/dev/null
  log_ok "douyin_sales 表已创建"

  log_info "写入 .env..."
  cat > "$ROOT/backend-node/.env" << ENVEOF
DB_HOST=localhost
DB_PORT=3306
DB_USER=$MYSQL_USER
DB_PASSWORD='$MYSQL_PASS'
DB_NAME=supply_chain_bi

PORT=3000

AI_SERVICE_URL=http://localhost:8000
ENVEOF
  log_ok ".env 已更新"

  read -p "从 CSV 导入数据？(y/n) " -n 1 -r; echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    PYTHON=$(detect_python)
    if [ -n "$PYTHON" ]; then
      log_info "导入中（可能需要几分钟）..."
      cd "$ROOT/data/scripts"
      $PYTHON import_to_mysql.py
      cd "$ROOT"
      log_ok "数据导入完成"
    fi
  fi
  echo ""
}

cmd_build() {
  echo ""; echo -e "${CYAN}>>> 构建前端${NC}"; echo ""
  cd "$ROOT/ui"
  [ ! -d "node_modules" ] && npm install --silent
  npm run build
  cd "$ROOT"
  log_ok "前端已构建 -> ui/dist/"
  echo ""
}

# ═══════════════════════════════════════════════════════════
#  交互菜单
# ═══════════════════════════════════════════════════════════

show_menu() {
  clear 2>/dev/null || true
  echo ""
  echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║       Supply Chain BI — 供应链 BI       ║${NC}"
  echo -e "${CYAN}╠══════════════════════════════════════════╣${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}1${NC}. 启动服务 (生产模式)              ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}2${NC}. 启动服务 (开发模式·热重载)       ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}3${NC}. 停止所有服务                      ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}4${NC}. MySQL 数据库初始化                 ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}5${NC}. 仅构建前端                         ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}0${NC}. 退出                               ${CYAN}║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
  echo ""
}

# ── 主循环 ──
while true; do
  show_menu
  read -p "请选择 [0-5]: " choice
  case "$choice" in
    1) cmd_start ;;
    2) cmd_dev ;;
    3) cmd_stop ;;
    4) cmd_setup ;;
    5) cmd_build ;;
    0) echo ""; echo -e "${GREEN}再见！${NC}"; exit 0 ;;
    *) echo -e "${RED}无效选择，请重试${NC}"; sleep 1 ;;
  esac
  echo ""
  read -p "按 Enter 返回菜单..."
done
