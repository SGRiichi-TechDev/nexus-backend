import { db } from '#db/index.js';
import type { PlayerInfo } from '#db/types.js';
import { handPlayerResult, playerInfo } from '#drizzle/schema.js';
import { and, asc, eq, getColumns } from 'drizzle-orm';

export type HandPlayerFlag = 'riichi' | 'tenpai' | 'chombo';

export const handRepository = {
  findPlayersByFlag: (
    handId: number,
    flag: HandPlayerFlag,
  ): Promise<PlayerInfo[]> => {
    const flagColumn = handPlayerResult[flag];
    const query = db
      .select(getColumns(playerInfo))
      .from(handPlayerResult)
      .innerJoin(
        playerInfo,
        eq(handPlayerResult.playerId, playerInfo.playerId),
      )
      .where(and(eq(handPlayerResult.handId, handId), eq(flagColumn, true)));

    if (flag === 'riichi') {
      return query.orderBy(asc(handPlayerResult.riichiOrder));
    }

    return query;
  },
};
