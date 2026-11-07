export type ErrorFormat = 'text' | 'json';

export class AppError extends Error {
  readonly status: number;
  readonly format: ErrorFormat;

  constructor(
    message: string,
    status: number,
    format: ErrorFormat = 'json',
  ) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.format = format;
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, format: ErrorFormat = 'text') {
    super(message, 400, format);
    this.name = 'BadRequestError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, format: ErrorFormat = 'text') {
    super(message, 404, format);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, format: ErrorFormat = 'json') {
    super(message, 401, format);
    this.name = 'UnauthorizedError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
