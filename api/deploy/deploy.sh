#!/usr/bin/env bash
#
# Deploy the API to Linode Tokyo from merged code and restart the service.
#
#   ./api/deploy/deploy.sh            deploy origin/main
#   ./api/deploy/deploy.sh --dry-run  show what would be synced, touch nothing remote
#
# What ships is always the api/ folder of origin/main, exported with `git archive`,
# never the working tree. So the running service always corresponds to a commit that
# exists on GitHub, and `cat REVISION` on the server says which one.
#
# Assumes first-time setup (see SETUP.md) has already run: node installed, .env present
# on the server, systemd unit and nginx vhost in place.

set -euo pipefail

HOST="${INTURIOUS_API_HOST:-linode-tokyo-root}"
REMOTE_DIR="/home/clayton/inturious-api"
SERVICE="inturious-api"
DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

cd "$(dirname "$0")/../.."   # repo root

# Refuse to deploy from anywhere but a clean, pushed main. The point of this script is
# that production traces to a commit on the server; skipping these checks defeats it.
if [[ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]]; then
  echo "error: deploy from main (currently on $(git rev-parse --abbrev-ref HEAD))" >&2
  exit 1
fi
if [[ -n "$(git status --porcelain)" ]]; then
  echo "error: working tree is dirty; commit or stash first" >&2
  exit 1
fi

echo "→ fetching origin/main"
git fetch -q origin main
if [[ -n "$(git log origin/main..HEAD --oneline)" ]]; then
  echo "error: main has commits that are not on origin; push first" >&2
  exit 1
fi

REV="$(git rev-parse origin/main)"
SHORT="$(git rev-parse --short origin/main)"

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

echo "→ exporting api/ at $SHORT"
git archive "$REV" api | tar -x -C "$STAGE"
echo "$REV" > "$STAGE/api/REVISION"

RSYNC_OPTS=(-az --delete
  --exclude 'node_modules'
  --exclude '.env'
  --exclude '*.db' --exclude '*.db-shm' --exclude '*.db-wal')

if $DRY_RUN; then
  echo "→ dry run: files that would change on $HOST:$REMOTE_DIR"
  rsync -n -v "${RSYNC_OPTS[@]}" "$STAGE/api/" "$HOST:$REMOTE_DIR/"
  echo "dry run complete (nothing deployed)"
  exit 0
fi

echo "→ syncing to $HOST:$REMOTE_DIR"
rsync "${RSYNC_OPTS[@]}" "$STAGE/api/" "$HOST:$REMOTE_DIR/"

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

echo "deployed $SHORT"
