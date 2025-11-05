#!/usr/bin/env python3
"""
Hero Image Generator for Inturious Labs
Generates consistent hero images for product pages and social media previews
"""

import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from typing import Tuple, Optional
import textwrap


class HeroImageGenerator:
    """Generate hero images with consistent UI style"""

    def __init__(self, config_path: str = "scripts/products-config.json"):
        """Initialize generator with configuration"""
        self.config_path = Path(config_path)
        self.config = self._load_config()
        self.settings = self.config.get("settings", {})
        self.pastel_colors = self.config.get("pastel_colors", {})

    def _load_config(self) -> dict:
        """Load configuration from JSON file"""
        if self.config_path.exists():
            with open(self.config_path, 'r') as f:
                return json.load(f)
        return {}

    def _hex_to_rgb(self, hex_color: str) -> Tuple[int, int, int]:
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

    def _create_gradient_background(
        self,
        width: int,
        height: int,
        color_name: str
    ) -> Image.Image:
        """Create a subtle gradient background using pastel colors"""
        img = Image.new('RGB', (width, height))
        draw = ImageDraw.Draw(img)

        # Get base color from config
        base_color = self.pastel_colors.get(color_name, "#B4D4FF")
        r, g, b = self._hex_to_rgb(base_color)

        # Create vertical gradient
        for y in range(height):
            # Gradually darken from top to bottom (subtle effect)
            factor = 1 - (y / height) * 0.15  # Max 15% darkening
            new_r = int(r * factor)
            new_g = int(g * factor)
            new_b = int(b * factor)
            draw.line([(0, y), (width, y)], fill=(new_r, new_g, new_b))

        return img

    def _create_dark_background(
        self,
        width: int,
        height: int
    ) -> Image.Image:
        """Create a dark background matching the site theme"""
        img = Image.new('RGB', (width, height))
        draw = ImageDraw.Draw(img)

        # Site background color: #2d2d2d
        bg_color = self._hex_to_rgb("#2d2d2d")
        draw.rectangle([(0, 0), (width, height)], fill=bg_color)

        return img

    def _add_overlay(
        self,
        img: Image.Image,
        opacity: float = 0.7
    ) -> Image.Image:
        """Add semi-transparent dark overlay matching site style"""
        overlay = Image.new('RGBA', img.size, (0, 0, 0, int(255 * opacity)))
        img = img.convert('RGBA')
        img = Image.alpha_composite(img, overlay)
        return img.convert('RGB')

    def _get_font(self, size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
        """Get font with fallback to default"""
        font_paths = [
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else None,
            "arial.ttf",
        ]

        for font_path in font_paths:
            if font_path:
                try:
                    return ImageFont.truetype(font_path, size)
                except (OSError, IOError):
                    continue

        # Fallback to default
        return ImageFont.load_default()

    def _draw_text_with_shadow(
        self,
        draw: ImageDraw.ImageDraw,
        position: Tuple[int, int],
        text: str,
        font: ImageFont.FreeTypeFont,
        text_color: Tuple[int, int, int],
        shadow_offset: int = 3
    ):
        """Draw text with subtle shadow for better readability"""
        x, y = position

        # Draw shadow
        draw.text((x + shadow_offset, y + shadow_offset), text,
                 font=font, fill=(0, 0, 0, 128), anchor="mm")

        # Draw main text
        draw.text((x, y), text, font=font, fill=text_color, anchor="mm")

    def generate_social_preview(
        self,
        product_name: str,
        slogan: str,
        color_name: str = "blue",
        output_path: Optional[str] = None
    ) -> Image.Image:
        """
        Generate social media preview image (1200x630)
        Matches Open Graph and Twitter Card specs
        """
        width = self.settings.get("image_width", 1200)
        height = self.settings.get("image_height", 630)

        # Create gradient background
        img = self._create_gradient_background(width, height, color_name)
        draw = ImageDraw.Draw(img)

        # Get text color from config
        text_color = self._hex_to_rgb(
            self.settings.get("text_color", "#2d2d2d")
        )

        # Get fonts
        title_size = self.settings.get("font_title_size", 120)
        slogan_size = self.settings.get("font_slogan_size", 48)

        title_font = self._get_font(title_size, bold=True)
        slogan_font = self._get_font(slogan_size)

        # Draw product name (centered, upper third)
        title_y = height // 3
        draw.text((width // 2, title_y), product_name,
                 font=title_font, fill=text_color, anchor="mm")

        # Draw slogan (centered, lower half, wrapped if needed)
        max_width = int(width * 0.8)  # 80% of image width
        wrapped_slogan = textwrap.fill(slogan, width=30)  # Approximate character width

        slogan_y = int(height * 0.6)
        draw.text((width // 2, slogan_y), wrapped_slogan,
                 font=slogan_font, fill=text_color, anchor="mm", align="center", spacing=20)

        # Save if output path provided
        if output_path:
            img.save(output_path, quality=95, optimize=True)
            print(f"✓ Social preview saved to: {output_path}")

        return img

    def generate_hero_with_overlay(
        self,
        base_image_path: str,
        quote: str,
        attribution: str,
        output_path: Optional[str] = None,
        overlay_opacity: float = 0.7,
        width: int = 1920,
        height: int = 1080
    ) -> Image.Image:
        """
        Generate hero image with quote overlay
        Matches the homepage hero style
        """
        # Load and resize base image
        try:
            img = Image.open(base_image_path)
            img = img.resize((width, height), Image.Resampling.LANCZOS)
        except Exception as e:
            print(f"Error loading image: {e}")
            # Fallback to dark background
            img = self._create_dark_background(width, height)

        # Add semi-transparent overlay
        img = self._add_overlay(img, opacity=overlay_opacity)

        # Convert to RGBA for text drawing
        img = img.convert('RGBA')
        txt_layer = Image.new('RGBA', img.size, (255, 255, 255, 0))
        draw = ImageDraw.Draw(txt_layer)

        # Get fonts (hero quote styling from CSS)
        quote_font = self._get_font(60, bold=False)  # Responsive: 1.5rem scaled
        attribution_font = self._get_font(32)  # 1rem scaled

        # Text color: white (#ffffff)
        text_color = (255, 255, 255, 255)

        # Wrap quote text
        max_chars_per_line = 50
        wrapped_quote = textwrap.fill(quote, width=max_chars_per_line)

        # Position text at bottom (matching flex-end from CSS)
        padding = int(height * 0.05)  # 5% padding
        quote_y = height - padding - 150  # Position from bottom
        attribution_y = height - padding - 50

        # Draw quote
        draw.text((width // 2, quote_y), wrapped_quote,
                 font=quote_font, fill=text_color, anchor="mm", align="center")

        # Draw attribution
        draw.text((width // 2, attribution_y), attribution,
                 font=attribution_font, fill=text_color, anchor="mm")

        # Composite text layer
        img = Image.alpha_composite(img, txt_layer)
        img = img.convert('RGB')

        # Save if output path provided
        if output_path:
            img.save(output_path, quality=95, optimize=True)
            print(f"✓ Hero image saved to: {output_path}")

        return img

    def generate_product_hero(
        self,
        product_name: str,
        tagline: str,
        color_name: str = "blue",
        width: int = 1920,
        height: int = 600,
        output_path: Optional[str] = None
    ) -> Image.Image:
        """
        Generate simple product hero image
        Clean gradient background with product name and tagline
        """
        # Create gradient background
        img = self._create_gradient_background(width, height, color_name)
        draw = ImageDraw.Draw(img)

        # Text color: dark for contrast on pastel
        text_color = self._hex_to_rgb("#1a1a1a")

        # Get fonts
        name_font = self._get_font(100, bold=True)
        tagline_font = self._get_font(40)

        # Draw product name (centered, upper area)
        name_y = int(height * 0.4)
        draw.text((width // 2, name_y), product_name,
                 font=name_font, fill=text_color, anchor="mm")

        # Draw tagline (centered, below name)
        wrapped_tagline = textwrap.fill(tagline, width=60)
        tagline_y = int(height * 0.65)
        draw.text((width // 2, tagline_y), wrapped_tagline,
                 font=tagline_font, fill=text_color, anchor="mm", align="center", spacing=20)

        # Save if output path provided
        if output_path:
            img.save(output_path, quality=95, optimize=True)
            print(f"✓ Product hero saved to: {output_path}")

        return img

    def generate_all_products(self, output_dir: str = "img/products"):
        """Generate social preview images for all products in config"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        products = self.config.get("products", [])

        if not products:
            print("⚠ No products found in config")
            return

        print(f"\nGenerating images for {len(products)} product(s)...\n")

        for product in products:
            slug = product.get("slug", "unknown")
            name = product.get("name", "Product")
            slogan = product.get("slogan", "")
            color = product.get("color", "blue")

            # Generate social preview
            social_path = output_path / f"{slug}-social-preview.jpg"
            self.generate_social_preview(name, slogan, color, str(social_path))

            # Generate product hero
            hero_path = output_path / f"{slug}-hero.jpg"
            self.generate_product_hero(name, slogan, color, output_path=str(hero_path))

        print(f"\n✓ All images generated in: {output_dir}/")


def main():
    """Main entry point with example usage"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Generate hero images for Inturious Labs products"
    )
    parser.add_argument(
        "--config",
        default="scripts/products-config.json",
        help="Path to products config JSON file"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Generate images for all products in config"
    )
    parser.add_argument(
        "--output-dir",
        default="img/products",
        help="Output directory for generated images"
    )

    args = parser.parse_args()

    # Create generator
    generator = HeroImageGenerator(args.config)

    if args.all:
        # Generate all products
        generator.generate_all_products(args.output_dir)
    else:
        # Example usage
        print("Hero Image Generator for Inturious Labs")
        print("=" * 50)
        print("\nExamples:")
        print("\n1. Generate all products:")
        print("   python scripts/generate_hero_images.py --all")
        print("\n2. Generate specific images in Python:")
        print("   >>> from generate_hero_images import HeroImageGenerator")
        print("   >>> gen = HeroImageGenerator()")
        print("   >>> gen.generate_social_preview('Readly', 'Fast QR scanning', 'blue', 'output.jpg')")


if __name__ == "__main__":
    main()
