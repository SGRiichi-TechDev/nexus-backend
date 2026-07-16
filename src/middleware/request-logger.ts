import { logger } from '#logger/logger.js';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { pinoHttp } from 'pino-http';

export const requestLogger = pinoHttp({
  logger,
  customLogLevel: (
    _req: IncomingMessage,
    res: ServerResponse,
    err?: Error,
  ) => {
    if (err || res.statusCode >= 500) {
      return 'error';
    }
    if (res.statusCode >= 400) {
      return 'warn';
    }
    return 'info';
  },
});
