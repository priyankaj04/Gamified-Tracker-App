#!/usr/bin/env bash
# Run KaizenArc API + Expo mobile app together.
# Usage: ./dev.sh            (interactive — Expo waits in foreground)
#        ./dev.sh --logs     (both background, tail both logs)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$ROOT/api"
MOBILE_DIR="$ROOT/Tracker-FE"
LOG_DIR="$ROOT/.logs"
mkdir -p "$LOG_DIR"

API_LOG="$LOG_DIR/api.log"
MOBILE_LOG="$LOG_DIR/mobile.log"

# ── prerequisites ──────────────────────────────────────
[[ -d "$API_DIR/node_modules" ]] || (echo "🔧 installing api deps…" && (cd "$API_DIR" && npm install))
[[ -d "$MOBILE_DIR/node_modules" ]] || (echo "🔧 installing mobile deps…" && (cd "$MOBILE_DIR" && npm install))

if [[ ! -f "$API_DIR/.env" ]]; then
  echo "⚠️  $API_DIR/.env missing. Copying .env.example — fill in your Supabase keys."
  cp "$API_DIR/.env.example" "$API_DIR/.env"
fi

# ── start API in background ────────────────────────────
echo "⚡ starting API → $API_LOG"
( cd "$API_DIR" && npm run dev ) >"$API_LOG" 2>&1 &
API_PID=$!

cleanup() {
  echo ""
  echo "🛑 stopping…"
  kill "$API_PID" 2>/dev/null || true
  if [[ -n "${MOBILE_PID:-}" ]]; then kill "$MOBILE_PID" 2>/dev/null || true; fi
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# ── start Expo ─────────────────────────────────────────
if [[ "${1:-}" == "--logs" ]]; then
  echo "📱 starting Expo (background) → $MOBILE_LOG"
  ( cd "$MOBILE_DIR" && npm start ) >"$MOBILE_LOG" 2>&1 &
  MOBILE_PID=$!
  echo ""
  echo "🚀 both running. Tailing logs (Ctrl+C to stop)."
  echo "   API:    tail -f $API_LOG"
  echo "   Mobile: tail -f $MOBILE_LOG"
  echo ""
  tail -F "$API_LOG" "$MOBILE_LOG"
else
  echo "📱 starting Expo in foreground (API logs → $API_LOG)"
  echo ""
  ( cd "$MOBILE_DIR" && npm start )
fi
