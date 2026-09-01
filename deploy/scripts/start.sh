#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${DEPLOY_DIR}"

if [[ ! -f .env ]]; then
  echo "Missing deploy/.env. Run scripts/prepare-environment.sh first."
  exit 1
fi

sudo docker compose --profile duckdns up -d --build
sudo docker compose --profile duckdns ps
