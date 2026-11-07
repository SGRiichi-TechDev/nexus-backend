import { UnauthorizedError } from '#errors/app-error.js';
import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const HEADER = 'x-api-key';

const keysEqual = (provided: string, expected: string): boolean => {
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }
  return timingSafeEqual(providedBuf, expectedBuf);
};

export const requireApiKey = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const expected = process.env.NEXUS_API_KEY;
  if (!expected) {
    next(new UnauthorizedError('API key is not configured', 'json'));
    return;
  }

  const provided = req.header(HEADER);
  if (!provided || !keysEqual(provided, expected)) {
    next(new UnauthorizedError('Invalid or missing API key', 'json'));
    return;
  }

  next();
};
