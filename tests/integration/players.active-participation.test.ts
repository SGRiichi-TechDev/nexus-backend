import { createApp } from '../../src/app.js';
import { describe, expect, it } from 'vitest';
import { api } from './setup/api.js';
import { FIXTURES } from './setup/fixtures.js';

const app = createApp();
const client = api(app);

/** Seeded player with telegram id; unused until a test creates a game for them. */
const SCRATCH_PLAYER_ID = 9010;
const SCRATCH_TELEGRAM_ID = 900010;

async function clearScratchActiveGames(): Promise<void> {
  // Write-flow ITs leave many incomplete games recorded by scratch (900010).
  // Soft-delete until active-participation reports inactive.
  const maxDeletes = 100;
  for (let i = 0; i < maxDeletes; i += 1) {
    const roles = await client
      .get('/api/v1/players/active-participation')
      .query({ telegramId: SCRATCH_TELEGRAM_ID });
    expect(roles.status).toBe(200);
    if (!roles.body.isParticipant || roles.body.gameId == null) {
      return;
    }
    const del = await client
      .patch(`/api/v1/games/${roles.body.gameId}`)
      .send({ deleted: true });
    expect(del.status).toBe(200);
  }
  throw new Error(
    `scratch player ${SCRATCH_TELEGRAM_ID} still active after ${maxDeletes} soft-deletes`,
  );
}

describe('GET /api/v1/players/active-participation', () => {
  it('player with no active game has both role flags false', async () => {
    await clearScratchActiveGames();

    const res = await client
      .get('/api/v1/players/active-participation')
      .query({ telegramId: SCRATCH_TELEGRAM_ID });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      isParticipant: false,
      isRecorder: false,
      gameId: null,
    });
  });

  it('recorder without a seat is participant and recorder', async () => {
    const res = await client
      .get('/api/v1/players/active-participation')
      .query({ telegramId: FIXTURES.emptyGameRecorderTelegramId });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      isParticipant: true,
      isRecorder: true,
      gameId: FIXTURES.emptyGameId,
    });
  });

  it('seeded seated non-recorder is participant only', async () => {
    const res = await client
      .get('/api/v1/players/active-participation')
      .query({ telegramId: FIXTURES.players[3].telegramId });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      isParticipant: true,
      isRecorder: false,
      gameId: FIXTURES.gameId,
    });
  });

  it('seeded recorder who is also seated has both role flags', async () => {
    const res = await client
      .get('/api/v1/players/active-participation')
      .query({ telegramId: FIXTURES.recorderTelegramId });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      isParticipant: true,
      isRecorder: true,
      gameId: FIXTURES.gameId,
    });
  });

  it('creating and seating a game flips scratch player to both role flags', async () => {
    await clearScratchActiveGames();

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
    expect(res.body).toEqual({
      isParticipant: true,
      isRecorder: true,
      gameId,
    });
  });
});

/**
 * Mirrors the telegram bot `/score` command API sequence:
 * 1. GET /players/active-participation (roles + gameId)
 * 2. GET /games/:id/hands/last-completed (204 when no completed hand)
 * 3. GET /hands/:id (situation text input)
 */
describe('bot /score participation check (API sequence)', () => {
  it('unknown telegram → 404 (bot maps to not in a game)', async () => {
    const participation = await client
      .get('/api/v1/players/active-participation')
      .query({ telegramId: FIXTURES.unusedTelegramId });

    expect(participation.status).toBe(404);
  });

  it('participant without completed hand → roles + last-completed 204', async () => {
    const participation = await client
      .get('/api/v1/players/active-participation')
      .query({ telegramId: FIXTURES.emptyGameRecorderTelegramId });
    expect(participation.status).toBe(200);
    expect(participation.body.isParticipant).toBe(true);
    expect(participation.body.gameId).toBe(FIXTURES.emptyGameId);

    const lastCompleted = await client.get(
      `/api/v1/games/${FIXTURES.emptyGameId}/hands/last-completed`,
    );
    expect(lastCompleted.status).toBe(204);
  });

  it('seated with completed hand → participation, last-completed, and hand details', async () => {
    const telegramId = FIXTURES.players[3].telegramId;

    const participation = await client
      .get('/api/v1/players/active-participation')
      .query({ telegramId });
    expect(participation.status).toBe(200);
    expect(participation.body).toMatchObject({
      isParticipant: true,
      isRecorder: false,
      gameId: FIXTURES.gameId,
    });

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
