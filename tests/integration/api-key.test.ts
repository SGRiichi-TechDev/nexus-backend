import { createApp } from '../../src/app.js';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { api } from './setup/api.js';
import { FIXTURES } from './setup/fixtures.js';

const app = createApp();
const client = api(app);

describe('API key middleware', () => {
  it('rejects requests without an x-api-key header', async () => {
    const res = await request(app).get(
      `/api/v1/games/${FIXTURES.gameId}/ruleset`,
    );

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid or missing API key' });
  });

  it('rejects requests with the wrong API key', async () => {
    const res = await request(app)
      .get(`/api/v1/games/${FIXTURES.gameId}/ruleset`)
      .set('x-api-key', 'wrong-key');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid or missing API key' });
  });

  it('allows requests with the configured API key', async () => {
    const res = await client.get(`/api/v1/games/${FIXTURES.gameId}/ruleset`);

    expect(res.status).toBe(200);
  });
});
