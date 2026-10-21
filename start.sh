#!/usr/bin/env bash
# Start the local SYC filing presentation.
# Installs dependencies on first run, then launches the offline fixture app.
set -euo pipefail

cd "$(dirname "$0")"

# 1. Dependencies
if [ ! -d node_modules ]; then
  echo "→ Installing npm dependencies…"
  npm install
fi

# 2. Run — no .env.local, API key, browser download, or network is required.
echo "→ Starting local dev server at http://127.0.0.1:5555…"
npm run dev -- --host 127.0.0.1 --port 5555 &
dev_pid=$!

cleanup() {
  if kill -0 "$dev_pid" 2>/dev/null; then
    echo
    echo "→ Stopping dev server (PID $dev_pid)…"
    kill "$dev_pid" 2>/dev/null || true
    wait "$dev_pid" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM
wait "$dev_pid"
