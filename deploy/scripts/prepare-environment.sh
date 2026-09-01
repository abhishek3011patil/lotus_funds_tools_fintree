#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${DEPLOY_DIR}/.env"

if [[ -f "${ENV_FILE}" ]]; then
  echo "${ENV_FILE} already exists; no secrets were changed."
  exit 0
fi

cp "${DEPLOY_DIR}/.env.example" "${ENV_FILE}"
DB_SECRET="$(openssl rand -hex 32)"
JWT_SECRET_VALUE="$(openssl rand -hex 64)"

sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_SECRET}|" "${ENV_FILE}"
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET_VALUE}|" "${ENV_FILE}"
chmod 600 "${ENV_FILE}"

echo "Created ${ENV_FILE} with random database and JWT secrets."
echo "Now edit the address, DuckDNS token, and application credentials in that file."
