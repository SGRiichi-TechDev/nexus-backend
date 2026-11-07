import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
    env: {
      NODE_ENV: 'test',
      NEXUS_API_KEY: 'test-nexus-api-key',
      // Always pin to the ephemeral IT DB; do not inherit a shared .env DATABASE_URL.
      DATABASE_URL:
        'postgresql://postgres:postgres@127.0.0.1:54323/postgres',
    },
  },
});
