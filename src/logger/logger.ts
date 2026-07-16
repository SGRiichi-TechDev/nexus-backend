import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest =
  process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

export const logger = pino({
  level: isTest ? 'silent' : isDevelopment ? 'trace' : 'info',
  redact: [
    'DATABASE_URL',
    'req.headers.authorization',
    'req.headers.cookie',
  ],
  ...(isDevelopment
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
});

export function createLogger(module: string) {
  return logger.child({ module });
}
