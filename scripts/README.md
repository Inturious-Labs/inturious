# Hero Image Generator

Programmatically generate hero images and social media preview images for Inturious Labs products with consistent UI styling.

## Features

- **Social Media Previews** (1200×630px) - Open Graph and Twitter Card compliant
- **Product Hero Images** (1920×600px) - Clean gradient backgrounds for product pages
- **Hero Images with Overlays** (1920×1080px) - Add quotes and attributions with dark overlays
- **Consistent UI Style** - Matches site's pastel gradient colors and dark theme
- **Configurable** - Uses `products-config.json` for easy customization

## Installation

```bash
pip install -r scripts/requirements.txt
```

## Usage

### Generate All Product Images

```bash
python scripts/generate_hero_images.py --all
```

This generates social previews and hero images for all products in `products-config.json`.

### Programmatic Usage

```python
from scripts.generate_hero_images import HeroImageGenerator

# Initialize generator
gen = HeroImageGenerator("scripts/products-config.json")

# Generate social media preview (1200×630)
gen.generate_social_preview(
    product_name="Readly",
    slogan="Fast, reliable, and privacy-focused QR code scanning",
    color_name="blue",
    output_path="img/products/readly-social.jpg"
)

# Generate product hero image (1920×600)
gen.generate_product_hero(
    product_name="Readly",
    tagline="Fast, reliable, and privacy-focused QR code scanning",
    color_name="mint",
    output_path="img/products/readly-hero.jpg"
)

# Generate hero with quote overlay (1920×1080)
gen.generate_hero_with_overlay(
    base_image_path="img/night-elf-in-digital-empire.jpg",
    quote='"The first billion-dollar company run by a single employee could emerge in 2026"',
    attribution="— Dario Amodei, Anthropic founder, May 2025",
    output_path="img/hero-with-quote.jpg"
)
```

## Configuration

Edit `scripts/products-config.json` to customize:

- **Image dimensions** - Width and height for social previews
- **Font sizes** - Title and slogan font sizes
- **Pastel colors** - Add or modify gradient color schemes
- **Products** - Add new products with name, slogan, and color

### Example Product Entry

```json
{
  "slug": "my-product",
  "name": "My Product",
  "slogan": "One-line description of your product",
  "color": "lavender"
}
```

## Available Pastel Colors (20 total)

**Blues & Purples:**
- `blue` - Soft blue (#B4D4FF)
- `sky` - Light sky blue (#A7D8DE)
- `powder` - Powder blue (#C8E0F0)
- `periwinkle` - Blue-purple (#C5D3E8)
- `lavender` - Soft lavender (#E0BBE4)
- `lilac` - Light lilac (#D4C5F9)
- `mauve` - Dusty purple-pink (#E8C4D4)

**Pinks & Reds:**
- `pink` - Light pink (#FFD6E8)
- `rose` - Soft rose (#FFB3C6)
- `coral` - Peachy-pink (#FFB3BA)
- `blush` - Light pink-peach (#FFD5CD)

**Greens:**
- `mint` - Mint green (#C8E6C9)
- `sage` - Muted green (#B4CFB0)
- `seafoam` - Blue-green (#B8E6D5)
- `pistachio` - Yellow-green (#D4E7B0)

**Yellows & Oranges:**
- `lemon` - Pale yellow (#FFF4B3)
- `vanilla` - Pale cream-yellow (#FFF9E3)
- `peach` - Soft peach (#FFD4B2)
- `apricot` - Light orange (#FED8B1)
- `aqua` - Light turquoise (#B3E5E6)

View all colors: Run `python3 scripts/preview_colors.py` to generate `img/color-palette-preview.jpg`

## Output

Generated images are saved to `img/products/` by default:
- `{slug}-social-preview.jpg` - Social media preview (1200×630)
- `{slug}-hero.jpg` - Product hero image (1920×600)

## Image Specifications

### Social Media Previews
- Dimensions: 1200×630px (Open Graph standard)
- Format: JPEG, optimized quality
- Style: Pastel gradient background with product name and slogan
- Use in HTML: `<meta property="og:image" content="...">`

### Product Hero Images
- Dimensions: 1920×600px (responsive)
- Format: JPEG, optimized quality
- Style: Pastel gradient with centered text

### Hero with Overlay
- Dimensions: 1920×1080px (full HD)
- Format: JPEG, optimized quality
- Style: Dark overlay (70% opacity) with quote at bottom
