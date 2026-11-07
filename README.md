# nexus-backend
A backend web application server for Project Nexus built using Express running on Node.js

## Configuration

| Environment Variable | Description |
|----------------------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXUS_API_KEY` | Shared secret required on every `/api/v1` request as the `x-api-key` header |
| `PORT` | Listen port (default `3000`) |
| `DOMAIN` | Bind host (default `localhost`) |
| `NODE_ENV` | Runtime environment |

## Local database

For a development Supabase Postgres instance built from `supabase/migrations`, see [docker/README.md](docker/README.md).
