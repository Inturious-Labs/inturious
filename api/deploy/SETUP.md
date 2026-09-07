# First-time server setup

Target: Linode Tokyo (`linode-tokyo-root`), Ubuntu 24.04, `172.238.12.93`.
Readly already runs on this box — everything here is additive and resource-capped.

## 1. DNS (do this first; certbot needs it resolving)

In Google Cloud DNS, on the `inturious.com` zone:

```
A    api.inturious.com    172.238.12.93
```

Verify: `dig +short api.inturious.com` → `172.238.12.93`

## 2. Node

Ubuntu's packaged Node is too old. Use NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
node --version   # expect v22.x
```

## 3. Directories

```bash
mkdir -p /home/clayton/inturious-api /var/lib/inturious-api
chown clayton:clayton /home/clayton/inturious-api /var/lib/inturious-api
chmod 750 /var/lib/inturious-api
```

## 4. Environment

```bash
cp .env.example /home/clayton/inturious-api/.env   # then edit
openssl rand -hex 32                               # STATS_TOKEN
chown clayton:clayton /home/clayton/inturious-api/.env
chmod 600 /home/clayton/inturious-api/.env
```

## 5. First deploy

From a workstation, on a clean `main`: `./api/deploy/deploy.sh` (it exports `api/` from `origin/main`, so what lands is always a pushed commit)

(It expects the unit file from step 6 to exist; on the very first run, copy the unit
in before deploying, or expect the restart step to fail and rerun after.)

## 6. systemd

```bash
cp deploy/inturious-api.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now inturious-api
systemctl status inturious-api
```

## 7. nginx + TLS

```bash
cp deploy/nginx-api.inturious.com.conf /etc/nginx/sites-available/inturious-api
ln -s /etc/nginx/sites-available/inturious-api /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d api.inturious.com     # renews automatically
```

Verify: `curl https://api.inturious.com/health`

## 8. Backups

Two stages, both running.

**On this server** — nightly snapshot at 03:15, kept 14 days:

```
/usr/local/bin/inturious-api-backup   →   /var/backups/inturious-api/
```

It uses `sqlite3 .backup` rather than copying the file, because `.backup` is safe while
the service is mid-write and a plain `cp` can produce a corrupt copy. It fails loudly
if the result is empty. Log: `/var/log/inturious-api-backup.log`.

**On Dalaran** — nightly pull at 04:15, an hour later so there is always a fresh
snapshot to collect:

```
~/bin/inturious-backup-pull   →   ~/backups/inturious-api/
```

The pull runs from home rather than being pushed from here, so that a public-facing web
server never holds credentials into the home network. The key it uses is confined by
`rrsync` to read-only access on the backup directory and cannot obtain a shell — verified.

Each pull decompresses the newest snapshot and runs SQLite's own integrity check
against it, then reports how many tips it holds. Gzip alone only proves the file
survived the trip; this proves the contents are usable. A deliberately corrupted
database was tested and correctly rejected.

The pull also warns if the newest snapshot is more than two days old, since a backup
that silently stops is worse than none.

To restore:

```bash
gunzip -c inturious-YYYY-MM-DD.db.gz > restored.db
sqlite3 restored.db "PRAGMA integrity_check;"
```

## Operations

```bash
journalctl -u inturious-api -f          # logs
systemctl restart inturious-api         # restart
sqlite3 /var/lib/inturious-api/inturious.db   # inspect
```
