#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE=(docker compose -p nexus-it -f "${ROOT_DIR}/docker/docker-compose.yml")
export POSTGRES_HOST_PORT=54323

cleanup() {
  "${COMPOSE[@]}" down -v --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

# Always start from a fresh volume so APPLY_SEED runs (seed only applies when prior_count == 0).
echo "Tearing down any leftover nexus-it stack..."
cleanup

echo "Starting integration Postgres on port ${POSTGRES_HOST_PORT}..."
"${COMPOSE[@]}" up -d db --wait

echo "Applying migrations and integration seed..."
"${COMPOSE[@]}" run --rm \
  -e APPLY_SEED=true \
  -e SEED_FILE=/seed.integration.sql \
  -v "${ROOT_DIR}/supabase/seed.integration.sql:/seed.integration.sql:ro" \
  db-migrate

export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:${POSTGRES_HOST_PORT}/postgres"
export NODE_ENV=test

echo "Running integration tests..."
cd "${ROOT_DIR}"
npx vitest run --config vitest.integration.config.ts
