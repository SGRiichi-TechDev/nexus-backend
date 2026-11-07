import { UnauthorizedError } from '#errors/app-error.js';
import { requireApiKey } from '#middleware/api-key.middleware.js';
import type { NextFunction, Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockRequest = (apiKey?: string): Request =>
  ({
    header: vi.fn((name: string) =>
      name.toLowerCase() === 'x-api-key' ? apiKey : undefined,
    ),
  }) as unknown as Request;

describe('requireApiKey', () => {
  const previousKey = process.env.NEXUS_API_KEY;

  beforeEach(() => {
    process.env.NEXUS_API_KEY = 'test-nexus-api-key';
  });

  afterEach(() => {
    if (previousKey === undefined) {
      delete process.env.NEXUS_API_KEY;
    } else {
      process.env.NEXUS_API_KEY = previousKey;
    }
  });

  it('calls next when the header matches NEXUS_API_KEY', () => {
    const next = vi.fn() as unknown as NextFunction;
    requireApiKey(mockRequest('test-nexus-api-key'), {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects when the header is missing', () => {
    const next = vi.fn();
    requireApiKey(
      mockRequest(undefined),
      {} as Response,
      next as unknown as NextFunction,
    );
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(next.mock.calls[0]?.[0]).toMatchObject({
      status: 401,
      message: 'Invalid or missing API key',
    });
  });

  it('rejects when the header does not match', () => {
    const next = vi.fn() as unknown as NextFunction;
    requireApiKey(mockRequest('wrong-key'), {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('rejects when NEXUS_API_KEY is unset', () => {
    delete process.env.NEXUS_API_KEY;
    const next = vi.fn();
    requireApiKey(
      mockRequest('test-nexus-api-key'),
      {} as Response,
      next as unknown as NextFunction,
    );
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(next.mock.calls[0]?.[0]).toMatchObject({
      message: 'API key is not configured',
    });
  });
});
