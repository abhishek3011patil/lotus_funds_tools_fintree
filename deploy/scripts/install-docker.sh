#!/usr/bin/env bash
set -euo pipefail

sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2 ca-certificates curl
sudo systemctl enable --now docker

echo "Docker is installed and running."
echo "Use 'sudo docker compose' for the deployment commands."
