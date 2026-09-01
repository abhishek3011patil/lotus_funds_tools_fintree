# Fintree production operations guide

This guide covers the Oracle Always Free production server at
`tarkashh-app.duckdns.org`. It explains how to move the current package-based
server to Git, make and publish code changes, deploy them, update production
environment values, create backups, and recover from a bad deployment.

## Safety rules

- Never commit or paste `deploy/.env`, SSH private keys, DuckDNS tokens,
  database passwords, JWT secrets, Razorpay secrets, email passwords, or API
  tokens.
- Never expose PostgreSQL port `5432` to the internet.
- Never run `docker compose down -v` in production. The `-v` option deletes the
  database, uploads, and HTTPS certificate volumes.
- Run `deploy/scripts/backup.sh` before database, environment, or deployment
  changes. Copy important backups off the Oracle server.
- Stage files explicitly with `git add <file>` and inspect `git diff --cached`
  before committing. Do not use `git add .` when reports, dumps, or local files
  are present.

## Production details

- Website: `https://tarkashh-app.duckdns.org`
- SSH user: `ubuntu`
- Server project path: `/home/ubuntu/fintree`
- Local Windows project path: `C:\offlice\fintree`
- Compose project name: `fintree`
- Persistent Docker volumes: database, uploads, Caddy data, and Caddy config

The public IP can change if the Oracle network interface is replaced. DuckDNS
is the stable address. If the IP changes, update DuckDNS and the GitHub
`DEPLOY_HOST` secret if that secret contains an IP instead of the domain.

## One-time: give the server read access to a private GitHub repository

Skip this section if the GitHub repository is public.

On the Ubuntu server:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/fintree_github_read -N '' -C 'fintree-production-read'
cat ~/.ssh/fintree_github_read.pub
```

Copy only the displayed `.pub` value. In GitHub, open the repository, then
**Settings -> Deploy keys -> Add deploy key**. Name it `Fintree production
read`, paste the public key, and leave **Allow write access** unchecked.

Configure the server to use that key:

```bash
cat >> ~/.ssh/config <<'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/fintree_github_read
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config
ssh-keyscan -H github.com >> ~/.ssh/known_hosts
chmod 600 ~/.ssh/known_hosts
ssh -T git@github.com
```

GitHub normally responds that authentication succeeded but shell access is not
provided. That is expected.

## One-time: move the live package-based server to a Git checkout

Do this only after all production code and the `deploy/` directory have been
committed and pushed to GitHub.

First create a production backup on Ubuntu:

```bash
cd ~/fintree
./deploy/scripts/backup.sh
```

Clone the repository beside the running package directory:

```bash
cd ~
git clone git@github.com:abhishek3011patil/lotus_funds_tools_fintree.git fintree-git
test -f ~/fintree/deploy/.env
test ! -e ~/fintree-git/deploy/.env
cp ~/fintree/deploy/.env ~/fintree-git/deploy/.env
chmod 600 ~/fintree-git/deploy/.env
chmod +x ~/fintree-git/deploy/scripts/*.sh
```

Keep the package copy as a temporary safety copy, and make the Git checkout the
standard path:

```bash
cd ~
mv fintree fintree-package-backup
mv fintree-git fintree
cd ~/fintree
./deploy/scripts/start.sh
```

Because `compose.yml` fixes the Compose project name as `fintree`, the new Git
checkout reuses the existing database, upload, and Caddy volumes. Verify the
site and login before removing the temporary `~/fintree-package-backup`
directory. Keep it until an off-server backup has also been verified.

## Normal development: change, test, commit, and push

Before starting new work in Windows PowerShell:

```powershell
cd C:\offlice\fintree
git status
git pull --ff-only origin master
```

Make the code changes, then run checks appropriate to the change:

```powershell
npm run build --prefix backend
npm run build --prefix frontend
npm run test:backend
```

Review and commit only the intended files:

```powershell
git status
git diff
git add path\to\changed-file path\to\another-file
git diff --cached
git commit -m "Describe the production change"
git push origin master
```

A push to `master` triggers `.github/workflows/deploy-production.yml` only
after the GitHub Actions variable `PRODUCTION_DEPLOY_ENABLED` is set to `true`.
The deployment runs one at a time, creates a database/uploads backup, pulls
only a fast-forward update, rebuilds the containers, and waits for health
checks.

## Manual server update

If automatic deployment is not configured or a manual retry is needed:

```powershell
ssh -i "C:\Users\Abhishek\Downloads\ssh-key-2026-09-01.key" ubuntu@tarkashh-app.duckdns.org
```

Then on Ubuntu:

```bash
cd ~/fintree
./deploy/scripts/update.sh
```

The script refuses to deploy if the server checkout contains local code
changes. Production code should be changed locally, committed, and pushed—not
edited directly on the server.

## One-time: configure GitHub Actions access to the server

Use a dedicated key for GitHub Actions. Do not put the personal Oracle private
key into GitHub.

In Windows PowerShell:

```powershell
$actionsKey = "$env:USERPROFILE\.ssh\fintree_actions_server"
ssh-keygen -t ed25519 -f $actionsKey -C "github-actions-fintree"
Get-Content "$actionsKey.pub" | ssh -i "C:\Users\Abhishek\Downloads\ssh-key-2026-09-01.key" ubuntu@tarkashh-app.duckdns.org "umask 077; mkdir -p ~/.ssh; cat >> ~/.ssh/authorized_keys"
```

Press `Enter` twice when `ssh-keygen` asks for a passphrase; an unattended
Actions key cannot prompt for one. For this deployment, the dedicated key is
already installed at `C:\Users\Abhishek\.ssh\fintree_actions_server`.

Copy the private Actions key for the `DEPLOY_SSH_KEY` secret without printing
it on screen:

```powershell
Get-Content -Raw "$env:USERPROFILE\.ssh\fintree_actions_server" | Set-Clipboard
```

Copy the already trusted host entry for the current Oracle public IP:

```powershell
(ssh-keygen -F 130.210.47.95 | Where-Object { $_ -notmatch '^#' }) -join "`n" | Set-Clipboard
```

In GitHub repository **Settings -> Secrets and variables -> Actions**, create:

- `DEPLOY_HOST`: `130.210.47.95`
- `DEPLOY_USER`: `ubuntu`
- `DEPLOY_PATH`: `/home/ubuntu/fintree`
- `DEPLOY_SSH_KEY`: the complete contents of the private
  `fintree_actions_server` file
- `DEPLOY_KNOWN_HOSTS`: the trusted host entries copied by the command above

Under the **Variables** tab, create `PRODUCTION_DEPLOY_ENABLED` with value
`true` only after the server has been migrated to the Git checkout and a manual
workflow run has succeeded. Until then, pushes are safely skipped.

Confirm the SSH host fingerprint through the Oracle console or the already
trusted local SSH connection before saving `DEPLOY_KNOWN_HOSTS`. After the
secrets are saved, open **GitHub -> Actions -> Deploy production -> Run
workflow** once as a controlled test.

## Update production environment values

The production environment exists only at `/home/ubuntu/fintree/deploy/.env`.
It is ignored by Git and must never be copied into the repository.

Create a backup, then edit it on Ubuntu:

```bash
cd ~/fintree
./deploy/scripts/backup.sh
nano deploy/.env
```

Save Nano with `Ctrl+O`, press `Enter`, and exit with `Ctrl+X`. Apply the new
values by recreating the containers:

```bash
./deploy/scripts/apply-environment.sh
```

Important environment cautions:

- Changing `DB_NAME`, `DB_USER`, or `DB_PASSWORD` does not migrate the existing
  PostgreSQL volume and can prevent the app from connecting.
- Changing `JWT_SECRET` logs users out and invalidates outstanding tokens.
- If `APP_DOMAIN`, `DUCKDNS_SUBDOMAIN`, or the Oracle public IP changes, update
  DuckDNS before applying the environment.
- Empty Razorpay values intentionally disable paid-payment endpoints; the app
  continues to run.
- Keep `EMAIL_ENABLED=false` until valid email credentials are configured.

### Enable or update Razorpay

Use Razorpay **test-mode** credentials first. Never paste keys into GitHub,
chat, commands, or committed files. Edit these values only in
`~/fintree/deploy/.env`:

```dotenv
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

Configure the Razorpay webhook destination as:

```text
https://tarkashh-app.duckdns.org/api/payments/razorpay/webhook
```

Because the public Razorpay key is included in the browser application during
its build, use the full start/build script after changing Razorpay values:

```bash
cd ~/fintree
./deploy/scripts/start.sh
```

Check configuration without revealing a key or creating a payment:

```bash
cd ~/fintree/deploy
sudo docker compose exec -T app sh -lc 'if [ -n "$RAZORPAY_KEY_ID" ] && [ -n "$RAZORPAY_KEY_SECRET" ]; then echo razorpay-configured; else echo razorpay-not-configured; fi'
sudo docker compose ps
```

Then perform one test-mode checkout and confirm the order, payment, and
webhook event in the Razorpay test dashboard. Do not switch to live keys or
make a real charge until an authorized person explicitly approves it.

## Backups

Create an immediate database and uploads backup:

```bash
cd ~/fintree
./deploy/scripts/backup.sh
ls -lh deploy/backups
```

The script retains 14 days on the server. A server-only backup does not protect
against Oracle instance loss. Copy backups to a protected local or cloud
location regularly.

For a nightly 02:15 UTC backup, edit root's cron table:

```bash
sudo crontab -e
```

Add:

```text
15 2 * * * /home/ubuntu/fintree/deploy/scripts/backup.sh >> /var/log/fintree-backup.log 2>&1
```

## Health checks and logs

```bash
cd ~/fintree/deploy
sudo docker compose --profile duckdns ps
sudo docker compose logs --tail=200 app
sudo docker compose logs --tail=200 caddy
sudo docker compose logs --tail=100 db
sudo docker stats --no-stream
df -h
```

Expected healthy services are `app`, `db`, `caddy`, and `duckdns`. PostgreSQL
has no published host port; `5432/tcp` in `docker compose ps` is internal only.

## Recover from a bad pushed change

Use a Git revert from the Windows development machine. This preserves history
and causes the normal deployment workflow to deploy the correction:

```powershell
cd C:\offlice\fintree
git log --oneline -n 10
git revert <bad-commit-id>
git push origin master
```

If GitHub Actions is unavailable, SSH to the server after pushing the revert
and run `./deploy/scripts/update.sh` manually.

## Oracle and zero-cost reminders

- Keep the compute shape, boot volume, and total tenancy resources within
  Oracle Always Free limits.
- Do not create a paid load balancer, NAT gateway, extra volume, dedicated
  host, or paid monitoring service for this deployment.
- Keep inbound ports limited to SSH `22`, HTTP `80`, and HTTPS `443`.
- Restrict SSH source CIDR to the administrator's public IP when practical.
- Never stop/delete the instance or delete its boot volume unless a verified
  recovery plan and off-server backup exist.
