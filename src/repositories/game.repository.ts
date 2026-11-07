import { db } from '#db/index.js';
import type {
  CurrentGameDto,
  FinalScoreDto,
  HandIdDto,
  LastHandForNextDto,
  PenaltyDto,
  PlayerInfo,
  RulesetInfoSelect,
  VenueModeDto,
} from '#db/types.js';
import {
  gameInfo,
  gameResult,
  handInfo,
  handPlayerResult,
  handWin,
  mode,
  playerInfo,
  rulesetInfo,
  venue,
} from '#drizzle/schema.js';
import { createLogger } from '#logger/logger.js';
import {
  and,
  asc,
  count,
  desc,
  eq,
  getColumns,
  isNotNull,
  max,
} from 'drizzle-orm';

const logger = createLogger('game.repository');

export const gameRepository = {
  allocateNextGameId: async (): Promise<number> => {
    const start = performance.now();
    const result = await db
      .select({ maxGameId: max(gameInfo.gameId) })
      .from(gameInfo);
    const nextId = (result[0]?.maxGameId ?? 0) + 1;
    logger.debug(
      {
        query: 'allocateNextGameId',
        nextId,
        durationMs: Math.round(performance.now() - start),
      },
      'game.allocateNextGameId',
    );
    return nextId;
  },

  insertDraftGame: async ({
    gameId,
    recordedByPid,
  }: {
    gameId: number;
    recordedByPid: number;
  }): Promise<{ gameId: number }> => {
    const start = performance.now();
    await db.insert(gameInfo).values({
      gameId,
      recordedByPid,
      calculationMethod: 'positional',
      floatingSchemeId: null,
      positionalUmaId: null,
    });
    logger.debug(
      {
        query: 'insertDraftGame',
        gameId,
        recordedByPid,
        durationMs: Math.round(performance.now() - start),
      },
      'game.insertDraftGame',
    );
    return { gameId };
  },

  updateGameFields: async (
    gameId: number,
    fields: {
      venueId?: number;
      modeId?: number;
      isRecorded?: boolean;
      deleted?: boolean;
    },
  ): Promise<void> => {
    const start = performance.now();
    await db.update(gameInfo).set(fields).where(eq(gameInfo.gameId, gameId));
    logger.debug(
      {
        query: 'updateGameFields',
        gameId,
        fields,
        durationMs: Math.round(performance.now() - start),
      },
      'game.updateGameFields',
    );
  },

  existsById: async (gameId: number): Promise<boolean> => {
    const start = performance.now();
    const result = await db
      .select({ gameId: gameInfo.gameId })
      .from(gameInfo)
      .where(eq(gameInfo.gameId, gameId))
      .limit(1);
    logger.debug(
      {
        query: 'existsById',
        gameId,
        rowCount: result.length,
        durationMs: Math.round(performance.now() - start),
      },
      'game.existsById',
    );
    return result.length > 0;
  },

  findVenueIdByGameId: async (
    gameId: number,
  ): Promise<number | undefined> => {
    const start = performance.now();
    const result = await db
      .select({ venueId: gameInfo.venueId })
      .from(gameInfo)
      .where(eq(gameInfo.gameId, gameId))
      .limit(1);
    logger.debug(
      {
        query: 'findVenueIdByGameId',
        gameId,
        rowCount: result.length,
        durationMs: Math.round(performance.now() - start),
      },
      'game.findVenueIdByGameId',
    );
    return result[0]?.venueId ?? undefined;
  },

  findCurrentIncompleteByRecorder: async (
    playerId: number,
  ): Promise<CurrentGameDto | undefined> => {
    const start = performance.now();
    const currentGame = await db
      .select({
        gameId: gameInfo.gameId,
        status: gameInfo.status,
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

  countHandWinsByHandId: async (handId: number): Promise<number> => {
    const start = performance.now();
    const result = await db
      .select({ value: count() })
      .from(handWin)
      .where(eq(handWin.handId, handId));
    const total = result[0]?.value ?? 0;
    logger.debug(
      {
        query: 'countHandWinsByHandId',
        handId,
        rowCount: total,
        durationMs: Math.round(performance.now() - start),
      },
      'game.countHandWinsByHandId',
    );
    return total;
  },

  findFirstResultByGameId: async (
    gameId: number,
  ): Promise<(typeof gameResult.$inferSelect) | undefined> => {
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

  findFinalScoreByGameId: async (
    gameId: number,
  ): Promise<FinalScoreDto | undefined> => {
    const start = performance.now();
    const [individual, settings] = await Promise.all([
      db
        .select({
          name: playerInfo.displayName,
          score: gameResult.finalScore,
          position: gameResult.finalPosition,
        })
        .from(gameResult)
        .innerJoin(playerInfo, eq(gameResult.playerId, playerInfo.playerId))
        .where(eq(gameResult.gameId, gameId))
        .orderBy(asc(gameResult.startingSeat)),
      db
        .select({
          gameId: gameInfo.gameId,
          initialValue: rulesetInfo.initialValue,
          umaP1: rulesetInfo.umaP1,
          umaP2: rulesetInfo.umaP2,
          umaP3: rulesetInfo.umaP3,
          umaP4: rulesetInfo.umaP4,
        })
        .from(gameInfo)
        .innerJoin(
          rulesetInfo,
          eq(gameInfo.rulesetId, rulesetInfo.rulesetId),
        )
        .where(eq(gameInfo.gameId, gameId))
        .limit(1),
    ]);

    logger.debug(
      {
        query: 'findFinalScoreByGameId',
        gameId,
        rowCount: individual.length,
        durationMs: Math.round(performance.now() - start),
      },
      'game.findFinalScoreByGameId',
    );

    if (!settings[0] || individual.length === 0) return undefined;

    return {
      ...settings[0],
      individual: individual.map((row) => ({
        name: row.name,
        score: row.score,
        position: Number(row.position),
      })),
    };
  },

  findPenaltiesByGameId: async (gameId: number): Promise<PenaltyDto[]> => {
    const start = performance.now();
    const rows = await db
      .select({
        name: playerInfo.displayName,
        penalty: gameResult.totalPenaltyPoints,
      })
      .from(gameResult)
      .innerJoin(playerInfo, eq(gameResult.playerId, playerInfo.playerId))
      .where(eq(gameResult.gameId, gameId))
      .orderBy(asc(gameResult.startingSeat));
    logger.debug(
      {
        query: 'findPenaltiesByGameId',
        gameId,
        rowCount: rows.length,
        durationMs: Math.round(performance.now() - start),
      },
      'game.findPenaltiesByGameId',
    );
    return rows.map((row) => ({
      name: row.name,
      penalty: Number(row.penalty ?? 0),
    }));
  },

  countCompletedHands: async (gameId: number): Promise<number> => {
    const start = performance.now();
    const result = await db
      .select({ value: count() })
      .from(handInfo)
      .where(
        and(eq(handInfo.gameId, gameId), eq(handInfo.completed, true)),
      );
    const total = result[0]?.value ?? 0;
    logger.debug(
      {
        query: 'countCompletedHands',
        gameId,
        rowCount: total,
        durationMs: Math.round(performance.now() - start),
      },
      'game.countCompletedHands',
    );
    return total;
  },

  findLastCompletedHandId: async (
    gameId: number,
  ): Promise<HandIdDto | undefined> => {
    const start = performance.now();
    const result = await db
      .select({ handId: handInfo.handId })
      .from(handInfo)
      .where(
        and(eq(handInfo.completed, true), eq(handInfo.gameId, gameId)),
      )
      .orderBy(desc(handInfo.handId))
      .limit(1);
    logger.debug(
      {
        query: 'findLastCompletedHandId',
        gameId,
        rowCount: result.length,
        durationMs: Math.round(performance.now() - start),
      },
      'game.findLastCompletedHandId',
    );
    return result[0];
  },

  findLastHandForNextInsert: async (
    gameId: number,
  ): Promise<LastHandForNextDto | undefined> => {
    const start = performance.now();
    const result = await db
      .select({
        handId: handInfo.handId,
        wind: handInfo.wind,
        roundNum: handInfo.roundNum,
        honba: handInfo.honba,
        handOutcome: handInfo.handOutcome,
        dealerOutcome: handPlayerResult.outcome,
        tenpai: handPlayerResult.tenpai,
      })
      .from(handInfo)
      .innerJoin(
        handPlayerResult,
        and(
          eq(handInfo.handId, handPlayerResult.handId),
          eq(handPlayerResult.dealer, true),
        ),
      )
      .where(and(eq(handInfo.gameId, gameId), eq(handInfo.completed, true)))
      .orderBy(desc(handInfo.handId))
      .limit(1);
    logger.debug(
      {
        query: 'findLastHandForNextInsert',
        gameId,
        rowCount: result.length,
        durationMs: Math.round(performance.now() - start),
      },
      'game.findLastHandForNextInsert',
    );
    return result[0];
  },

  findTelegramIdsByGameId: async (gameId: number): Promise<number[]> => {
    const start = performance.now();
    const rows = await db
      .select({ telegramId: playerInfo.telegramId })
      .from(gameResult)
      .innerJoin(playerInfo, eq(gameResult.playerId, playerInfo.playerId))
      .where(
        and(eq(gameResult.gameId, gameId), isNotNull(playerInfo.telegramId)),
      )
      .orderBy(asc(gameResult.startingSeat));
    logger.debug(
      {
        query: 'findTelegramIdsByGameId',
        gameId,
        rowCount: rows.length,
        durationMs: Math.round(performance.now() - start),
      },
      'game.findTelegramIdsByGameId',
    );
    return rows.map((row) => row.telegramId as number);
  },

  insertGameResult: async ({
    gameId,
    startingSeat,
    playerId,
    finalScore,
  }: {
    gameId: number;
    startingSeat: number;
    playerId: number;
    finalScore: number;
  }): Promise<void> => {
    const start = performance.now();
    await db.insert(gameResult).values({
      gameId,
      startingSeat,
      playerId,
      finalScore,
    });
    logger.debug(
      {
        query: 'insertGameResult',
        gameId,
        startingSeat,
        playerId,
        finalScore,
        durationMs: Math.round(performance.now() - start),
      },
      'game.insertGameResult',
    );
  },

  findVenueAndModeByGameId: async (
    gameId: number,
  ): Promise<VenueModeDto | undefined> => {
    const start = performance.now();
    const result = await db
      .select({
        venue: venue.name,
        mode: mode.name,
      })
      .from(gameInfo)
      .innerJoin(venue, eq(gameInfo.venueId, venue.venueId))
      .innerJoin(mode, eq(gameInfo.modeId, mode.modeId))
      .where(eq(gameInfo.gameId, gameId))
      .limit(1);
    logger.debug(
      {
        query: 'findVenueAndModeByGameId',
        gameId,
        rowCount: result.length,
        durationMs: Math.round(performance.now() - start),
      },
      'game.findVenueAndModeByGameId',
    );
    return result[0];
  },
};
