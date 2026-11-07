import { db } from '#db/index.js';
import { rulesetInfo } from '#drizzle/schema.js';
import { createLogger } from '#logger/logger.js';
import { and, asc, gte, isNull, lte, or } from 'drizzle-orm';

const logger = createLogger('ruleset.repository');

export const rulesetRepository = {
  findAvailableNames: async (): Promise<string[]> => {
    const start = performance.now();
    const now = new Date();
    const rows = await db
      .select({ name: rulesetInfo.name })
      .from(rulesetInfo)
      .where(
        and(
          or(
            isNull(rulesetInfo.effectiveStart),
            lte(rulesetInfo.effectiveStart, now),
          ),
          or(
            isNull(rulesetInfo.effectiveEnd),
            gte(rulesetInfo.effectiveEnd, now),
          ),
        ),
      )
      .orderBy(asc(rulesetInfo.name));
    logger.debug(
      {
        query: 'findAvailableNames',
        rowCount: rows.length,
        durationMs: Math.round(performance.now() - start),
      },
      'ruleset.findAvailableNames',
    );
    return rows.map((row) => row.name);
  },
};
