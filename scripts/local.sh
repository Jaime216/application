#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

install_if_needed() {
  local target_dir="$1"

  if [[ ! -d "$target_dir/node_modules" ]]; then
    echo "[local] Instalando dependencias en ${target_dir}"
    npm install --prefix "$target_dir"
  fi
}

install_if_needed "$ROOT_DIR/backend"
install_if_needed "$ROOT_DIR/frontend"

echo "[local] Generando datos de demo"
npm run seed --prefix "$ROOT_DIR/backend"

echo "[local] Arrancando frontend y backend"
bash "$ROOT_DIR/scripts/dev.sh"