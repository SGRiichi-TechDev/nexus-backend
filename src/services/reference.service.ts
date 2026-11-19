import type { LocalTextDto, ScoreLookupRow } from '#db/types.js';
import { BadRequestError, NotFoundError } from '#errors/app-error.js';
import { createLogger } from '#logger/logger.js';
import { localTextRepository } from '#repositories/local-text.repository.js';
import { scoreLookupRepository } from '#repositories/score-lookup.repository.js';

const logger = createLogger('reference.service');

// score_lookup is static reference data; avoid a DB round trip on every save.
const SCORE_LOOKUP_TTL_MS = 10 * 60 * 1000;
let scoreLookupCache: { rows: ScoreLookupRow[]; expiresAt: number } | undefined;

export const referenceService = {
  getScoreLookupCached: async (): Promise<ScoreLookupRow[]> => {
    if (scoreLookupCache && scoreLookupCache.expiresAt > Date.now()) {
      return scoreLookupCache.rows;
    }
    const rows = await scoreLookupRepository.findAll();
    scoreLookupCache = { rows, expiresAt: Date.now() + SCORE_LOOKUP_TTL_MS };
    return rows;
  },

  getScoreLookup: async (): Promise<ScoreLookupRow[]> => {
    const rows = await scoreLookupRepository.findAll();
    logger.debug({ count: rows.length }, 'Resolved score lookup');
    return rows;
  },

  getLocalText: async (key: string): Promise<LocalTextDto> => {
    const trimmed = key?.trim();
    if (!trimmed) {
      throw new BadRequestError('Local text key is required', 'json');
    }
    const row = await localTextRepository.findByKey(trimmed);
    if (!row) {
      throw new NotFoundError('Local text not found', 'json');
    }
    logger.debug({ key: trimmed }, 'Resolved local text');
    return row;
  },
};
