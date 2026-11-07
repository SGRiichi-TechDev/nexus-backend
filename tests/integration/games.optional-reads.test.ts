import { createApp } from '../../src/app.js';
import { describe, expect, it } from 'vitest';
import { api } from './setup/api.js';
import { FIXTURES } from './setup/fixtures.js';

const app = createApp();
const client = api(app);

describe('optional singular game resources on an empty draft', () => {
  it('returns 204 for last completed hand when none exist', async () => {
    const res = await client.get(
      `/api/v1/games/${FIXTURES.emptyGameId}/hands/last-completed`,
    );

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it('returns 204 for last hand for next when none exist', async () => {
    const res = await client.get(
      `/api/v1/games/${FIXTURES.emptyGameId}/hands/last-for-next`,
    );

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it('returns 204 for venue-mode when unset', async () => {
    const res = await client.get(
      `/api/v1/games/${FIXTURES.emptyGameId}/venue-mode`,
    );

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it('returns empty players for a draft with no seats', async () => {
    const res = await client.get(
      `/api/v1/games/${FIXTURES.emptyGameId}/players`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns empty modes when the game has no venue', async () => {
    const res = await client.get(`/api/v1/games/${FIXTURES.emptyGameId}/modes`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
