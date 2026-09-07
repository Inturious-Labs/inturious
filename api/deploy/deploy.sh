#!/usr/bin/env bash
#
# Push the working tree to Linode Tokyo and restart the service.
#
#   ./deploy/deploy.sh
#
# Assumes first-time setup (see deploy/SETUP.md) has already run: node installed,
# .env present on the server, systemd unit and nginx vhost in place.

set -euo pipefail

HOST="${INTURIOUS_API_HOST:-linode-tokyo-root}"
REMOTE_DIR="/home/clayton/inturious-api"
SERVICE="inturious-api"

cd "$(dirname "$0")/.."

if [[ -n "$(git status --porcelain)" ]]; then
  echo "warning: working tree is dirty; deploying it as-is" >&2
fi

echo "→ syncing to $HOST:$REMOTE_DIR"
rsync -az --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.env' \
  --exclude '*.db' --exclude '*.db-shm' --exclude '*.db-wal' \
  ./ "$HOST:$REMOTE_DIR/"

echo "→ installing production dependencies"
ssh "$HOST" "cd $REMOTE_DIR && npm ci --omit=dev --no-audit --no-fund"

echo "→ fixing ownership"
ssh "$HOST" "chown -R clayton:clayton $REMOTE_DIR"

echo "→ applying migrations"
ssh "$HOST" "cd $REMOTE_DIR && sudo -u clayton env \$(grep -v '^#' .env | xargs) npm run migrate"

echo "→ restarting $SERVICE"
ssh "$HOST" "systemctl restart $SERVICE && sleep 2 && systemctl is-active $SERVICE"

echo "→ health check"
ssh "$HOST" "curl -fsS http://127.0.0.1:3001/health && echo"

echo "done"
