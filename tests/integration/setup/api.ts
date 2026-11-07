import type { Express } from 'express';
import request from 'supertest';

const apiKey = (): string => {
  const key = process.env.NEXUS_API_KEY;
  if (!key) {
    throw new Error('NEXUS_API_KEY must be set for integration tests');
  }
  return key;
};

/** Supertest agent that attaches the shared integration API key. */
export const api = (app: Express) => {
  const key = apiKey();
  return {
    get: (url: string) => request(app).get(url).set('x-api-key', key),
    post: (url: string) => request(app).post(url).set('x-api-key', key),
    patch: (url: string) => request(app).patch(url).set('x-api-key', key),
  };
};
