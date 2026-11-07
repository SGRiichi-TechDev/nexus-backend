import { createApp } from '../../src/app.js';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { FIXTURES } from './setup/fixtures.js';

const app = createApp();

describe('GET /api/v1/games/:id/final-score', () => {
  it('returns individual scores and uma fields', async () => {
    const res = await request(app).get(
      `/api/v1/games/${FIXTURES.gameId}/final-score`,
    );

    expect(res.status).toBe(200);
    expect(res.body.gameId).toBe(FIXTURES.gameId);
    expect(res.body.initialValue).toBe(FIXTURES.ruleset.initialValue);
    expect(res.body.umaP1).toBe(FIXTURES.ruleset.umaP1);
    expect(res.body.umaP2).toBe(FIXTURES.ruleset.umaP2);
    expect(res.body.umaP3).toBe(FIXTURES.ruleset.umaP3);
    expect(res.body.umaP4).toBe(FIXTURES.ruleset.umaP4);
    expect(res.body.individual).toEqual([...FIXTURES.finalScores]);
  });

  it('returns 404 for a missing game', async () => {
    const res = await request(app).get('/api/v1/games/999999/final-score');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Game not found' });
  });
});
