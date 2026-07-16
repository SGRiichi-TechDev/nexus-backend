import { db } from '#db/index.js';
import type {
  CurrentGameDto,
  GameResult,
  PlayerInfo,
  RulesetInfoSelect,
} from '#db/types.js';
import {
  gameInfo,
  gameResult,
  handInfo,
  handWin,
  playerInfo,
  rulesetInfo,
} from '#drizzle/schema.js';
import { and, asc, desc, eq, getColumns } from 'drizzle-orm';

export const gameRepository = {
  findCurrentIncompleteByRecorder: async (
    playerId: number,
  ): Promise<CurrentGameDto | undefined> => {
    const currentGame = await db
      .select({
        gameId: gameInfo.gameId,
        submissionStage: gameInfo.submissionStage,
        handId: handInfo.handId,
        handOutcome: handInfo.handOutcome,
        isRecorded: gameInfo.isRecorded,
        han: handWin.han,
        finalScoreOnly: gameInfo.finalScoreOnly,
        multipleRon: rulesetInfo.multipleRon,
      })
      .from(gameInfo)
      .leftJoin(handInfo, eq(gameInfo.gameId, handInfo.gameId))
      .leftJoin(handWin, eq(handInfo.handId, handWin.handId))
      .leftJoin(rulesetInfo, eq(gameInfo.rulesetId, rulesetInfo.rulesetId))
      .where(
        and(
          eq(gameInfo.recordedByPid, playerId),
          eq(gameInfo.completed, false),
          eq(gameInfo.deleted, false),
        ),
      )
      .orderBy(desc(handInfo.handId))
      .limit(1);

    return currentGame[0];
  },

  findFirstResultByGameId: async (
    gameId: number,
  ): Promise<GameResult | undefined> => {
    const results = await db
      .select()
      .from(gameResult)
      .where(eq(gameResult.gameId, gameId))
      .limit(1);
    return results[0];
  },

  findPlayersOrderedBySeat: (gameId: number): Promise<PlayerInfo[]> =>
    db
      .select(getColumns(playerInfo))
      .from(playerInfo)
      .innerJoin(gameResult, eq(playerInfo.playerId, gameResult.playerId))
      .where(eq(gameResult.gameId, gameId))
      .orderBy(asc(gameResult.startingSeat)),

  findRulesetByGameId: async (
    gameId: number,
  ): Promise<RulesetInfoSelect | undefined> => {
    const results = await db
      .select({
        initialValue: rulesetInfo.initialValue,
        aka: rulesetInfo.aka,
        umaP1: rulesetInfo.umaP1,
        umaP2: rulesetInfo.umaP2,
        umaP3: rulesetInfo.umaP3,
        umaP4: rulesetInfo.umaP4,
        oka: rulesetInfo.oka,
        chomboValue: rulesetInfo.chomboValue,
        chomboOption: rulesetInfo.chomboOption,
        kiriageMangan: rulesetInfo.kiriageMangan,
        multipleRon: rulesetInfo.multipleRon,
      })
      .from(rulesetInfo)
      .innerJoin(gameInfo, eq(rulesetInfo.rulesetId, gameInfo.rulesetId))
      .where(eq(gameInfo.gameId, gameId));
    return results[0];
  },
};
