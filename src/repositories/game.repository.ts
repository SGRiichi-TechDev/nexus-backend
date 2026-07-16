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
import { createLogger } from '#logger/logger.js';
import { and, asc, desc, eq, getColumns } from 'drizzle-orm';

const logger = createLogger('game.repository');

export const gameRepository = {
  findCurrentIncompleteByRecorder: async (
    playerId: number,
  ): Promise<CurrentGameDto | undefined> => {
    const start = performance.now();
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

    logger.debug(
      {
        query: 'findCurrentIncompleteByRecorder',
        playerId,
        rowCount: currentGame.length,
        durationMs: Math.round(performance.now() - start),
      },
      'game.findCurrentIncompleteByRecorder',
    );
    return currentGame[0];
  },

  findFirstResultByGameId: async (
    gameId: number,
  ): Promise<GameResult | undefined> => {
    const start = performance.now();
    const results = await db
      .select()
      .from(gameResult)
      .where(eq(gameResult.gameId, gameId))
      .limit(1);
    logger.debug(
      {
        query: 'findFirstResultByGameId',
        gameId,
        rowCount: results.length,
        durationMs: Math.round(performance.now() - start),
      },
      'game.findFirstResultByGameId',
    );
    return results[0];
  },

  findPlayersOrderedBySeat: async (gameId: number): Promise<PlayerInfo[]> => {
    const start = performance.now();
    const players = await db
      .select(getColumns(playerInfo))
      .from(playerInfo)
      .innerJoin(gameResult, eq(playerInfo.playerId, gameResult.playerId))
      .where(eq(gameResult.gameId, gameId))
      .orderBy(asc(gameResult.startingSeat));
    logger.debug(
      {
        query: 'findPlayersOrderedBySeat',
        gameId,
        rowCount: players.length,
        durationMs: Math.round(performance.now() - start),
      },
      'game.findPlayersOrderedBySeat',
    );
    return players;
  },

  findRulesetByGameId: async (
    gameId: number,
  ): Promise<RulesetInfoSelect | undefined> => {
    const start = performance.now();
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
    logger.debug(
      {
        query: 'findRulesetByGameId',
        gameId,
        rowCount: results.length,
        durationMs: Math.round(performance.now() - start),
      },
      'game.findRulesetByGameId',
    );
    return results[0];
  },
};
