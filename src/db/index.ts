import { relations } from '#drizzle/relations.js';
import { logger } from '#logger/logger.js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  logger.fatal('DATABASE_URL is required');
  throw new Error('DATABASE_URL is required');
}

const client = postgres(databaseUrl);
export const db = drizzle({ client, relations });
