#!/bin/bash
# ============================================================
# Supply Chain BI — 一键停止脚本
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ---------- 根据端口杀进程 ----------
kill_port() {
  local port=$1
  local name=$2
  local pids=$(netstat -ano 2>/dev/null | grep ":$port " | grep LISTENING | awk '{print $5}' | sort -u)

  if [ -z "$pids" ]; then
    log_ok "$name (端口 $port) 未运行"
    return 0
  fi

  for pid in $pids; do
    log_info "停止 $name (PID $pid)..."
    powershell.exe -Command "Stop-Process -Id $pid -Force" 2>/dev/null
  done
  sleep 1

  # 验证
  if netstat -ano 2>/dev/null | grep ":$port " | grep -q LISTENING; then
    log_error "$name (端口 $port) 停止失败"
    return 1
  else
    log_ok "$name (端口 $port) 已停止"
  fi
}

# ===================== 主流程 =====================
echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}  Supply Chain BI — 停止中...${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""

kill_port 3000 "Node.js 后端"
kill_port 8000 "Python AI"
kill_port 3306 "MySQL"

echo ""
echo -e "${GREEN}  所有服务已停止。${NC}"
echo ""
