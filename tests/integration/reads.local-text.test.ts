import { createApp } from '../../src/app.js';
import { db } from '../../src/db/index.js';
import { localText } from '#drizzle/schema.js';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { api } from './setup/api.js';

const app = createApp();
const client = api(app);

const scratchKey = `it-local-text-${Date.now()}`;
const scratchValue = 'IT local text value';

describe('GET /api/v1/reference/local-text/:key', () => {
  beforeAll(async () => {
    await db.insert(localText).values({ key: scratchKey, value: scratchValue });
  });

  afterAll(async () => {
    await db.delete(localText).where(eq(localText.key, scratchKey));
  });

  it('returns 200 with key and value for an existing scratch row', async () => {
    const res = await client.get(`/api/v1/reference/local-text/${scratchKey}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ key: scratchKey, value: scratchValue });
  });

  it('returns 404 for a missing key that contains a space (encoded as %20), not 500', async () => {
    const missingKeyWithSpace = `it-local-text-missing-${Date.now()} has space`;
    const encoded = encodeURIComponent(missingKeyWithSpace);

    const res = await client.get(`/api/v1/reference/local-text/${encoded}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Local text not found' });
  });

  it('returns 404 for a missing key', async () => {
    const missingKey = `it-local-text-missing-${Date.now()}`;

    const res = await client.get(`/api/v1/reference/local-text/${missingKey}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Local text not found' });
  });

  it('returns 400 when the key is whitespace only (%20)', async () => {
    const res = await client.get('/api/v1/reference/local-text/%20');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Local text key is required' });
  });

  it('returns 404 for a case-mismatched key (lookup is case-sensitive)', async () => {
    const res = await client.get(
      `/api/v1/reference/local-text/${scratchKey.toUpperCase()}`,
    );

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Local text not found' });
  });
});