import { db } from '#db/index.js';
import type { ModeIdDto, ModeNameDto } from '#db/types.js';
import { gameInfo, mode } from '#drizzle/schema.js';
import { createLogger } from '#logger/logger.js';
import { and, eq, ilike } from 'drizzle-orm';

const logger = createLogger('mode.repository');

export const modeRepository = {
  findActiveByVenueId: async (venueId: number): Promise<ModeNameDto[]> => {
    const start = performance.now();
    const rows = await db
      .select({ name: mode.name })
      .from(mode)
      .where(and(eq(mode.venueId, venueId), eq(mode.status, true)));
    logger.debug(
      {
        query: 'findActiveByVenueId',
        venueId,
        rowCount: rows.length,
        durationMs: Math.round(performance.now() - start),
      },
      'mode.findActiveByVenueId',
    );
    return rows;
  },

  findModeIdByGameAndName: async (
    gameId: number,
    modeName: string,
  ): Promise<ModeIdDto | undefined> => {
    const start = performance.now();
    const result = await db
      .select({ modeId: mode.modeId })
      .from(mode)
      .innerJoin(gameInfo, eq(gameInfo.venueId, mode.venueId))
      .where(and(eq(gameInfo.gameId, gameId), ilike(mode.name, modeName)))
      .limit(1);
    logger.debug(
      {
        query: 'findModeIdByGameAndName',
        gameId,
        modeName,
        rowCount: result.length,
        durationMs: Math.round(performance.now() - start),
      },
      'mode.findModeIdByGameAndName',
    );
    return result[0];
  },
};
