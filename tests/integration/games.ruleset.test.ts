import { createApp } from '../../src/app.js';
import { describe, expect, it } from 'vitest';
import { api } from './setup/api.js';
import { FIXTURES } from './setup/fixtures.js';

const app = createApp();
const client = api(app);

describe('GET /api/v1/games/:id/ruleset', () => {
  it('returns ruleset initial value, uma, and flags', async () => {
    const res = await client.get(`/api/v1/games/${FIXTURES.gameId}/ruleset`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(FIXTURES.ruleset);
  });

  it('returns 204 when the game exists but has no ruleset', async () => {
    const res = await client.get(
      `/api/v1/games/${FIXTURES.emptyGameId}/ruleset`,
    );

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it('returns 404 for a missing game', async () => {
    const res = await client.get('/api/v1/games/999999/ruleset');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Game not found' });
  });
});
