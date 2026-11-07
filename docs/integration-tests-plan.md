# Integration tests for high-value controllers

## Goals

- Ephemeral integration DB on **port 54323** (Compose project `nexus-it`), never sharing the dev stack on `54322`.
- Lifecycle: **up → migrate → seed fixtures → run tests → `down -v`**.
- Cover **high-value read paths only** (not every endpoint).
- Keep existing mocked unit tests as the default `npm test`.
- Include a CI job that runs the same Docker lifecycle.

## Architecture

```mermaid
sequenceDiagram
  participant Script as testIntegrationSh
  participant Docker as ComposeNexusIt
  participant Vitest as VitestIT
  participant App as createAppSupertest
  participant DB as Postgres54323

  Script->>Docker: up db wait
  Script->>Docker: migrate plus seed.integration.sql
  Script->>Vitest: DATABASE_URL to 54323
  Vitest->>App: GET api v1
  App->>DB: Drizzle queries
  Vitest-->>Script: exit code
  Script->>Docker: down with volumes
```

## 1. Make the Express app testable

Refactor [`src/server.ts`](../src/server.ts):

- Extract `createApp(): Express` into [`src/app.ts`](../src/app.ts) (middleware, `/api/v1` router, error handler).
- `server.ts` only calls `createApp().listen(...)`.
- IT process must set `DATABASE_URL` **before** importing modules that load [`src/db/index.ts`](../src/db/index.ts) (do not load `.env` in the IT process).

## 2. Docker / seed for integration only

Reuse [`docker/docker-compose.yml`](../docker/docker-compose.yml) with overrides:

| Setting | Value |
|---------|-------|
| Project | `-p nexus-it` |
| Host port | `POSTGRES_HOST_PORT=54323` |
| Seed | new `supabase/seed.integration.sql` (small) |
| Volume | always wiped via `down -v` |

Add [`scripts/test-integration.sh`](../scripts/test-integration.sh):

1. `trap` → `docker compose -p nexus-it ... down -v` on exit/failure.
2. `up -d db --wait` with `POSTGRES_HOST_PORT=54323`.
3. `run --rm db-migrate` with `SEED_FILE` pointing at `seed.integration.sql` and `APPLY_SEED=true` (fresh volume ⇒ seed always applies via existing [`apply-migrations.sh`](../docker/db/apply-migrations.sh) logic).
4. Export `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54323/postgres`.
5. `npx vitest run --config vitest.integration.config.ts`.
6. Tear down via trap.

Do **not** use the large [`supabase/seed.sql`](../supabase/seed.sql) dump.

### Fixture seed (`supabase/seed.integration.sql`)

Minimal deterministic rows (IDs in a reserved `9xxx` range):

- 1 venue (`status=true`), 1 mode (`status=true`)
- 1 ruleset (open effective dates; uma columns filled)
- 1 `uma_positional_lookup` row so `game_info` satisfies `calculation_method='positional'` + `positional_uma_id` / null `floating_scheme_id`
- 6 `player_info` rows; Alice recorder `telegram_id=900001`, Eve recorder `telegram_id=900005`, Fran recorder `telegram_id=900006`
- Incomplete populated game: `game_id=9001`, `completed=false`, `deleted=false`, `status='draft'`, linked venue/mode/ruleset/recorder
- Incomplete empty draft: `game_id=9002`, no venue/mode/ruleset/seats/hands (Eve)
- Incomplete ruleset-only draft: `game_id=9003`, venue/mode/ruleset set, no seats/hands (Fran)
- 4 `game_result` rows (seats 0–3) with scores/positions/penalties for game 9001
- 1 completed hand: `hand_id=90010` with 4 `hand_player_result` rows + 1 `hand_win`
- One unused telegram id for 404 cases
- Requests must send `x-api-key` matching `NEXUS_API_KEY` (`test-nexus-api-key` in Vitest configs)

Constants in [`tests/integration/setup/fixtures.ts`](../tests/integration/setup/fixtures.ts). Authenticated agent helper in [`tests/integration/setup/api.ts`](../tests/integration/setup/api.ts).

## 3. Vitest integration project

Add [`vitest.integration.config.ts`](../vitest.integration.config.ts):

- `include: ['tests/integration/**/*.test.ts']`
- `fileParallelism: false`
- `NODE_ENV=test`; longer `testTimeout` (e.g. 30s)

Update [`vitest.config.ts`](../vitest.config.ts) to **exclude** `tests/integration/**`.

Add dev deps: `supertest`, `@types/supertest`.

## 4. High-value tests (first milestone)

| File | Endpoint | Assert |
|------|----------|--------|
| `api-key.test.ts` | any `/api/v1` | missing/wrong key → 401; valid key → 200 |
| `players.current-game.test.ts` | `GET /api/v1/players/current-game?telegramId=` | 200: `gameId`, `status`, 4 players; empty draft; unknown telegram → 404; non-recorder → 204 |
| `hands.details.test.ts` | `GET /api/v1/hands/:id` | 200: hand meta + seat-ordered `individualResult`; missing → 404 |
| `games.ruleset.test.ts` | `GET /api/v1/games/:id/ruleset` | 200 populated; 204 empty draft; 404 missing game |
| `games.final-score.test.ts` | `GET /api/v1/games/:id/final-score` | 200 populated; 204 empty draft; 204 ruleset-only; 404 missing game |
| `games.optional-reads.test.ts` | last-completed / last-for-next / venue-mode / players / modes | 204 or `[]` on empty draft |

Each file uses `api(createApp())` so requests include `x-api-key`.

**Out of scope for v1:** riichi/tenpai/chombo lists, mode/venue lookups, score-lookup, multiple-ron-status, penalties.

## 5. npm scripts and CI

[`package.json`](../package.json):

- `test` → unit config only (`vitest run --config vitest.config.ts`)
- `test:integration` → `bash scripts/test-integration.sh`

Add [`.github/workflows/integration-tests.yaml`](../.github/workflows/integration-tests.yaml) (mirror [`docker-db.yaml`](../.github/workflows/docker-db.yaml)):

- Path filters: `src/`, `drizzle/`, `supabase/`, `tests/integration/`, `docker/`, script
- `npm ci` → `npm run test:integration`
- `timeout-minutes: 20`

Unit CI stays mock-only.

## 6. Docs

Document in [`docker/README.md`](../docker/README.md):

- Dev DB = `54322`; IT DB = `54323` / project `nexus-it`
- `npm run test:integration` needs Docker
- Never point IT at shared `.env` / persistent volume

## Implementation order

1. Extract `createApp` — unit suite still green.
2. `seed.integration.sql` + fixtures; smoke Compose on 54323.
3. Vitest IT config, script, four test files.
4. npm scripts + CI workflow + docs.

## Risks

- Import order: `DATABASE_URL` before `#db` module load.
- `game_info` uma check constraint — seed must set method + positional uma correctly.
- Seed only runs when `prior_count == 0` — always `down -v`.

## Todos

- [x] Extract `createApp()` from `server.ts` into `src/app.ts`; keep listen in `server.ts`
- [x] Add `seed.integration.sql`, `fixtures.ts`, and `scripts/test-integration.sh` (port 54323, project `nexus-it`, trap teardown)
- [x] Add `vitest.integration.config.ts`; exclude integration from unit `vitest.config.ts`; add `supertest`
- [x] Write IT tests for current-game, hand details, ruleset, final-score
- [x] Add `test:integration` script and GitHub Actions workflow; document ports in `docker/README.md`
