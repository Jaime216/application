#!/usr/bin/env bash

set -euo pipefail

BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
LOCK_FILE="${TMPDIR:-/tmp}/spa-app-dev.lock"

if command -v flock >/dev/null 2>&1; then
  exec 9>"$LOCK_FILE"
  if ! flock -n 9; then
    echo "[dev] Ya hay otra instancia de dev.sh ejecutandose. Cierra la anterior antes de iniciar otra."
    exit 1
  fi
fi

collect_port_pids() {
  local port="$1"
  local pids=""

  if command -v ss >/dev/null 2>&1; then
    pids="$(ss -ltnp 2>/dev/null | awk -v p=":${port}" '$4 ~ p { while (match($0, /pid=[0-9]+/)) { print substr($0, RSTART+4, RLENGTH-4); $0 = substr($0, RSTART+RLENGTH) } }' | sort -u | xargs)"
  fi

  if [[ -z "$pids" ]] && command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | sort -u | xargs)"
  fi

  echo "$pids"
}

kill_listeners_on_port() {
  local port="$1"
  local pids
  pids="$(collect_port_pids "$port")"

  if [[ -z "$pids" ]]; then
    echo "[dev] Puerto $port libre"
    return
  fi

  echo "[dev] Liberando puerto $port (PID: $pids)"
  for pid in $pids; do
    kill "$pid" 2>/dev/null || true
  done

  sleep 0.2

  pids="$(collect_port_pids "$port")"
  if [[ -n "$pids" ]]; then
    echo "[dev] Forzando cierre en puerto $port (PID: $pids)"
    for pid in $pids; do
      kill -9 "$pid" 2>/dev/null || true
    done
  fi
}

prepare_ports() {
  # 5174/5175 suelen quedar ocupados cuando Vite reintenta por conflictos previos.
  local ports=("$BACKEND_PORT" "$FRONTEND_PORT" 5174 5175)
  for port in "${ports[@]}"; do
    kill_listeners_on_port "$port"
  done
}

cleanup() {
  if [[ -n "${backend_pid:-}" ]]; then
    kill "$backend_pid" 2>/dev/null || true
  fi

  if [[ -n "${frontend_pid:-}" ]]; then
    kill "$frontend_pid" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

prepare_ports

npm run dev --prefix backend &
backend_pid=$!

npm run dev --prefix frontend &
frontend_pid=$!

wait -n "$backend_pid" "$frontend_pid"