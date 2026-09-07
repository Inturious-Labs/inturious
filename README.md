# Inturious

Everything Inturious in one repo: the site, the tip page and the API behind it. Each
top-level folder is one deploy target.

| Folder | Serves | Where it runs | How it ships |
|---|---|---|---|
| `site/` | inturious.com | Vercel project `inturious`, Root Directory `site` | Merge to `main`; Vercel builds it |
| `tip/` | tip.inturious.com | Vercel project `inturious-tip`, Root Directory `tip` | Merge to `main`; Vercel builds it |
| `api/` | api.inturious.com | Node process on Linode Tokyo (systemd + nginx + SQLite) | Merge to `main`, then run `./api/deploy/deploy.sh` |

Each folder has its own README, dependencies and lockfile. There is no install at the
root. The two Vercel projects only build when a commit touches their own folder.

## Making a change that spans the tip page and the API

One branch, one PR. Both halves are reviewed and reverted together. They still go
live separately, so:

1. The API change must work with the tip page that is already live. Add before you
   remove; never rename a field the page still sends.
2. Merge the PR. Vercel redeploys `tip/` on its own within a minute or two.
3. Run `./api/deploy/deploy.sh` from a clean `main`. It ships `api/` at `origin/main`
   and prints the commit it deployed; the same hash sits in `REVISION` on the server.

Order matters when the page needs something new from the API: deploy the API first,
then let the page go out. When the API only stops accepting something, do it the other
way round.

## Local development

```bash
cd site && pnpm install && ./scripts/build-decks.sh && python3 -m http.server 8000
cd tip  && python3 -m http.server 8001
cd api  && npm install && cp .env.example .env && npm run dev
```

The tip page talks to `https://api.inturious.com` by default (`tip/js/config.js`).
Point it at `http://localhost:3001` to exercise a local API, and add
`http://localhost:8001` to `CORS_ORIGINS` in `api/.env`.

## History

The API lived in `Inturious-Labs/inturious-api` until September 2026, when it was
merged here with its history intact. That repo is archived.

## Contact

hello@inturious.com

## License

Copyright 2026 Inturious Labs
