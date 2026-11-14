import type { LocalTextDto, ScoreLookupRow } from '#db/types.js';
import { BadRequestError, NotFoundError } from '#errors/app-error.js';
import { createLogger } from '#logger/logger.js';
import { localTextRepository } from '#repositories/local-text.repository.js';
import { scoreLookupRepository } from '#repositories/score-lookup.repository.js';

const logger = createLogger('reference.service');

export const referenceService = {
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
