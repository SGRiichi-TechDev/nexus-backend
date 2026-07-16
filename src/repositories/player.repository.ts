import { db } from '#db/index.js';
import type { PlayerInfo } from '#db/types.js';
import { playerInfo } from '#drizzle/schema.js';
import { eq } from 'drizzle-orm';

export const playerRepository = {
  findAll: (): Promise<PlayerInfo[]> => db.query.playerInfo.findMany(),

  findById: (playerId: number): Promise<PlayerInfo | undefined> =>
    db.query.playerInfo.findFirst({
      where: { playerId },
    }),

  findByTelegramId: async (
    telegramId: number,
  ): Promise<PlayerInfo | undefined> => {
    const result = await db
      .select()
      .from(playerInfo)
      .where(eq(playerInfo.telegramId, telegramId))
      .limit(1);
    return result[0];
  },
};
