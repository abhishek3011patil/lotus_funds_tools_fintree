#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "${PROJECT_DIR}"

if [[ ! -d .git ]]; then
  echo "Update stopped because ${PROJECT_DIR} is not a Git checkout."
  echo "Follow deploy/OPERATIONS.md to migrate the package-based server safely."
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Update stopped because the server checkout contains local code changes."
  exit 1
fi

echo "Creating a pre-deployment database and uploads backup..."
"${SCRIPT_DIR}/backup.sh"

git pull --ff-only
sudo docker compose \
  --project-directory deploy \
  -f deploy/compose.yml \
  --profile duckdns \
  up -d --build --remove-orphans --wait --wait-timeout 300

sudo docker image prune -f
sudo docker compose \
  --project-directory deploy \
  -f deploy/compose.yml \
  --profile duckdns \
  ps
echo "Application update completed."
