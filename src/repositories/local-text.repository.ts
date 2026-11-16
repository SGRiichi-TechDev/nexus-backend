import { eq } from 'drizzle-orm';
import { db } from '#db/index.js';
import type { LocalTextDto } from '#db/types.js';
import { localText } from '#drizzle/schema.js';
import { createLogger } from '#logger/logger.js';

const logger = createLogger('local-text.repository');

export const localTextRepository = {
  findByKey: async (key: string): Promise<LocalTextDto | undefined> => {
    const start = performance.now();
    const result = await db
      .select({ key: localText.key, value: localText.value })
      .from(localText)
      .where(eq(localText.key, key))
      .limit(1);
    logger.debug(
      {
        query: 'findByKey',
        key,
        rowCount: result.length,
        durationMs: Math.round(performance.now() - start),
      },
      'localText.findByKey',
    );
    return result[0];
  },
};
