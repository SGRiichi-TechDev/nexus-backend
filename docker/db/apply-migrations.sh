#!/usr/bin/env bash
set -euo pipefail

: "${PGHOST:=db}"
: "${PGPORT:=5432}"
: "${PGUSER:=postgres}"
: "${PGPASSWORD:=postgres}"
: "${PGDATABASE:=postgres}"
: "${MIGRATIONS_DIR:=/migrations}"
: "${SEED_FILE:=/seed.sql}"
: "${APPLY_SEED:=true}"

export PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE

echo "Waiting for Postgres at ${PGHOST}:${PGPORT}..."
until pg_isready -q; do
  sleep 1
done
echo "Postgres is ready."

psql -v ON_ERROR_STOP=1 <<'SQL'
CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version text PRIMARY KEY,
  statements text[],
  name text
);
SQL

prior_count="$(psql -Atqc 'SELECT COUNT(*) FROM supabase_migrations.schema_migrations')"
applied=0

shopt -s nullglob
migration_files=("${MIGRATIONS_DIR}"/*.sql)
IFS=$'\n' migration_files=($(printf '%s\n' "${migration_files[@]}" | LC_ALL=C sort))
unset IFS

if ((${#migration_files[@]} == 0)); then
  echo "No migration files found in ${MIGRATIONS_DIR}"
  exit 1
fi

for file in "${migration_files[@]}"; do
  base="$(basename "$file")"
  version="${base%%_*}"
  name="${base#*_}"
  name="${name%.sql}"

  if [[ ! "$version" =~ ^[0-9]+$ ]]; then
    echo "Skipping ${base} (unexpected filename; expected <timestamp>_<name>.sql)"
    continue
  fi

  exists="$(psql -Atqc "SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '${version}'")"
  if [[ "$exists" == "1" ]]; then
    echo "Skipping ${base} (already applied)"
    continue
  fi

  echo "Applying ${base}..."
  psql -v ON_ERROR_STOP=1 -f "$file"
  psql -v ON_ERROR_STOP=1 -c "INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('${version}', '${name}')"
  applied=$((applied + 1))
done

if [[ "$APPLY_SEED" == "true" && "$prior_count" == "0" && -f "$SEED_FILE" ]]; then
  echo "Applying seed ${SEED_FILE}..."
  psql -v ON_ERROR_STOP=1 -f "$SEED_FILE"
  echo "Seed applied."
elif [[ "$APPLY_SEED" == "true" && "$prior_count" != "0" ]]; then
  echo "Skipping seed (database already had migrations applied)."
fi

echo "Done. Applied ${applied} new migration(s)."
