import { isAppError } from '#errors/app-error.js';
import { requireApiKey } from '#middleware/api-key.middleware.js';
import { requestLogger } from '#middleware/request-logger.js';
import apiRouter from '#routes/api-router.js';
import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from 'express';

export function createApp(): Express {
  const app: Express = express();

  app.use(requestLogger);
  app.use(express.json());
  app.use('/api/v1', requireApiKey, apiRouter);

  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (isAppError(err)) {
      req.log.warn(
        { err, status: err.status, name: err.name },
        err.message,
      );
      if (err.format === 'text') {
        res.status(err.status).send(err.message);
        return;
      }
      res.status(err.status).json({ error: err.message });
      return;
    }

    req.log.error({ err }, 'Unhandled error');

    if (process.env.NODE_ENV === 'production') {
      res.status(500).json({ message: 'Internal Server Error' });
      return;
    }

    const message =
      err instanceof Error ? err.message : 'Internal Server Error';
    res.status(500).json({
      message,
      errors: (err as { errors?: unknown }).errors,
    });
  });

  return app;
}
