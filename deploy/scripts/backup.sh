#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKUP_DIR="${DEPLOY_DIR}/backups"
STAMP="$(date -u +%Y%m%d_%H%M%S)"
mkdir -p "${BACKUP_DIR}"
cd "${DEPLOY_DIR}"

sudo docker compose exec -T db sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > "${BACKUP_DIR}/database_${STAMP}.dump"

sudo docker compose exec -T app \
  tar -C /app/backend/uploads -czf - . \
  > "${BACKUP_DIR}/uploads_${STAMP}.tar.gz"

find "${BACKUP_DIR}" -type f -mtime +14 -delete
echo "Backup created in ${BACKUP_DIR}. Copy it off the server regularly."
