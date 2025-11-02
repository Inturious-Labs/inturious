#!/usr/bin/env python3
"""
Color Palette Preview Generator
Creates a visual reference of all available pastel colors
"""

import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

def generate_color_palette_preview(config_path="scripts/products-config.json", output_path="img/color-palette-preview.jpg"):
    """Generate a visual preview of all pastel colors"""

    # Load config
    with open(config_path, 'r') as f:
        config = json.load(f)

    pastel_colors = config.get("pastel_colors", {})

    # Image settings
    swatch_width = 300
    swatch_height = 150
    cols = 5
    rows = (len(pastel_colors) + cols - 1) // cols  # Ceiling division

    img_width = swatch_width * cols
    img_height = swatch_height * rows

    # Create image
    img = Image.new('RGB', (img_width, img_height), color='#2d2d2d')
    draw = ImageDraw.Draw(img)

    # Try to get a font
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 24)
        font_small = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 18)
    except:
        font = ImageFont.load_default()
        font_small = ImageFont.load_default()

    # Draw swatches
    for idx, (name, hex_color) in enumerate(pastel_colors.items()):
        row = idx // cols
        col = idx % cols

        x = col * swatch_width
        y = row * swatch_height

        # Convert hex to RGB
        hex_color = hex_color.lstrip('#')
        r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

        # Draw color swatch
        draw.rectangle([(x, y), (x + swatch_width, y + swatch_height)], fill=(r, g, b))

        # Draw color name and hex
        text_color = (45, 45, 45)  # Dark text for pastel backgrounds
        draw.text((x + swatch_width // 2, y + swatch_height // 2 - 15),
                 name.capitalize(), font=font, fill=text_color, anchor="mm")
        draw.text((x + swatch_width // 2, y + swatch_height // 2 + 15),
                 f"#{hex_color.upper()}", font=font_small, fill=text_color, anchor="mm")

    # Save
    img.save(output_path, quality=95, optimize=True)
    print(f"✓ Color palette preview saved to: {output_path}")
    print(f"  Total colors: {len(pastel_colors)}")

if __name__ == "__main__":
    generate_color_palette_preview()
