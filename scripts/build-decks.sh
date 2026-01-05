#!/bin/bash
#
# Build all sli.dev decks
# Finds all products with a slides-src/ folder and builds them to deck/
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PRODUCTS_DIR="$ROOT_DIR/products"

echo "🎯 Building decks..."
echo "Products directory: $PRODUCTS_DIR"

# Track if any decks were built
DECKS_BUILT=0

# Find all product directories with a slides-src folder
for product_dir in "$PRODUCTS_DIR"/*/; do
  product_name=$(basename "$product_dir")
  slides_dir="$product_dir/slides-src"

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

  echo ""
  echo "📦 Building deck for: $product_name"

  # Install dependencies
  echo "   Installing dependencies..."
  (cd "$slides_dir" && npm install --silent)

  # Build with correct base path
  BASE_PATH="/products/$product_name/deck/"
  echo "   Building with base: $BASE_PATH"
  (cd "$slides_dir" && npx slidev build --base "$BASE_PATH" --out ../deck)

  echo "✅ $product_name deck built successfully"
  DECKS_BUILT=$((DECKS_BUILT + 1))
done

echo ""
if [ $DECKS_BUILT -eq 0 ]; then
  echo "ℹ️  No decks to build (no products have slides-src/ folders)"
else
  echo "🎉 Built $DECKS_BUILT deck(s) successfully"
fi
