import { db } from '#db/index.js';
import type { ScoreLookupRow } from '#db/types.js';
import { scoreLookup } from '#drizzle/schema.js';
import { createLogger } from '#logger/logger.js';

const logger = createLogger('score-lookup.repository');

export const scoreLookupRepository = {
  findAll: async (): Promise<ScoreLookupRow[]> => {
    const start = performance.now();
    const rows = await db.select().from(scoreLookup);
    logger.debug(
      {
        query: 'findAll',
        rowCount: rows.length,
        durationMs: Math.round(performance.now() - start),
      },
      'scoreLookup.findAll',
    );
    return rows;
  },
};
