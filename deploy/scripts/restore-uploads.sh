#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 /absolute/path/to/uploads.tar.gz"
  exit 1
fi

ARCHIVE_FILE="$1"
if [[ ! -f "${ARCHIVE_FILE}" ]]; then
  echo "Uploads archive not found: ${ARCHIVE_FILE}"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${DEPLOY_DIR}"

sudo docker compose up -d app
EXISTING_COUNT="$(sudo docker compose exec -T app sh -c \
  'find /app/backend/uploads -type f | wc -l')"

if [[ "${EXISTING_COUNT}" != "0" ]]; then
  echo "Restore stopped: the upload volume already contains ${EXISTING_COUNT} file(s)."
  echo "This safety check prevents overwriting live uploads."
  exit 1
fi

sudo docker compose exec -T app \
  tar -C /app/backend/uploads -xzf - < "${ARCHIVE_FILE}"

echo "Uploads restore completed."
