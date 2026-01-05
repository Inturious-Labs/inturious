#!/bin/bash
#
# Build sli.dev decks (selective)
# Only builds decks that have changed since the base ref
#
# Usage:
#   ./build-decks.sh              # Build all decks (no selective)
#   ./build-decks.sh origin/main  # Only build decks changed since origin/main
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PRODUCTS_DIR="$ROOT_DIR/products"
BASE_REF="${1:-}"

echo "🎯 Building decks..."
echo "Products directory: $PRODUCTS_DIR"
if [ -n "$BASE_REF" ]; then
  echo "Selective mode: comparing against $BASE_REF"
fi

# Track stats
DECKS_BUILT=0
DECKS_SKIPPED=0

# Check if a path has changes compared to base ref
has_changes() {
  local path="$1"
  if [ -z "$BASE_REF" ]; then
    return 0  # No base ref = always build
  fi
  # Check if any files changed in this path
  git diff --quiet "$BASE_REF" -- "$path" 2>/dev/null && return 1 || return 0
}

# Find all product directories with a slides-src folder
for product_dir in "$PRODUCTS_DIR"/*/; do
  product_name=$(basename "$product_dir")
  slides_dir="$product_dir/slides-src"
  deck_dir="$product_dir/deck"

  # Check if slides-src folder exists
  if [ ! -d "$slides_dir" ]; then
    echo "⏭️  $product_name: no slides-src/ folder, skipping"
    continue
  fi

  # Check if slides.md exists
  if [ ! -f "$slides_dir/slides.md" ]; then
    echo "⚠️  $product_name: slides-src/ exists but no slides.md, skipping"
    continue
  fi

  # Check if build is needed
  if [ -d "$deck_dir" ] && ! has_changes "$slides_dir"; then
    echo "⏭️  $product_name: no changes, skipping"
    DECKS_SKIPPED=$((DECKS_SKIPPED + 1))
    continue
  fi

  echo ""
  echo "📦 Building deck for: $product_name"

  # Build with correct base path (dependencies installed via pnpm at root)
  BASE_PATH="/products/$product_name/deck/"
  echo "   Building with base: $BASE_PATH"
  (cd "$slides_dir" && pnpm exec slidev build --base "$BASE_PATH" --out ../deck)

  echo "✅ $product_name deck built successfully"
  DECKS_BUILT=$((DECKS_BUILT + 1))
done

echo ""
echo "📊 Summary: $DECKS_BUILT built, $DECKS_SKIPPED skipped"
