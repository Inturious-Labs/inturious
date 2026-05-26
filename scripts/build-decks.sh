#!/bin/bash
#
# Build sli.dev decks (selective)
# Only builds decks that have changed since the base ref
#
# Layout:
#   decks/<slug>/src/    -> source (slides.md, package.json, public/)
#   decks/<slug>/        -> built output (index.html, assets/) — served at /decks/<slug>/
#
# Decks whose folder name starts with "_" (e.g. _template) are skipped.
#
# Usage:
#   ./build-decks.sh              # Build all decks
#   ./build-decks.sh origin/main  # Only build decks changed since origin/main
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
DECKS_DIR="$ROOT_DIR/decks"
BASE_REF="${1:-}"

echo "🎯 Building decks..."
echo "Decks directory: $DECKS_DIR"
if [ -n "$BASE_REF" ]; then
  echo "Selective mode: comparing against $BASE_REF"
fi

DECKS_BUILT=0
DECKS_SKIPPED=0

has_changes() {
  local path="$1"
  if [ -z "$BASE_REF" ]; then
    return 0
  fi
  git diff --quiet "$BASE_REF" -- "$path" 2>/dev/null && return 1 || return 0
}

for deck_dir in "$DECKS_DIR"/*/; do
  deck_name=$(basename "$deck_dir")

  # Skip underscore-prefixed entries (e.g. _template)
  case "$deck_name" in
    _*) echo "⏭️  $deck_name: underscore-prefixed, skipping"; continue ;;
  esac

  src_dir="$deck_dir/src"

  if [ ! -d "$src_dir" ]; then
    echo "⚠️  $deck_name: no src/ folder, skipping"
    continue
  fi

  if [ ! -f "$src_dir/slides.md" ]; then
    echo "⚠️  $deck_name: src/ exists but no slides.md, skipping"
    continue
  fi

  # Skip if no changes since base ref and a build already exists
  if [ -f "$deck_dir/index.html" ] && ! has_changes "$src_dir"; then
    echo "⏭️  $deck_name: no changes, skipping"
    DECKS_SKIPPED=$((DECKS_SKIPPED + 1))
    continue
  fi

  echo ""
  echo "📦 Building deck: $deck_name"

  BASE_PATH="/decks/$deck_name/"
  echo "   Building with base: $BASE_PATH"
  (cd "$src_dir" && pnpm exec slidev build --base "$BASE_PATH" --out ..)

  # Inject Google Analytics into the built deck
  DECK_INDEX="$deck_dir/index.html"
  if [ -f "$DECK_INDEX" ]; then
    echo "   Injecting Google Analytics..."
    sed -i.bak 's|</head>|<script src="/scripts/analytics.js" defer></script>\n</head>|' "$DECK_INDEX"
    rm -f "$DECK_INDEX.bak"
  fi

  echo "✅ $deck_name built successfully"
  DECKS_BUILT=$((DECKS_BUILT + 1))
done

echo ""
echo "📊 Summary: $DECKS_BUILT built, $DECKS_SKIPPED skipped"
