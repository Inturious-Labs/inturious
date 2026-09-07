#!/usr/bin/env python3
"""
Generate sitemap.xml by auto-discovering site content.

Scans the filesystem for:
  - The homepage at /
  - Product pages at products/<slug>/index.html
  - Decks at decks/<slug>/ where decks/<slug>/src/slides.md exists
    (decks whose folder name starts with "_" are skipped — drafts/template)

No config files to maintain — adding a new product page or deck folder
makes it appear in the sitemap on the next build.
"""

import os
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
PRODUCTS_DIR = os.path.join(PROJECT_ROOT, "products")
DECKS_DIR = os.path.join(PROJECT_ROOT, "decks")
OUTPUT_FILE = os.path.join(PROJECT_ROOT, "sitemap.xml")

SITE_URL = "https://inturious.com"


def discover_products():
    """Return slugs for every products/<slug>/ that has an index.html."""
    if not os.path.isdir(PRODUCTS_DIR):
        return []
    slugs = []
    for entry in sorted(os.listdir(PRODUCTS_DIR)):
        index_path = os.path.join(PRODUCTS_DIR, entry, "index.html")
        if os.path.isfile(index_path):
            slugs.append(entry)
    return slugs


def discover_decks():
    """Return slugs for every public deck (has src/slides.md, no _ prefix)."""
    if not os.path.isdir(DECKS_DIR):
        return []
    slugs = []
    for entry in sorted(os.listdir(DECKS_DIR)):
        if entry.startswith("_"):
            continue
        slides_path = os.path.join(DECKS_DIR, entry, "src", "slides.md")
        if os.path.isfile(slides_path):
            slugs.append(entry)
    return slugs


def generate_sitemap():
    today = datetime.now().strftime("%Y-%m-%d")
    urls = []

    urls.append({
        "loc": SITE_URL + "/",
        "lastmod": today,
        "changefreq": "weekly",
        "priority": "1.0",
    })

    for slug in discover_products():
        urls.append({
            "loc": f"{SITE_URL}/products/{slug}/",
            "lastmod": today,
            "changefreq": "monthly",
            "priority": "0.8",
        })

    for slug in discover_decks():
        urls.append({
            "loc": f"{SITE_URL}/decks/{slug}/",
            "lastmod": today,
            "changefreq": "monthly",
            "priority": "0.7",
        })

    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for url in urls:
        xml_lines.append("  <url>")
        xml_lines.append(f"    <loc>{url['loc']}</loc>")
        xml_lines.append(f"    <lastmod>{url['lastmod']}</lastmod>")
        xml_lines.append(f"    <changefreq>{url['changefreq']}</changefreq>")
        xml_lines.append(f"    <priority>{url['priority']}</priority>")
        xml_lines.append("  </url>")
    xml_lines.append("</urlset>")

    return "\n".join(xml_lines), len(urls)


def main():
    sitemap_content, url_count = generate_sitemap()
    with open(OUTPUT_FILE, "w") as f:
        f.write(sitemap_content)
    print(f"Generated sitemap.xml with {url_count} URLs")


if __name__ == "__main__":
    main()
