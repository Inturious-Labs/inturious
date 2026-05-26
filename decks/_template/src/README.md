# Deck Template (sli.dev)

A [sli.dev](https://sli.dev) starter for presentations published under `inturious.com/decks/<slug>/`.

This folder (`decks/_template/src/`) is the template itself — it is NOT deployed (underscore-prefixed folders are skipped by the build script and excluded from the canister).

## Creating a New Deck

1. Scaffold (don't copy this README — one canonical doc is enough):
   ```bash
   mkdir -p decks/<deck-slug>/src
   cp decks/_template/src/{slides.md,package.json,.gitignore} decks/<deck-slug>/src/
   ```

2. Edit `decks/<deck-slug>/src/slides.md`.

3. Preview locally:
   ```bash
   cd decks/<deck-slug>/src
   pnpm install   # first time only
   pnpm dev       # http://localhost:3030
   ```

4. Commit. CI builds and deploys to `https://inturious.com/decks/<deck-slug>/`.

5. When publishing publicly, add an entry to the "Talks & Decks" list in the root `index.html` (above the Portfolio section). Format: title link + `<span class="talks-meta">YYYY-MM-DD · City</span>`.

## Draft Mode

Prefix the deck folder with an underscore (e.g. `decks/_my-draft/`) to keep it out of production:

- The build script skips any `decks/_*` folder, so no public URL is generated.
- `.ic-assets.json5` excludes `decks/_*/**` from the canister upload, so even stray built files won't ship.
- `pnpm dev` still works locally — the workspace glob `decks/*/src` matches underscore folders too.

Drop the underscore when you're ready to publish.

## Layout

```
decks/<deck-slug>/
├── src/                # source (committed, excluded from canister)
│   ├── slides.md
│   ├── package.json
│   ├── .gitignore
│   └── public/         # static assets — served at deck root
└── (built output)      # index.html, assets/ — generated in CI, gitignored
```

## Local Commands

```bash
pnpm dev      # dev server with hot reload
pnpm build    # build static files (CI does this automatically)
pnpm export   # export to PDF
```

## Customization

See [sli.dev docs](https://sli.dev/guide/) for [themes](https://sli.dev/themes/gallery), [animations](https://sli.dev/guide/animations), [code blocks](https://sli.dev/guide/syntax#code-blocks), [layouts](https://sli.dev/builtin/layouts), and [PDF export](https://sli.dev/guide/exporting).
