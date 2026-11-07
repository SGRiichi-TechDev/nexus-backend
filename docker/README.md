# Local development database

Docker Compose setup that runs a Supabase Postgres image and applies every SQL file in `supabase/migrations` (then `supabase/seed.sql` on a fresh volume).

This is a **database-only** stack for app development. It does not start Auth, Studio, Storage, or the rest of the full `supabase start` stack.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (or a compatible engine such as OrbStack)
- Port **54322** free on the host

If you already use the Supabase CLI locally, stop it first so it does not hold the same port:

```bash
supabase stop
```

## Quick start

From the repository root:

```bash
docker compose -f docker/docker-compose.yml up -d
```

Or from this directory:

```bash
cd docker
docker compose up -d
```

On first start (empty volume):

1. Postgres becomes healthy
2. `db-migrate` applies all files in `../supabase/migrations` in filename order
3. `../supabase/seed.sql` is loaded once

Later starts skip already-applied migrations and skip seeding.

## Connection

Matches the default `DATABASE_URL` in `.env` and `supabase/config.toml` (`db.port`):

```text
postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

| Setting  | Value      |
| -------- | ---------- |
| Host     | `127.0.0.1` |
| Port     | `54322`    |
| Database | `postgres` |
| User     | `postgres` |
| Password | `postgres` |

## Common commands

```bash
# Start (detached)
docker compose -f docker/docker-compose.yml up -d

# Follow migrate logs
docker compose -f docker/docker-compose.yml logs -f db-migrate

# Stop (keep data volume)
docker compose -f docker/docker-compose.yml down

# Stop and wipe data (re-run all migrations + seed on next up)
docker compose -f docker/docker-compose.yml down -v

# Check status
docker compose -f docker/docker-compose.yml ps
```

## Applying new migrations

1. Add a migration under `supabase/migrations` (prefer `npx supabase migration new <name>`).
2. Restart the migrate one-shot service:

```bash
docker compose -f docker/docker-compose.yml up db-migrate
```

Only versions not yet recorded in `supabase_migrations.schema_migrations` are applied. Seed is not re-run.

To rebuild schema and seed from scratch:

```bash
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d
```

## Configuration

| Variable             | Default | Description                                      |
| -------------------- | ------- | ------------------------------------------------ |
| `POSTGRES_HOST_PORT` | `54322` | Host port mapped to Postgres                     |
| `APPLY_SEED`         | `true`  | Set to `false` to skip `seed.sql` on a fresh DB |

Examples:

```bash
POSTGRES_HOST_PORT=55432 docker compose -f docker/docker-compose.yml up -d
APPLY_SEED=false docker compose -f docker/docker-compose.yml up -d
```

## Layout

```text
docker/
  README.md                 # this file
  docker-compose.yml        # db + db-migrate services
  db/
    apply-migrations.sh     # ordered migration + seed runner
```

Migrations and seed stay in `supabase/` so they remain the same source of truth used by the Supabase CLI.

## Relation to `supabase start`

| Approach                         | What you get                                      |
| -------------------------------- | ------------------------------------------------- |
| This Compose file                | Postgres + migrations + seed                      |
| `supabase start`                 | Full local stack (API, Auth, Studio, Storage, …)  |

Do not run both at once on the default ports; they both bind **54322**.
