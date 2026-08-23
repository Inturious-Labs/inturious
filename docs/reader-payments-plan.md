# Tipping + Paywall — Implementation Plan

**Branch:** `feature/reader-payments` (renamed from `feature/paywall-system`)
**Date:** 2026-08-23
**Supersedes:** `digital-sovereignty/PAYWALL_DESIGN.md` (2025-09-14, IC-canister era)

**Repos touched:** `inturious` (this plan) · new `tip` repo (V1 code) ·
`digital-sovereignty`, `sundayblender`, `remnants` (Hugo link shortcode) ·
`herbertyang.xyz` (Docusaurus component)

---

## Context

The paywall branch stalled on 2025-12-03. Since then `main` moved 43 commits ahead and
migrated the site from IC canister hosting to Vercel, invalidating the branch's core
deployment assumption. Two findings reshape the work:

1. **The existing paywall does not gate content.** Hugo renders the full paid body into
   the HTML; `paywall.js` hides it with `display:none`. View-source, curl, or JS-off
   reads everything. `paywall.js:78` also unlocks on an unvalidated cookie.
2. **Per-article micropayments are a documented weak model.** Buttondown's analysis of
   micropayment failure (Blendle: 150k paying of 1M+ users) argues the friction is
   psychological — each purchase forces a fresh "is this worth it?" decision. Tipping
   inverts this: the reader has already consumed and enjoyed the work.

Therefore: **tipping ships first**, paywall follows and inherits tested infrastructure.

### Storage decision (measured 2026-08-23)

IC canister storage was reconsidered — it is genuinely attractive (zero ops, ~13-node
subnet availability, public HTTP by design, no exposed database, strongest sovereignty
story, and `fhvra-iiaaa-aaaae-acznq-cai` is already live). Latency was measured from
Linode Tokyo, which approximates Vercel's network position far better than a China-side
connection:

| Operation | IC canister | sqld on Linode |
|---|---|---|
| Query call (read, no consensus) | 27-400ms, median ~330ms | ~1-5ms |
| Update call (write, consensus)  | **1.2-2.0s, median ~1.6s** | ~1-5ms |
| RTT to boundary node | 140ms | local socket |

**Decision: SQLite (sqld) on Linode Tokyo for both tipping and paywall.**

Rationale: tip-visit logging writes on every page view. At ~1.6s per update call a
Vercel function cannot await it, and fire-and-forget silently drops writes when the
function is frozen after responding — corrosive for data whose only purpose is counting.
The consensus floor is protocol-level, not an implementation artifact, so no canister
design avoids it.

A split (canister for paywall, SQLite for tips) was considered and rejected: the
paywall's slow writes land in payment flows where 1.6s is unnoticed, so the canister is
*viable* there — but "viable" does not justify a second storage system in a second
language with a separate funding model (cycles). One database, one query language, one
backup story. SQL also matters more for the paywall's relational schema, which will
change as the flows are learned.

**Accepted trade-off:** a single VPS in Tokyo is a single point of failure where a
13-node subnet is not, and this is weaker sovereignty than a canister. Judged acceptable
because Stripe is already a harder dependency than Linode, and mitigated by nightly
rsync of the SQLite file to KunLun — the whole DB stays small enough that a complete,
portable copy is always held. That is still a better ownership story than a managed
database.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  READER SITES (4)                                               │
│  DSC · Sunday Blender · Remnants  (Hugo)                        │
│  herbertyang.xyz                  (Docusaurus)                  │
│                                                                 │
│  Article footer → <a href="tip.inturious.com/?src=…&a=…">        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             v
┌─────────────────────────────────────────────────────────────────┐
│  tip.inturious.com  (Vercel, own project + repo)                │
│    /                       static tip page                      │
│    /api/tip/visit          POST — log visit/click               │
│    /api/tip/checkout       POST — Stripe session w/ metadata    │
│    /api/tip/stats          GET  — JSON, token-protected         │
└────────────────────────────┬────────────────────────────────────┘
                             │ libSQL over HTTPS (JWT)
                             v
┌─────────────────────────────────────────────────────────────────┐
│  edge.inturious.com → 172.238.12.93  (Linode Tokyo)             │
│  sqld (libSQL) · nginx TLS · fail2ban · nightly backup → KunLun │
└─────────────────────────────────────────────────────────────────┘
```

**Portability rules (enforced from day one):**
- All logic in `lib/`, route files are thin adapters
- Zero `@vercel/*` imports
- Web-standard APIs (`fetch`, Web Crypto) over Node-only
- Result: moving off Vercel = rewrite ~15 lines/route, DB never moves

---

## V1 — Static tip page + attribution

### 1.1 Infrastructure: sqld on Linode Tokyo

VPS verified: Ubuntu 24.04, 1 core, 961MB RAM, 11GB free, load 0.04, uptime 299d.
Sole tenant is Readly (prod :8000, dev :8001) behind nginx. Ample headroom.

```bash
# 2GB swap — free, insurance only (current swap use is 299d of cold pages, not pressure)
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# sqld binary → /usr/local/bin, data → /var/lib/sqld
# systemd unit, bind 127.0.0.1:8080, --auth-jwt-key
# nginx vhost edge.inturious.com → proxy 127.0.0.1:8080
# certbot --nginx -d edge.inturious.com
```

DNS: A record `edge.inturious.com` → `172.238.12.93` (Google Cloud DNS, same console
as herbertyang.xyz).

Security — this endpoint is internet-facing and holds reader data:
- JWT auth (Vercel IPs are not static; IP allowlist is not viable)
- nginx rate limiting
- fail2ban on repeated 401s
- Non-descriptive hostname (`edge`, not `db`)
- Nightly `rsync` of the SQLite file to KunLun

### 1.2 Schema

```sql
CREATE TABLE tip_visits (
  id       INTEGER PRIMARY KEY,
  src      TEXT NOT NULL,      -- dsc | tsb | rog | hyx
  article  TEXT,               -- slug
  method   TEXT,               -- null on view; btc|sol|usdc|icp|card on click
  ts       INTEGER NOT NULL
);
CREATE INDEX idx_visits_src_article ON tip_visits(src, article);
CREATE INDEX idx_visits_ts ON tip_visits(ts);

CREATE TABLE tips (                -- Stripe only; crypto is not attributable on-chain
  id              INTEGER PRIMARY KEY,
  stripe_session  TEXT UNIQUE,
  amount_cents    INTEGER,
  currency        TEXT,
  src             TEXT,
  article         TEXT,
  ts              INTEGER NOT NULL
);
```

Privacy: no IP, no user-agent, no fingerprint. Coarse by design — enough to decide what
to write more of, not enough to profile a reader.

### 1.3 The tip page — `tip.inturious.com`

Its own Vercel project and repo, not a directory in `inturious` — that repo runs a
Slidev deck build (`scripts/build-decks.sh`) and the tip page should not be entangled
with it. Separate project means independent deploys and lifecycle.

Page and its API routes are same-origin (`tip.inturious.com/api/*`), so no CORS.

Hosts:
| Host | Role |
|---|---|
| `tip.inturious.com` | Tip page + API routes (Vercel) |
| `edge.inturious.com` | sqld database (Linode Tokyo) |
| `inturious.com` | Existing site, untouched |

Per-site theming: `?src=` drives a light skin (accent colour, masthead) so the page can
feel native to whichever newsletter sent the reader, while staying one file.

Payment methods, each with address + URI-encoded QR + one-tap copy:

| Method | URI scheme | Attribution |
|---|---|---|
| Bitcoin | BIP-21 `bitcoin:bc1q…?amount=&label=` | none on-chain |
| Solana  | Solana Pay `solana:…?amount=&reference=` | **exact** via reference |
| USDC    | EIP-681 `ethereum:0x…@1/transfer?address=&uint256=` | none |
| ICP     | account identifier + QR (no URI std) | none |
| Card    | Stripe Checkout, `metadata:{src,article}` | **exact** |

Design principles from the research:
- Three suggested amounts per method (blank fields force a decision)
- Gratitude framing, not commerce framing
- No account creation, no redirect for crypto
- Everything on one page, mobile-first

**ICP note:** use the *account identifier*, not the principal ID.

### 1.4 API routes

```
POST /api/tip/visit      {src, article, method?}      → 204
POST /api/tip/checkout   {src, article, amount}       → {url}
GET  /api/tip/stats      Authorization: Bearer <tok>  → JSON
POST /api/tip/webhook    Stripe → record into tips
```

`lib/tips/{db,stripe,stats}.js` holds all logic; routes are adapters.

### 1.5 Site integration

Hugo shortcode/partial (DSC, TSB, Remnants) — mirrors the existing
`newsletter-signup.html` pattern, appended after it in `single.html`:

```html
<a href="https://tip.inturious.com/?src={{ $src }}&a={{ .File.ContentBaseName }}"
   class="tip-link" rel="noopener">If this was worth your time, leave a tip</a>
```

Docusaurus (herbertyang.xyz) — same markup as a React component in `src/components/`,
wired into the doc/blog footer. Different mechanism, identical output.

`src` values: `dsc`, `tsb`, `rog`, `hyx`.

### 1.6 Reading the data

**CLI** — `scripts/tips` in the inturious repo, symlinked to PATH (matches the existing
`dsc-publish` pattern). Calls `/api/tip/stats`, no SSH needed:

```
$ tips top          # articles by visits
$ tips methods      # method breakdown
$ tips revenue      # Stripe totals by src/article
$ tips week         # last 7 days
```

**Direct SQL fallback:** `ssh linode-tokyo-root` + `sqlite3 /var/lib/sqld/tips.db`

---

## V2 — Modal

Progressive enhancement over V1's plain link. One JS file on inturious.com upgrades
`.tip-link` into an overlay + iframe (`tip.inturious.com/embed?src=…&a=…`). No JS / iframe blocked →
the plain link still works.

- Crypto stays fully in-iframe
- Stripe opens `target="_blank"` (Checkout sets X-Frame-Options and refuses to frame)
- Mobile wallet deep-links may need `window.top.location` breakout; copy-to-clipboard is
  the always-works path
- Adds a funnel step to the data: modal-open vs method-click

Nothing in V1 changes — shortcodes and destination page stay as-is.

**Optional V2.5 — Datasette** on the VPS behind nginx basic auth: a full browsable UI
over the SQLite file, ~zero code, and it generalizes to the paywall DB later.

---

## V3 — Paywall migration

### 3.1 Rebase and reset

```bash
git branch -m feature/paywall-system feature/reader-payments
git push origin :feature/paywall-system
git push -u origin feature/reader-payments
git rebase origin/main   # 43 commits; single.html was rewritten to Tailwind
```

Delete from the branch: `backend/` (Rust), `dfx.json`, `canister_ids.json`,
`Cargo.{toml,lock}`, `static/js/paywall.js`. Rewrite `PAYWALL_DESIGN.md` → this plan.

### 3.2 The security fix (the point of the migration)

Hugo must **stop emitting paid bodies into HTML**. Paywalled posts render preview only.
Full content is served by `/api/content/[slug]` after token validation.

This is what IC asset-canister hosting made impossible and Vercel functions make trivial.
It is the actual reason to migrate — not the hosting change itself.

### 3.3 Routes and schema

```
POST /api/paywall/checkout     → Stripe session
POST /api/paywall/verify       → verify, issue signed cookie
GET  /api/paywall/content/[slug] → validate, return body   ← the fix
POST /api/paywall/webhook      → record purchase
POST /api/paywall/gift
POST /api/paywall/redeem
```

Same sqld instance as V1 (see Storage decision). Paywall writes are ~1-5ms; reads for
content unlock are on the hot path and must stay fast.

```sql
CREATE TABLE purchases     (id, email, article, stripe_session, amount_cents, ts);
CREATE TABLE access_tokens (token PRIMARY KEY, email, article, expires_at, created_at);
CREATE TABLE gifts         (token PRIMARY KEY, article, gifter_email, recipient_email,
                            redeemed, redeemed_by, expires_at, created_at);
CREATE TABLE sessions      (id PRIMARY KEY, email, expires_at, created_at);
```

Ports from Rust: `auth.rs` (327 lines) → ~40 lines Web Crypto; `stripe.rs` (590) →
Stripe SDK; `email.rs` (482) → Resend SDK. ~2650 lines Rust → ~400 lines JS, because
most of the Rust exists to fight IC's HTTP-outcall constraints.

### 3.4 Decommission

Canister `fhvra-iiaaa-aaaae-acznq-cai` is live with public `test_insert_token` /
`test_get_token` update methods — anyone can mint an access token. Currently harmless
(no real purchases, test article is `draft:true`, 404 in prod) but must not survive.
Stop and delete the canister; reclaim cycles. No storage role is retained for it (see
Storage decision) — `storage.rs` and `auth.rs` are good code but the latency measurement
rules out canister-backed state for this workload.

---

## Sequencing

| | Scope | Gate |
|---|---|---|
| **V1** | sqld + tip page + 4 integrations + CLI + stats | Ship, then watch real tip data |
| **V2** | Modal, optional Datasette | Only if V1 shows traffic |
| **V3** | Paywall migration + canister decommission | Only if tipping validates willingness to pay |

V3 is explicitly gated. If tips work well, the paywall may be unnecessary — which is a
good outcome, not a failure.

---

## Open items

- Confirm crypto addresses (BTC, SOL, USDC, ICP account identifier)
- Stripe: reuse existing DSC account or separate Inturious account for tips?
- ~~WeChat/Alipay~~ — **out of scope** (decided 2026-08-23). They were the only methods
  needing a verified business merchant entity for cross-border collection; the personal
  receiving-QR fallback would tie a payment channel under a real identity to this
  writing, which is a consideration worth avoiding rather than defaulting into. Crypto +
  Stripe covers the readership. Revisit only if reader demand actually shows up.
- Tip link copy — wording matters more than the 5% platform fees the research measured
