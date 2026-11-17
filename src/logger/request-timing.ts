import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request timing accumulator. Populated by repository calls made while
 * handling a request, and read by the request logger when the response ends.
 */
export type RequestTiming = {
  dbCalls: number;
  dbMs: number;
  slowestDbCall: { name: string; durationMs: number } | null;
};

const storage = new AsyncLocalStorage<RequestTiming>();

export const createRequestTiming = (): RequestTiming => ({
  dbCalls: 0,
  dbMs: 0,
  slowestDbCall: null,
});

export const runWithRequestTiming = <R>(
  timing: RequestTiming,
  fn: () => R,
): R => storage.run(timing, fn);

/** Records a repository call against the current request, if any. */
export const recordDbCall = (name: string, durationMs: number): void => {
  const timing = storage.getStore();
  if (!timing) {
    return;
  }
  timing.dbCalls += 1;
  timing.dbMs += durationMs;
  if (
    timing.slowestDbCall === null ||
    durationMs > timing.slowestDbCall.durationMs
  ) {
    timing.slowestDbCall = { name, durationMs };
  }
};

const readThreshold = (envName: string, fallback: number): number => {
  const value = Number(process.env[envName]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

/** Repository calls slower than this are logged at warn. */
export const slowDbCallMs = (): number => readThreshold('SLOW_DB_CALL_MS', 200);

/** Requests slower than this are flagged `slow: true` in the request log. */
export const slowRequestMs = (): number =>
  readThreshold('SLOW_REQUEST_MS', 500);
