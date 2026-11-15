import { createApp } from '../../src/app.js';
import { describe, expect, it } from 'vitest';
import { api } from './setup/api.js';
import { FIXTURES } from './setup/fixtures.js';

const app = createApp();
const client = api(app);

/** Seeded player with telegram id; used as recorder in write-flow tests. */
const SCRATCH_PLAYER_ID = 9010;
const SCRATCH_TELEGRAM_ID = 900010;

describe('GET /api/v1/players/active-participation', () => {
  it('recorder without a seat returns 204', async () => {
    const res = await client
      .get('/api/v1/players/active-participation')
      .query({ telegramId: FIXTURES.emptyGameRecorderTelegramId });

    expect(res.status).toBe(204);
  });

  it('seeded seated player returns gameId without requiring a hand', async () => {
    const res = await client
      .get('/api/v1/players/active-participation')
      .query({ telegramId: FIXTURES.players[3].telegramId });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      gameId: FIXTURES.gameId,
    });
  });

  it('seated player without a completed hand still returns gameId', async () => {
    const gameRes = await client
      .post('/api/v1/games')
      .send({ telegramId: SCRATCH_TELEGRAM_ID });
    expect(gameRes.status).toBe(201);
    const gameId = gameRes.body.gameId as number;

    const seatRes = await client
      .post(`/api/v1/games/${gameId}/players`)
      .send({ startingSeat: 1, playerId: SCRATCH_PLAYER_ID });
    expect(seatRes.status).toBe(201);

    const res = await client
      .get('/api/v1/players/active-participation')
      .query({ telegramId: SCRATCH_TELEGRAM_ID });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ gameId });
  });
});

/**
 * Mirrors the telegram bot `/score` command API sequence:
 * 1. GET /players/active-participation (seating only)
 * 2. GET /games/:id/hands/last-completed (204 when no completed hand)
 * 3. GET /hands/:id (situation text input)
 */
describe('bot /score participation check (API sequence)', () => {
  it('not seated → participation 204 (bot: not in a game)', async () => {
    const participation = await client
      .get('/api/v1/players/active-participation')
      .query({ telegramId: FIXTURES.emptyGameRecorderTelegramId });

    expect(participation.status).toBe(204);
  });

  it('seated without completed hand → participation 200, last-completed 204', async () => {
    const gameRes = await client
      .post('/api/v1/games')
      .send({ telegramId: SCRATCH_TELEGRAM_ID });
    expect(gameRes.status).toBe(201);
    const gameId = gameRes.body.gameId as number;

    const seatRes = await client
      .post(`/api/v1/games/${gameId}/players`)
      .send({ startingSeat: 1, playerId: SCRATCH_PLAYER_ID });
    expect(seatRes.status).toBe(201);

    const participation = await client
      .get('/api/v1/players/active-participation')
      .query({ telegramId: SCRATCH_TELEGRAM_ID });
    expect(participation.status).toBe(200);
    expect(participation.body).toEqual({ gameId });

    const lastCompleted = await client.get(
      `/api/v1/games/${gameId}/hands/last-completed`,
    );
    expect(lastCompleted.status).toBe(204);
  });

  it('seated with completed hand → participation, last-completed, and hand details', async () => {
    const telegramId = FIXTURES.players[3].telegramId;

    const participation = await client
      .get('/api/v1/players/active-participation')
      .query({ telegramId });
    expect(participation.status).toBe(200);
    expect(participation.body).toEqual({ gameId: FIXTURES.gameId });

    const lastCompleted = await client.get(
      `/api/v1/games/${participation.body.gameId}/hands/last-completed`,
    );
    expect(lastCompleted.status).toBe(200);
    expect(lastCompleted.body).toEqual({ handId: FIXTURES.handId });

    const handDetails = await client.get(
      `/api/v1/hands/${lastCompleted.body.handId}`,
    );
    expect(handDetails.status).toBe(200);
    expect(handDetails.body.individualResult).toHaveLength(4);
  });
});
