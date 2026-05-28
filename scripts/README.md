# Scripts

Utility scripts for the Inturious Labs site.

## `generate_sitemap.py`

Auto-discovers the homepage, every `products/<slug>/index.html`, and every public deck under `decks/<slug>/src/slides.md`, and writes `sitemap.xml` at the project root.

```bash
python3 scripts/generate_sitemap.py
```

No config file — adding a new product page or deck folder makes it appear in the sitemap on the next run.

## `build-decks.sh`

Build script for the Slidev decks under `decks/`. See the script header for usage.

## `analytics.js`

Google Analytics snippet loaded by site pages via `<script src="scripts/analytics.js" defer>`.
