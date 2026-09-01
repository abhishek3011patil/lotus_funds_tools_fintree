#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${DEPLOY_DIR}"

if [[ ! -f .env ]]; then
  echo "Missing deploy/.env. Run scripts/prepare-environment.sh first."
  exit 1
fi

chmod 600 .env
sudo docker compose \
  --profile duckdns \
  up -d --force-recreate --remove-orphans --wait --wait-timeout 300
sudo docker compose --profile duckdns ps

echo "Environment changes applied."
