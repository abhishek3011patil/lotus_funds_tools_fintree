#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 /absolute/path/to/database.dump"
  exit 1
fi

DUMP_FILE="$1"
if [[ ! -f "${DUMP_FILE}" ]]; then
  echo "Backup not found: ${DUMP_FILE}"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${DEPLOY_DIR}"

sudo docker compose up -d db

until sudo docker compose exec -T db sh -c \
  'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >/dev/null 2>&1; do
  sleep 2
done

TABLE_COUNT="$(sudo docker compose exec -T db sh -c \
  'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT count(*) FROM pg_tables WHERE schemaname = '\''public'\'';"')"
if [[ "${TABLE_COUNT}" != "0" ]]; then
  echo "Restore stopped: the database already contains ${TABLE_COUNT} public table(s)."
  echo "This safety check prevents accidentally overwriting a live database."
  exit 1
fi

echo "Restoring ${DUMP_FILE} into the new empty database..."
sudo docker compose exec -T db sh -c \
  'pg_restore --no-owner --no-privileges -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  < "${DUMP_FILE}"

echo "Database restore completed."
