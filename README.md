# Inturious Labs

[![Deploy to IC Mainnet](https://github.com/Inturious-Labs/inturious/actions/workflows/deploy.yml/badge.svg)](https://github.com/Inturious-Labs/inturious/actions/workflows/deploy.yml)

Portfolio website for Inturious Labs showcasing digital products and services.

## Deployment

### Live Site

- **Website:** https://inturious.com
- **Canister ID:** `mhlja-5qaaa-aaaao-qkv2q-cai`
- **IC URL:** https://mhlja-5qaaa-aaaao-qkv2q-cai.icp0.io

### Deployment

The site is automatically deployed to Internet Computer mainnet via GitHub Actions on every push to `main` branch.

### Local Development

```bash
# Open index.html in browser
open index.html

# Or use a local server
python3 -m http.server 8000
```

### Manual Deployment

```bash
dfx deploy --network ic
```

## Portfolio Structure

```
inturious/
├── index.html                      # Main landing page
├── robots.txt                      # SEO crawler configuration
├── decks/                          # Slidev decks (talks, pitches)
│   ├── _template/                  # Starter template (not deployed)
│   └── <deck-slug>/                # One folder per deck
│       └── src/                    # Slidev source (slides.md, package.json, public/)
├── products/                       # Product pages
│   ├── digital-sovereignty-chronicle/
│   ├── the-sunday-blender/
│   ├── herbert-yang-blog/
│   ├── ic123/
│   ├── rapport/
│   ├── lumen/
│   ├── flux/
│   ├── y3-labs/                    # Y3 Labs game studio
│   └── readly/
├── css/
│   ├── pico.min.css               # Pico CSS framework
│   └── style.css                  # Custom styles
├── img/
│   ├── products/                  # Product hero and social preview images
│   ├── favicon.*                  # Favicon files
│   └── *.jpg                      # Site images
├── scripts/
│   ├── analytics.js               # Google Analytics
│   ├── generate_hero_images.py    # Hero image generator
│   ├── products-config.json       # Product configuration
│   └── README.md                  # Scripts documentation
├── .github/
│   └── workflows/
│       └── deploy.yml             # CI/CD to Internet Computer
├── .well-known/
│   └── ic-domains                 # Custom domain configuration
├── dfx.json                       # IC canister configuration
└── .ic-assets.json5               # Asset headers and caching
```

## Adding a New Product

Follow these steps to add a new product to the portfolio:

### Step 1: Add Product Configuration

Edit `scripts/products-config.json` and add your product to the `products` array:

```json
{
  "slug": "product-slug",
  "name": "Product Name",
  "slogan": "One-line description of the product",
  "color": "vanilla"
}
```

**Available colors:** blue, pink, lavender, mint, peach, lilac, sky, coral, sage, lemon, rose, periwinkle, aqua, apricot, mauve, pistachio, powder, seafoam, vanilla, blush

### Step 2: Generate Hero Images

Run the Python script to generate hero and social preview images:

```bash
python scripts/generate_hero_images.py --all
```

This will create:
- `img/products/product-slug-hero.jpg` (1200x630px)
- `img/products/product-slug-social-preview.jpg` (1200x630px)

### Step 3: Create Product Page from Template

```bash
mkdir -p products/product-slug
```

### Step 4: Customize Product Page Basics

Edit `products/product-slug/index.html` and update:

1. **Meta tags** (lines 6-20):
   - Title: `[Product Name] - Inturious Labs`
   - Description: Brief SEO description
   - OG/Twitter image URLs: `product-slug-social-preview.jpg`
   - OG URL: `https://inturious.com/products/product-slug/`

2. **Product color** (line 31):
   ```css
   --product-color: var(--color-yourcolor);
   ```

3. **Hero image** (line 43):
   ```html
   <img src="../../img/products/product-slug-hero.jpg" alt="Product Name" class="hero-image">
   ```

4. **Status badge** (line 44):
   - For live products: `<span class="status-badge live">Live</span>`
   - For coming soon: `<span class="status-badge">Coming Soon</span>`

### Step 5: Update Homepage

Edit `index.html` and find the placeholder product card or add a new one in the `<div class="products-grid">` section.

Replace the hidden card structure:
```html
<article class="product-card hidden">
  <h3>Product Name</h3>
  ...
</article>
```

With the active card structure:
```html
<a href="products/product-slug/index.html" class="product-card-link">
  <article class="product-card" style="background: linear-gradient(135deg, var(--color-yourcolor) 0%, color-mix(in srgb, var(--color-yourcolor) 70%, black) 100%);">
    <h3>Product Name</h3>
    <span class="status-badge live">Live</span>
    <p>One-line product description</p>
  </article>
</a>
```

### Step 6: Fill in Product Content (Later)

Edit the product page content sections as needed:
- Target Users
- Pain Point
- Proposed Solution
- Key Benefits
- Get Started (include product URL or contact email)

### Step 7: Commit and Deploy

```bash
git add scripts/products-config.json products/product-slug/ img/products/product-slug-* index.html
git commit -m "Add [Product Name] product page"
git push
```

The site will automatically deploy to IC mainnet via GitHub Actions.

### Quick Reference

- **Configuration:** `scripts/products-config.json`
- **Product page:** `products/product-slug/index.html`
- **Hero images:** `img/products/product-slug-hero.jpg` and `product-slug-social-preview.jpg`
- **Homepage:** `index.html` (products-grid section)
- **Deck template:** `decks/_template/src/slides.md`
- **Live decks:** `https://inturious.com/decks/<deck-slug>/`

## Adding a New Deck

Decks are slidev presentations published under `inturious.com/decks/<slug>/`. They are independent of products — a deck can be a product pitch, a conference talk, or anything else.

### Step 1: Scaffold from the template

```bash
mkdir -p decks/<deck-slug>/src
cp decks/_template/src/{slides.md,package.json,.gitignore} decks/<deck-slug>/src/
```

### Step 2: Edit `decks/<deck-slug>/src/slides.md`

Update the title, frontmatter, and content. Drop any static assets into `decks/<deck-slug>/src/public/` — slidev serves them at the deck root.

### Step 3: Preview locally

```bash
cd decks/<deck-slug>/src
pnpm install   # first time only
pnpm dev       # opens http://localhost:3030
```

### Step 4: Commit and deploy

```bash
git add decks/<deck-slug>/
git commit -m "Add <deck-slug> deck"
git push
```

CI runs `scripts/build-decks.sh`, which builds each changed deck into `decks/<deck-slug>/` (alongside `src/`). The canister serves it at `https://inturious.com/decks/<deck-slug>/`. The `src/` folder and `_template/` are excluded from the canister upload via `.ic-assets.json5`.

## Contact

hello@inturious.com

## License

Copyright 2025 Inturious Labs
