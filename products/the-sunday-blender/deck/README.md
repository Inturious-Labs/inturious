# Pitch Deck Template (sli.dev)

This folder contains a [sli.dev](https://sli.dev) presentation template for product pitch decks.

**Live template:** https://inturious.com/products/project-deck/pitch/

## Creating a New Deck

1. Copy this entire `deck/` folder into your product directory:
   ```bash
   cp -r products/project-deck/deck products/my-product/deck
   ```

2. Edit `slides.md` with your content

3. Test locally:
   ```bash
   cd products/my-product/deck
   npm install
   npm run dev
   ```
   Opens at `http://localhost:3030`

4. Commit your changes. The CI pipeline will automatically build and deploy to:
   `https://your-domain.com/products/my-product/pitch/`

## Files

- `package.json` - Dependencies (sli.dev CLI and default theme)
- `slides.md` - Your presentation content
- `README.md` - This file (you can delete it from your product)

## Local Commands

```bash
npm run dev     # Start dev server with hot reload
npm run build   # Build static files (done automatically in CI)
npm run export  # Export to PDF
```

## Customization

See [sli.dev documentation](https://sli.dev/guide/) for:
- [Themes](https://sli.dev/themes/gallery)
- [Animations & Transitions](https://sli.dev/guide/animations)
- [Code Highlighting](https://sli.dev/guide/syntax#code-blocks)
- [Layouts](https://sli.dev/builtin/layouts)
- [Exporting to PDF](https://sli.dev/guide/exporting)
