# Inturious API

Server-side services for Inturious properties. Runs on Linode Tokyo, not Vercel —
these are long-running processes with local state, deployed by rsync + systemd.

**Sibling repo:** `inturious-site` (static site + tip page, deploys to Vercel).
The split is by deploy target: everything static there, everything server-side here.

## Services

| Service | Routes | Status |
|---|---|---|
| Tips | `/api/tips/*` | In development |

## Stack

- Node + Express
- SQLite via `better-sqlite3` — embedded, the database file sits next to the process
- systemd unit, nginx reverse proxy, Let's Encrypt

No network database: the API and the SQLite file live on the same box, so there is
nothing to expose and no adapter (`sqld`/libSQL) in the path. See
`docs/reader-payments-plan.md` for the reasoning and the latency measurements behind it.

## Layout

```
src/
  server.js        bootstrap, CORS, health
  routes/<svc>/    HTTP adapters — thin
  lib/<svc>/       logic — no framework imports, portable
migrations/        schema
deploy/            systemd unit, nginx vhost
```

Route handlers stay thin so the logic in `lib/` is not tied to Express or to this box.

## Local development

```bash
npm install
npm run dev
```

## Deployment

Target: `api.inturious.com` (Linode Tokyo)
