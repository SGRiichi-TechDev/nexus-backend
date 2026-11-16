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

## Score units and final-score validation

All scores are stored and exchanged in **hundreds** of points (25,000 points = `250`, 45k = `450`). This applies to `ruleset_info.initial_value`, `game_result.final_score`, hand score changes and the `score_lookup` table. One riichi stick (1,000 points) is therefore `10`.

### Final-score-only completion

`PUT /api/v1/games/:id/seats/:seat/final-score` writes one seat at a time and does not validate the running total, since the tally is incomplete until all four seats are set.

`POST /api/v1/games/:id/complete` on a game with `finalScoreOnly = true` checks the tally once all four seats are seated:

```
shortfall = 4 * initialValue - sum(seat final scores)
```

The request is rejected with `400` (game stays uncompleted) when:

- `shortfall < 0` (scores exceed the pool), or
- `shortfall` is not a multiple of `10` (the implied riichi deposit is not a whole number of sticks).

A valid shortfall is the riichi deposit left on the table. Clients should validate the same rule before calling the API (the Telegram bot does so in its enter-final-score flow). Games that are not final-score-only derive scores from hands and are not affected.
