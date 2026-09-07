#!/bin/bash
#
# Build all public sli.dev decks.
#
# Layout:
#   decks/<slug>/src/slides.md    source
#   decks/<slug>/                 built output (index.html, assets/, etc.)
#                                 served at /decks/<slug>/
#
# Decks whose folder name starts with "_" (e.g. _template, _pitch-for-geo-startup)
# are draft/internal and are skipped.
#
# Slidev is installed once at the project root (see root package.json).
# All decks share that single install; there are no per-deck node_modules.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
DECKS_DIR="$ROOT_DIR/decks"
SLIDEV="$ROOT_DIR/node_modules/.bin/slidev"

echo "🎯 Building decks..."

if [ ! -x "$SLIDEV" ]; then
  echo "❌ slidev not found at $SLIDEV — run 'pnpm install' at the project root first"
  exit 1
fi

DECKS_BUILT=0

for deck_dir in "$DECKS_DIR"/*/; do
  deck_name=$(basename "$deck_dir")

  case "$deck_name" in
    _*) echo "⏭️  $deck_name: draft, skipping"; continue ;;
  esac

  src_slides="$deck_dir/src/slides.md"

  if [ ! -f "$src_slides" ]; then
    echo "⚠️  $deck_name: no src/slides.md, skipping"
    continue
  fi

  echo ""
  echo "📦 Building deck: $deck_name"
  BASE_PATH="/decks/$deck_name/"
  echo "   Building with base: $BASE_PATH"

  "$SLIDEV" build "$src_slides" --base "$BASE_PATH" --out "$deck_dir"

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
echo "📊 Summary: $DECKS_BUILT built"
