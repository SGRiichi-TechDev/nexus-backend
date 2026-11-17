import type { IncomingMessage, ServerResponse } from 'node:http';
import { pinoHttp } from 'pino-http';
import { logger } from '#logger/logger.js';
import { type RequestTiming, slowRequestMs } from '#logger/request-timing.js';

type LogObject = { responseTime?: number } & Record<string, unknown>;

// Adds DB timing totals and a slow flag to the completed-request log line.
const withTiming = (res: ServerResponse, val: LogObject): LogObject => {
  const timing = (res as { locals?: { timing?: RequestTiming } }).locals
    ?.timing;
  const responseTime = val.responseTime;
  return {
    ...val,
    ...(timing
      ? {
          dbCalls: timing.dbCalls,
          dbMs: timing.dbMs,
          slowestDbCall: timing.slowestDbCall,
          ...(responseTime !== undefined
            ? { appMs: Math.max(0, responseTime - timing.dbMs) }
            : {}),
        }
      : {}),
    slow: responseTime !== undefined && responseTime >= slowRequestMs(),
  };
};

export const requestLogger = pinoHttp({
  logger,
  customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error) => {
    if (err || res.statusCode >= 500) {
      return 'error';
    }
    if (res.statusCode >= 400) {
      return 'warn';
    }
    return 'info';
  },
  customSuccessObject: (_req, res, val: LogObject) => withTiming(res, val),
  customErrorObject: (_req, res, _err, val: LogObject) => withTiming(res, val),
  // Slim serializers: avoid logging every header (may contain secrets) and keep lines small.
  serializers: {
    req: (req: { id: unknown; method: string; url: string }) => ({
      id: req.id,
      method: req.method,
      url: req.url,
    }),
    res: (res: { statusCode: number }) => ({
      statusCode: res.statusCode,
    }),
  },
});
