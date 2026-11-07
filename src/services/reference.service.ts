import type { ScoreLookupRow } from '#db/types.js';
import { createLogger } from '#logger/logger.js';
import { scoreLookupRepository } from '#repositories/score-lookup.repository.js';

const logger = createLogger('reference.service');

export const referenceService = {
  getScoreLookup: async (): Promise<ScoreLookupRow[]> => {
    const rows = await scoreLookupRepository.findAll();
    logger.debug({ count: rows.length }, 'Resolved score lookup');
    return rows;
  },
};
