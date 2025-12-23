#!/bin/bash
#
# Build all sli.dev pitch decks
# Finds all products with a deck/ folder and builds them to pitch/
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PRODUCTS_DIR="$ROOT_DIR/products"

echo "🎯 Building pitch decks..."
echo "Products directory: $PRODUCTS_DIR"

# Track if any decks were built
DECKS_BUILT=0

# Find all product directories with a deck folder
for product_dir in "$PRODUCTS_DIR"/*/; do
  product_name=$(basename "$product_dir")
  deck_dir="$product_dir/deck"

  # Skip _template
  if [ "$product_name" = "_template" ]; then
    echo "⏭️  Skipping _template"
    continue
  fi

  # Check if deck folder exists
  if [ ! -d "$deck_dir" ]; then
    echo "⏭️  $product_name: no deck/ folder, skipping"
    continue
  fi

  # Check if slides.md exists
  if [ ! -f "$deck_dir/slides.md" ]; then
    echo "⚠️  $product_name: deck/ exists but no slides.md, skipping"
    continue
  fi

  echo ""
  echo "📦 Building deck for: $product_name"

  # Install dependencies
  echo "   Installing dependencies..."
  (cd "$deck_dir" && npm install --silent)

  # Build with correct base path
  BASE_PATH="/products/$product_name/pitch/"
  echo "   Building with base: $BASE_PATH"
  (cd "$deck_dir" && npx slidev build --base "$BASE_PATH" --out ../pitch)

  echo "✅ $product_name deck built successfully"
  DECKS_BUILT=$((DECKS_BUILT + 1))
done

echo ""
if [ $DECKS_BUILT -eq 0 ]; then
  echo "ℹ️  No decks to build (no products have deck/ folders)"
else
  echo "🎉 Built $DECKS_BUILT deck(s) successfully"
fi
