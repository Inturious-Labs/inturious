# Inturious API

Server-side services for Inturious properties. Runs on Linode Tokyo, not Vercel —
these are long-running processes with local state, deployed by rsync + systemd.

**Siblings:** `../site` (inturious.com) and `../tip` (the tip page, this API's only
client). Each folder deploys on its own; see the root README for the order to follow
when a change spans the tip page and the API.

## Services

| Service | Routes | Status |
|---|---|---|
| Tips | `/api/tips/*` | In development |

## Stack

- Node + Fastify
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

Route handlers stay thin so the logic in `lib/` is not tied to Fastify or to this box.

## Local development

```bash
npm install
npm run dev
```

## Deployment

Live at `https://api.inturious.com` (Linode Tokyo). First-time server setup is in
`deploy/SETUP.md`; after that, `./api/deploy/deploy.sh` from a clean `main` at the repo
root exports this folder at `origin/main`, syncs, migrates, and restarts. It refuses a
dirty or unpushed tree, and `--dry-run` shows what would change without touching the
server.

## Reading the numbers

SSH in and query the database directly — no token to manage.

```bash
ssh linode-tokyo-root
DB=/var/lib/inturious-api/inturious.db
```

**Which articles send readers to the tip page**

```bash
sqlite3 -header -column $DB "
  SELECT src, article, COUNT(*) AS visits
    FROM tip_visits WHERE article IS NOT NULL
   GROUP BY src, article ORDER BY visits DESC LIMIT 20;"
```

**Which newsletter converts best**

```bash
sqlite3 -header -column $DB "
  SELECT src, COUNT(*) AS visits FROM tip_visits GROUP BY src ORDER BY visits DESC;"
```

**Which payment methods get clicked**

```bash
sqlite3 -header -column $DB "
  SELECT method, COUNT(*) AS clicks FROM tip_visits
   WHERE method IS NOT NULL GROUP BY method ORDER BY clicks DESC;"
```

**Daily visits, last 7 days**

```bash
sqlite3 -header -column $DB "
  SELECT date(ts,'unixepoch','localtime') AS day, COUNT(*) AS visits
    FROM tip_visits WHERE ts >= strftime('%s','now','-7 days')
   GROUP BY day ORDER BY day DESC;"
```

**Card tips by article** (crypto tips cannot be attributed on-chain)

```bash
sqlite3 -header -column $DB "
  SELECT src, article, COUNT(*) AS tips, SUM(amount_cents)/100.0 AS total
    FROM tips GROUP BY src, article ORDER BY total DESC;"
```

**Interactive session**

```bash
sqlite3 $DB
sqlite> .tables
sqlite> .schema tip_visits
sqlite> .headers on
sqlite> .mode column
sqlite> .quit
```

Timestamps are unix seconds. `src` is one of `dsc`, `tsb`, `rog`, `hyx`.

There is also a `bin/tips` command that reads the same figures over HTTPS, for use from
a workstation. It needs `INTURIOUS_STATS_TOKEN` (the `STATS_TOKEN` in the server's
`.env`); querying over SSH avoids handling that secret at all.

## Operations

```bash
systemctl status inturious-api          # is it running
journalctl -u inturious-api -f          # follow logs
systemctl restart inturious-api         # restart
```
