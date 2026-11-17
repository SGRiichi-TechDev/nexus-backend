import type { NextFunction, Request, Response } from 'express';
import {
  createRequestTiming,
  runWithRequestTiming,
} from '#logger/request-timing.js';

/**
 * Opens a timing context for the request so repository calls can be
 * aggregated (count + total DB time) and reported in the request log line.
 */
export const requestTiming = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const timing = createRequestTiming();
  res.locals.timing = timing;
  runWithRequestTiming(timing, next);
};
