#!/bin/bash
# ============================================================
# Yaksha FAQ Portal — Run All
# Usage: ./run.sh
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPT_DIR"

FONT="\033[94m"
OK="\033[92m"
WARN="\033[93m"
ERROR="\033[91m"
BOLD="\033[1m"
RESET="\033[0m"

log()   { echo -e "${FONT}[yaksha]${RESET} $1"; }
ok()    { echo -e "${OK}[✔]${RESET} $1"; }
warn()  { echo -e "${WARN}[!]${RESET} $1"; }
die()   { echo -e "${ERROR}[✘]${RESET} $1" >&2; exit 1; }

# ── Helpers ────────────────────────────────────────────────

stop_port() {
  local port=$1
  local pid=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pid" ]; then
    warn "Port $port in use — killing PID $pid"
    kill $pid 2>/dev/null || true
    sleep 1
  fi
}

# Checks HTTP response code (200 = up)
is_http_up() {
  curl -sf --max-time 3 "$1" > /dev/null 2>&1
}

# Checks health endpoint for "db":"connected" in JSON
is_db_connected() {
  local response
  response=$(curl -sf --max-time 5 "http://localhost:6767/api/health" 2>/dev/null)
  echo "$response" | grep -q '"db":"connected"'
}

# ── Banner ─────────────────────────────────────────────────

echo ""
echo -e "${BOLD}Yaksha FAQ Portal${RESET}"
echo "============================================="
echo ""

# ── Prerequisites ──────────────────────────────────────────

if ! command -v node &> /dev/null; then
  die "Node.js is not installed"
fi

BACKEND="$ROOT/backend"

if [ ! -f "$BACKEND/.env" ]; then
  warn ".env missing — creating from .env.example..."
  if [ -f "$BACKEND/.env.example" ]; then
    cp "$BACKEND/.env.example" "$BACKEND/.env"
    log "Created backend/.env from .env.example"
  fi
  log "Edit backend/.env before running."
  log "Add: JWT_SECRET, MONGODB_URI"
  exit 1
fi

# Warn about JWT_SECRET if still placeholder
if grep -q "JWT_SECRET=yaksha" "$BACKEND/.env" 2>/dev/null; then
  warn "backend/.env still has placeholder JWT_SECRET"
  log "Change it to a real secret before running"
fi

# ── Backend ────────────────────────────────────────────────

if is_http_up "http://localhost:6767/api/health"; then
  ok "Backend already running on :6767"
else
  stop_port 6767

  log "Starting backend..."
  "$SCRIPT_DIR/scripts/backend.sh" &
  sleep 3
fi

# Wait for DB connection (up to 20s)
log "Checking MongoDB connection..."
DB_READY=false
for i in $(seq 1 10); do
  if is_db_connected; then
    DB_READY=true
    break
  fi
  sleep 2
done

if $DB_READY; then
  ok "MongoDB connected"
else
  warn "MongoDB NOT connected — check backend/.env credentials"
  log "Health check: http://localhost:6767/api/health"
  log "Common causes: wrong password, IP not whitelisted in Atlas, cluster name typo"
fi

# ── Frontend ───────────────────────────────────────────────

if is_http_up "http://localhost:5173"; then
  ok "Frontend already running on :5173"
else
  stop_port 5173
  log "Starting frontend..."
  "$SCRIPT_DIR/scripts/frontend.sh" &
  sleep 2
fi

# ── Done ───────────────────────────────────────────────────

echo ""
echo -e "${BOLD}=============================================${RESET}"

if $DB_READY; then
  ok "Yaksha FAQ Portal is running!"
else
  warn "Portal is running but MongoDB is disconnected"
fi

echo ""
echo -e "  Frontend  ${FONT}→${RESET}  http://localhost:5173"
echo -e "  Backend   ${FONT}→${RESET}  http://localhost:6767"
echo -e "  Health    ${FONT}→${RESET}  http://localhost:6767/api/health"
echo ""
echo "  Ctrl+C to stop all services"
echo ""

wait
trap 'echo ""; log "Stopping..."; kill %1 %2 2>/dev/null || true; exit 0' INT