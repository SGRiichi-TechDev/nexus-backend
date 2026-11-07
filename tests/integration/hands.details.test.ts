import { createApp } from '../../src/app.js';
import { describe, expect, it } from 'vitest';
import { api } from './setup/api.js';
import { FIXTURES } from './setup/fixtures.js';

const app = createApp();
const client = api(app);

describe('GET /api/v1/hands/:id', () => {
  it('returns hand meta and seat-ordered individual results', async () => {
    const res = await client.get(`/api/v1/hands/${FIXTURES.handId}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      handNum: 1,
      wind: 'E',
      roundNum: 1,
      honba: 0,
      handOutcome: 'Tsumo',
      riichiDeposits: 0,
      han: 3,
      fu: 30,
      handValue: 3900,
    });
    expect(res.body.individualResult).toHaveLength(4);
    expect(
      res.body.individualResult.map((r: { displayName: string }) => r.displayName),
    ).toEqual(FIXTURES.players.slice(0, 4).map((p) => p.displayName));
  });

  it('returns 404 for a missing hand', async () => {
    const res = await client.get('/api/v1/hands/999999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Hand not found' });
  });
});
