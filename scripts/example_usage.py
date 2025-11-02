#!/usr/bin/env python3
"""
Example usage of the Hero Image Generator
Demonstrates different ways to generate hero images
"""

from generate_hero_images import HeroImageGenerator

# Initialize the generator
gen = HeroImageGenerator("scripts/products-config.json")

# Example 1: Generate a social media preview for a new product
print("Example 1: Social Media Preview")
print("-" * 50)
gen.generate_social_preview(
    product_name="Readly",
    slogan="Fast, reliable, and privacy-focused QR code scanning",
    color_name="blue",
    output_path="img/products/readly-social-custom.jpg"
)

# Example 2: Generate a product hero image with different color
print("\nExample 2: Product Hero Image (Mint)")
print("-" * 50)
gen.generate_product_hero(
    product_name="Readly",
    tagline="Scan QR codes with confidence",
    color_name="mint",
    width=1920,
    height=600,
    output_path="img/products/readly-hero-mint.jpg"
)

# Example 3: Generate a hero with overlay (like homepage)
print("\nExample 3: Hero with Quote Overlay")
print("-" * 50)
gen.generate_hero_with_overlay(
    base_image_path="img/night-elf-in-digital-empire.jpg",
    quote='"The first billion-dollar company run by a single employee could emerge in 2026"',
    attribution="— Dario Amodei, Anthropic founder, May 2025",
    output_path="img/hero-with-quote-example.jpg",
    overlay_opacity=0.7,
    width=1920,
    height=1080
)

# Example 4: Generate product hero images with different pastel colors
print("\nExample 4: Multiple Color Variations")
print("-" * 50)
colors = ["blue", "pink", "lavender", "mint", "peach", "lilac"]
for color in colors:
    gen.generate_product_hero(
        product_name="Readly",
        tagline="Fast QR scanning",
        color_name=color,
        width=800,
        height=400,
        output_path=f"img/products/readly-{color}.jpg"
    )

print("\n✓ All examples completed!")
print("\nGenerated files:")
print("  - img/products/readly-social-custom.jpg")
print("  - img/products/readly-hero-mint.jpg")
print("  - img/hero-with-quote-example.jpg")
print("  - img/products/readly-{blue,pink,lavender,mint,peach,lilac}.jpg")
