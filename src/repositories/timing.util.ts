import { createLogger } from '#logger/logger.js';
import { recordDbCall, slowDbCallMs } from '#logger/request-timing.js';

const logger = createLogger('db.timing');

// biome-ignore lint/suspicious/noExplicitAny: generic wrapper must accept any repository method signature
type AsyncMethod = (...args: any[]) => Promise<unknown>;

/**
 * Wraps every method of a repository so each call is attributed to the
 * current request's timing context, and slow calls are logged at warn.
 */
export const withDbTiming = <T extends Record<string, AsyncMethod>>(
  repositoryName: string,
  repository: T,
): T => {
  const wrapped: Record<string, AsyncMethod> = {};
  for (const [method, fn] of Object.entries(repository)) {
    const name = `${repositoryName}.${method}`;
    wrapped[method] = async (...args: unknown[]) => {
      const start = performance.now();
      try {
        return await fn(...args);
      } finally {
        const durationMs = Math.round(performance.now() - start);
        recordDbCall(name, durationMs);
        if (durationMs >= slowDbCallMs()) {
          logger.warn({ call: name, durationMs }, 'Slow repository call');
        }
      }
    };
  }
  return wrapped as T;
};
