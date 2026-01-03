#!/usr/bin/env python3
"""
Generate sitemap.xml from products-config.json

This script reads the products configuration and generates a sitemap.xml
file in the project root directory.
"""

import json
import os
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
CONFIG_FILE = os.path.join(SCRIPT_DIR, "products-config.json")
OUTPUT_FILE = os.path.join(PROJECT_ROOT, "sitemap.xml")

SITE_URL = "https://inturious.com"


def load_products():
    """Load products from config file."""
    with open(CONFIG_FILE, "r") as f:
        config = json.load(f)
    return config.get("products", [])


def generate_sitemap():
    """Generate sitemap.xml content."""
    products = load_products()
    today = datetime.now().strftime("%Y-%m-%d")

    urls = []

    # Homepage
    urls.append({
        "loc": SITE_URL + "/",
        "lastmod": today,
        "changefreq": "weekly",
        "priority": "1.0"
    })

    # Product pages
    for product in products:
        urls.append({
            "loc": f"{SITE_URL}/products/{product['slug']}/",
            "lastmod": today,
            "changefreq": "monthly",
            "priority": "0.8"
        })

    # Build XML
    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ]

    for url in urls:
        xml_lines.append("  <url>")
        xml_lines.append(f"    <loc>{url['loc']}</loc>")
        xml_lines.append(f"    <lastmod>{url['lastmod']}</lastmod>")
        xml_lines.append(f"    <changefreq>{url['changefreq']}</changefreq>")
        xml_lines.append(f"    <priority>{url['priority']}</priority>")
        xml_lines.append("  </url>")

    xml_lines.append("</urlset>")

    return "\n".join(xml_lines)


def main():
    sitemap_content = generate_sitemap()

    with open(OUTPUT_FILE, "w") as f:
        f.write(sitemap_content)

    print(f"Generated sitemap.xml with {len(load_products()) + 1} URLs")


if __name__ == "__main__":
    main()
