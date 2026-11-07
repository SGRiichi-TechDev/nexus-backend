import { createApp } from './app.js';
import { logger } from '#logger/logger.js';

const app = createApp();
const domain: string = process.env.DOMAIN || 'localhost';
const port: number = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  logger.info({ domain, port }, 'Server listening');
});
