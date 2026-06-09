#!/usr/bin/env bash
# Refresh the cloudflared quick tunnel and repoint the MikroTik captive login.html at it.
# Quick-tunnel URLs change on every restart, so this does the whole dance in one shot:
#   1) (re)start cloudflared → http://localhost:3001
#   2) grab the fresh https://*.trycloudflare.com URL
#   3) rewrite login.html (root + flash/aida) PORTAL to it
#   4) (optional) FTP-push login.html to the MikroTik if MIKROTIK_PW is set
#
# Usage:
#   infra/mikrotik/refresh-tunnel.sh                          # update files only
#   MIKROTIK_PW=••• infra/mikrotik/refresh-tunnel.sh          # + push to 192.168.88.1
#   MIKROTIK_HOST=192.168.88.1 MIKROTIK_USER=admin MIKROTIK_PW=••• HOTEL=esken-bodrum ...
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
GUEST_PORT="${GUEST_PORT:-3001}"
HOTEL="${HOTEL:-esken-bodrum}"

echo "→ restarting cloudflared (localhost:${GUEST_PORT})…"
pkill -f 'cloudflared tunnel' 2>/dev/null || true
sleep 1
LOG="$(mktemp)"
# --protocol http2 forces TCP/443 instead of QUIC/UDP-7844, which flaps on restrictive
# networks (the MikroTik path drops UDP) and causes intermittent 502s on the captive page.
nohup cloudflared tunnel --protocol http2 --url "http://127.0.0.1:${GUEST_PORT}" >"$LOG" 2>&1 &

URL=""
for _ in $(seq 1 30); do
  URL="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | head -1 || true)"
  [ -n "$URL" ] && break
  sleep 1
done
[ -z "$URL" ] && { echo "✗ tunnel URL not found — check: $LOG"; exit 1; }
echo "✓ tunnel: ${URL}"

PORTAL="${URL}/${HOTEL}"
for f in "$ROOT/infra/mikrotik/login.html" "$ROOT/infra/mikrotik/flash/aida/login.html"; do
  sed -i '' -E "s|var PORTAL = \"[^\"]+\";|var PORTAL = \"${PORTAL}\";|" "$f"
done
echo "✓ login.html → ${PORTAL}"

if [ -n "${MIKROTIK_PW:-}" ]; then
  HOST="${MIKROTIK_HOST:-192.168.88.1}"
  USER="${MIKROTIK_USER:-admin}"
  echo "→ pushing login.html to MikroTik ${HOST}…"
  curl -s -T "$ROOT/infra/mikrotik/flash/aida/login.html" \
    "ftp://${USER}:${MIKROTIK_PW}@${HOST}/flash/aida/login.html" --ftp-create-dirs &&
    echo "✓ pushed. Now clear the hotspot session and reconnect the device." ||
    echo "✗ FTP push failed — upload manually."
else
  echo "ℹ set MIKROTIK_PW to auto-push, or upload infra/mikrotik/flash/aida/login.html via WinBox/FTP."
fi
