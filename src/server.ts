import apiRouter from '#routes/api-router.js';
import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from 'express';

const app: Express = express();
const domain: string = process.env.DOMAIN || 'localhost';
const port: number = Number(process.env.PORT) || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Register routers
app.use('/api/v1', apiRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://${domain}:${port}`);
});

// Express error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors, // Provides detailed pathing to the schema mismatch
  });
});
