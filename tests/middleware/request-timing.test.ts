import { describe, expect, it } from 'vitest';
import {
  createRequestTiming,
  runWithRequestTiming,
} from '#logger/request-timing.js';
import { withDbTiming } from '#repositories/timing.util.js';

const repo = withDbTiming('fake', {
  ok: async (n: number) => n * 2,
  fail: async () => {
    throw new Error('boom');
  },
});

describe('request timing', () => {
  it('aggregates repository calls made inside the request context', async () => {
    const timing = createRequestTiming();
    await runWithRequestTiming(timing, async () => {
      expect(await repo.ok(2)).toBe(4);
      await expect(repo.fail()).rejects.toThrow('boom');
    });

    expect(timing.dbCalls).toBe(2);
    expect(timing.dbMs).toBeGreaterThanOrEqual(0);
    expect(timing.slowestDbCall?.name).toMatch(/^fake\./);
  });

  it('ignores calls made outside a request context', async () => {
    const timing = createRequestTiming();
    await repo.ok(1);
    expect(timing.dbCalls).toBe(0);
  });
});
