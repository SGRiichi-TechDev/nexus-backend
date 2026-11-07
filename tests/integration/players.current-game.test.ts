import { createApp } from '../../src/app.js';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { FIXTURES } from './setup/fixtures.js';

const app = createApp();

describe('GET /api/v1/players/current-game', () => {
  it('returns the incomplete game for the recorder telegram id', async () => {
    const res = await request(app)
      .get('/api/v1/players/current-game')
      .query({ telegramId: FIXTURES.recorderTelegramId });

    expect(res.status).toBe(200);
    expect(res.body.gameId).toBe(FIXTURES.gameId);
    expect(res.body.status).toBe('draft');
    expect(res.body.players).toHaveLength(4);
    expect(res.body.players.map((p: { playerId: number }) => p.playerId)).toEqual(
      FIXTURES.players.map((p) => p.playerId),
    );
  });

  it('returns 404 for an unknown telegram id', async () => {
    const res = await request(app)
      .get('/api/v1/players/current-game')
      .query({ telegramId: FIXTURES.unusedTelegramId });

    expect(res.status).toBe(404);
  });
});
