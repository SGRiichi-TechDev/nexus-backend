import { db } from '#db/index.js';
import type { PlayerInfo } from '#db/types.js';
import { playerInfo } from '#drizzle/schema.js';
import { createLogger } from '#logger/logger.js';
import { eq } from 'drizzle-orm';

const logger = createLogger('player.repository');

export const playerRepository = {
  findAll: async (): Promise<PlayerInfo[]> => {
    const start = performance.now();
    const players = await db.query.playerInfo.findMany();
    logger.debug(
      {
        query: 'findAll',
        rowCount: players.length,
        durationMs: Math.round(performance.now() - start),
      },
      'player.findAll',
    );
    return players;
  },

  findById: async (playerId: number): Promise<PlayerInfo | undefined> => {
    const start = performance.now();
    const player = await db.query.playerInfo.findFirst({
      where: { playerId },
    });
    logger.debug(
      {
        query: 'findById',
        playerId,
        rowCount: player === undefined ? 0 : 1,
        durationMs: Math.round(performance.now() - start),
      },
      'player.findById',
    );
    return player;
  },

  findByTelegramId: async (
    telegramId: number,
  ): Promise<PlayerInfo | undefined> => {
    const start = performance.now();
    const result = await db
      .select()
      .from(playerInfo)
      .where(eq(playerInfo.telegramId, telegramId))
      .limit(1);
    logger.debug(
      {
        query: 'findByTelegramId',
        telegramId,
        rowCount: result.length,
        durationMs: Math.round(performance.now() - start),
      },
      'player.findByTelegramId',
    );
    return result[0];
  },
};
