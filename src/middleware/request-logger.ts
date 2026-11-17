import type { IncomingMessage, ServerResponse } from 'node:http';
import { pinoHttp } from 'pino-http';
import { logger } from '#logger/logger.js';

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
