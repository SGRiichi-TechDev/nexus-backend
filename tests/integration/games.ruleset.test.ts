import { createApp } from '../../src/app.js';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { FIXTURES } from './setup/fixtures.js';

const app = createApp();

describe('GET /api/v1/games/:id/ruleset', () => {
  it('returns ruleset initial value, uma, and flags', async () => {
    const res = await request(app).get(
      `/api/v1/games/${FIXTURES.gameId}/ruleset`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(FIXTURES.ruleset);
  });

  it('returns 404 for a missing game', async () => {
    const res = await request(app).get('/api/v1/games/999999/ruleset');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Ruleset info not found' });
  });
});
