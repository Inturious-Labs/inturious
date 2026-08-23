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

From a workstation: `./deploy/deploy.sh`

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

The database is one small file. Nightly copy to KunLun:

```bash
# crontab -e  (as root)
15 3 * * * sqlite3 /var/lib/inturious-api/inturious.db ".backup '/tmp/inturious.db'" && rsync -az /tmp/inturious.db kunlun:backups/inturious-api/inturious-$(date +\%F).db && rm -f /tmp/inturious.db
```

`.backup` is used rather than copying the file directly — it is safe while the service
is mid-write, which a plain `cp` is not.

Requires `apt-get install -y sqlite3` and an SSH key from the VPS to KunLun.

## Operations

```bash
journalctl -u inturious-api -f          # logs
systemctl restart inturious-api         # restart
sqlite3 /var/lib/inturious-api/inturious.db   # inspect
```
