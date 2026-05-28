#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[package-local] Building frontend..."
if [[ ! -d "$ROOT_DIR/frontend/node_modules" ]]; then
  echo "[package-local] Installing frontend dependencies"
  npm install --prefix "$ROOT_DIR/frontend"
fi

npm run build --prefix "$ROOT_DIR/frontend"

echo "[package-local] Copying frontend dist to backend/public"
rm -rf "$ROOT_DIR/backend/public"
mkdir -p "$ROOT_DIR/backend/public"
cp -r "$ROOT_DIR/frontend/dist/." "$ROOT_DIR/backend/public/"

OUT_TAR="$ROOT_DIR/spa-app-local-$(date +%Y%m%d%H%M%S).tar.gz"
echo "[package-local] Creating tarball $OUT_TAR (excluding node_modules and sqlite files)"
tar --exclude='node_modules' \
    --exclude='*.sqlite' \
    --exclude='*.sqlite3' \
    -czf "$OUT_TAR" -C "$ROOT_DIR" backend

echo "[package-local] Package created: $OUT_TAR"
