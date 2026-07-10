import apiRouter from '#routes/api-router.ts';
import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import * as OpenApiValidator from 'express-openapi-validator';

const app: Express = express();
const domain: string = process.env.DOMAIN || 'localhost';
const port: number = Number(process.env.PORT) || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// OpenAPI Validator Middleware
app.use(
  OpenApiValidator.middleware({
    apiSpec: './api/openapi.yaml',
    validateRequests: true,
    validateResponses: true,
  }),
);

// Register routers
app.use('/api/v1', apiRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://${domain}:${port}`);
});

// OpenAPI specification endpoint
app.use('/spec', express.static('./api/openapi.yaml'));

// Express error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors, // Provides detailed pathing to the schema mismatch
  });
});
