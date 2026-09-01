# Fintree free-server deployment

For day-to-day changes, GitHub synchronization, environment updates, backups,
and recovery procedures, see [OPERATIONS.md](OPERATIONS.md).

This deployment runs the React frontend, Node backend, PostgreSQL 18,
persistent uploads, automatic HTTPS, and the DuckDNS address updater on one
Oracle Cloud Always Free Ubuntu server.

## What stays persistent

Docker named volumes preserve the PostgreSQL database, uploaded files, and
HTTPS certificates across application updates and container restarts.
Deleting the Docker volumes deletes that data, so do not run `docker compose
down -v` on a live server.

## Server preparation

From the project directory on the Ubuntu server:

```bash
chmod +x deploy/scripts/*.sh
./deploy/scripts/install-docker.sh
./deploy/scripts/prepare-environment.sh
```

Edit `deploy/.env` and replace the DuckDNS address/token placeholders and
application credentials. The preparation script generates the database
password and JWT secret automatically. Never commit `deploy/.env`.

Open inbound TCP ports 80 and 443 in the Oracle VCN security list. Keep SSH
port 22 open only for administration. The database port is intentionally not
published to the internet.

## Restore the existing database

Copy the latest custom-format `.dump` backup to the server, then run this only
against the newly-created empty database:

```bash
./deploy/scripts/restore-database.sh /absolute/path/to/database.dump
```

The script refuses to restore if it finds existing public tables.

Copy the contents of the current `backend/uploads` directory into the Docker
upload volume after the application has started if those historical documents
are required. On the current Windows development PC, create both transfer files
with:

```powershell
.\deploy\scripts\prepare-transfer.ps1
```

Copy `deploy/server-transfer/database.dump` and `uploads.tar.gz` to the server.
After the database restore and first application build, restore the uploads:

```bash
./deploy/scripts/restore-uploads.sh /absolute/path/to/uploads.tar.gz
```

## Start and update

```bash
./deploy/scripts/start.sh
```

After DuckDNS points to the Oracle public IP, Caddy obtains an HTTPS
certificate automatically. Visit `https://your-name.duckdns.org`.

For later code updates:

```bash
./deploy/scripts/update.sh
```

The update script accepts only fast-forward Git updates and preserves the
database and uploads volumes.

The included GitHub workflow provides a manual **Deploy production** button.
It requires repository secrets named `DEPLOY_HOST`, `DEPLOY_USER`,
`DEPLOY_PATH`, `DEPLOY_SSH_KEY`, and `DEPLOY_KNOWN_HOSTS`. Configure this only
after the first manual deployment is working.

## Backups

Run:

```bash
./deploy/scripts/backup.sh
```

The script keeps 14 days of local database/upload backups. A same-server backup
does not protect against loss of the server, so copy backups to another device
or storage account. To run it every night, add it to root's crontab after the
first successful manual backup.

## Useful checks

```bash
cd deploy
sudo docker compose --profile duckdns ps
sudo docker compose logs --tail=100 app
sudo docker compose logs --tail=100 caddy
```
