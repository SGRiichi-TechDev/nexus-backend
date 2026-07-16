import { db } from '#db/index.js';
import type { PlayerInfo } from '#db/types.js';
import { handPlayerResult, playerInfo } from '#drizzle/schema.js';
import { createLogger } from '#logger/logger.js';
import { and, asc, eq, getColumns } from 'drizzle-orm';

const logger = createLogger('hand.repository');

export type HandPlayerFlag = 'riichi' | 'tenpai' | 'chombo';

export const handRepository = {
  findPlayersByFlag: async (
    handId: number,
    flag: HandPlayerFlag,
  ): Promise<PlayerInfo[]> => {
    const start = performance.now();
    const flagColumn = handPlayerResult[flag];
    const query = db
      .select(getColumns(playerInfo))
      .from(handPlayerResult)
      .innerJoin(
        playerInfo,
        eq(handPlayerResult.playerId, playerInfo.playerId),
      )
      .where(and(eq(handPlayerResult.handId, handId), eq(flagColumn, true)));

    const players =
      flag === 'riichi'
        ? await query.orderBy(asc(handPlayerResult.riichiOrder))
        : await query;

    logger.debug(
      {
        query: 'findPlayersByFlag',
        handId,
        flag,
        rowCount: players.length,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.findPlayersByFlag',
    );
    return players;
  },
};
