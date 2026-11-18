import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import {
  createRequestTiming,
  runWithRequestTiming,
} from '../../src/logger/request-timing.js';
import { playerService } from '../../src/services/player.service.js';
import { api } from './setup/api.js';
import { FIXTURES } from './setup/fixtures.js';

const app = createApp();
const client = api(app);

describe('GET /api/v1/players/current-game', () => {
  it('returns the incomplete game for the recorder telegram id', async () => {
    const res = await client
      .get('/api/v1/players/current-game')
      .query({ telegramId: FIXTURES.recorderTelegramId });

    expect(res.status).toBe(200);
    expect(res.body.gameId).toBe(FIXTURES.gameId);
    expect(res.body.status).toBe('draft');
    expect(res.body.players).toHaveLength(4);
    expect(
      res.body.players.map((p: { playerId: number }) => p.playerId),
    ).toEqual(FIXTURES.players.slice(0, 4).map((p) => p.playerId));
  });

  it('returns 404 for an unknown telegram id', async () => {
    const res = await client
      .get('/api/v1/players/current-game')
      .query({ telegramId: FIXTURES.unusedTelegramId });

    expect(res.status).toBe(404);
  });

  it('returns 204 when the player has no incomplete game as recorder', async () => {
    const res = await client
      .get('/api/v1/players/current-game')
      .query({ telegramId: FIXTURES.players[1].telegramId });

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it('returns a draft with null hand when the recorder has an empty incomplete game', async () => {
    const res = await client
      .get('/api/v1/players/current-game')
      .query({ telegramId: FIXTURES.emptyGameRecorderTelegramId });

    expect(res.status).toBe(200);
    expect(res.body.gameId).toBe(FIXTURES.emptyGameId);
    expect(res.body.handId).toBeNull();
    expect(res.body.players).toEqual([]);
  });
});

describe('playerService.getCurrentGame', () => {
  it('resolves the session in a single DB call', async () => {
    const timing = createRequestTiming();
    const session = await runWithRequestTiming(timing, () =>
      playerService.getCurrentGame(FIXTURES.recorderTelegramId),
    );

    expect(session?.gameId).toBe(FIXTURES.gameId);
    expect(session?.players).toHaveLength(4);
    expect(timing.dbCalls).toBe(1);
  });
});
