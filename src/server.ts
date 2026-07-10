import express, { type Express, type Request, type Response } from 'express';
import playerRouter from './routes/player-routes.ts';

const app: Express = express();
const domain: string = process.env.DOMAIN || 'localhost';
const port: number = Number(process.env.PORT) || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Register routers
app.use('/api/v1', playerRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://${domain}:${port}`);
});
