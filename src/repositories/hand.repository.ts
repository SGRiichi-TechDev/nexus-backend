import { db } from '#db/index.js';
import type {
  HandDetailsDto,
  MultipleRonStatusDto,
  PlayerInfo,
  ScoreCalcInputDto,
} from '#db/types.js';
import {
  gameInfo,
  gameResult,
  handInfo,
  handPlayerResult,
  handWin,
  playerInfo,
  rulesetInfo,
} from '#drizzle/schema.js';
import { createLogger } from '#logger/logger.js';
import { and, asc, count, eq, getColumns, isNotNull } from 'drizzle-orm';

const logger = createLogger('hand.repository');

export type HandPlayerFlag = 'riichi' | 'tenpai' | 'chombo';

export const handRepository = {
  existsById: async (handId: number): Promise<boolean> => {
    const start = performance.now();
    const result = await db
      .select({ handId: handInfo.handId })
      .from(handInfo)
      .where(eq(handInfo.handId, handId))
      .limit(1);
    logger.debug(
      {
        query: 'existsById',
        handId,
        rowCount: result.length,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.existsById',
    );
    return result.length > 0;
  },

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

  findHandDetails: async (
    handId: number,
  ): Promise<HandDetailsDto | undefined> => {
    const start = performance.now();
    const handRow = await db
      .select()
      .from(handInfo)
      .where(eq(handInfo.handId, handId))
      .limit(1);

    if (!handRow[0]) {
      logger.debug(
        {
          query: 'findHandDetails',
          handId,
          rowCount: 0,
          durationMs: Math.round(performance.now() - start),
        },
        'hand.findHandDetails',
      );
      return undefined;
    }

    const [wins, individualResult] = await Promise.all([
      db
        .select({
          handWinId: handWin.handWinId,
          winnerPlayerId: handWin.winnerPlayerId,
          han: handWin.han,
          fu: handWin.fu,
          handValue: handWin.handValue,
          winType: handWin.winType,
        })
        .from(handWin)
        .where(eq(handWin.handId, handId)),
      db
        .select({
          displayName: playerInfo.displayName,
          outcome: handPlayerResult.outcome,
          riichi: handPlayerResult.riichi,
          riichiOrder: handPlayerResult.riichiOrder,
          endScore: handPlayerResult.endScore,
          scoreChange: handPlayerResult.scoreChange,
          dealer: handPlayerResult.dealer,
          tenpai: handPlayerResult.tenpai,
          startingSeat: gameResult.startingSeat,
        })
        .from(handPlayerResult)
        .innerJoin(
          playerInfo,
          eq(handPlayerResult.playerId, playerInfo.playerId),
        )
        .innerJoin(
          gameResult,
          and(
            eq(handPlayerResult.gameInfo, gameResult.gameId),
            eq(handPlayerResult.playerId, gameResult.playerId),
          ),
        )
        .where(eq(handPlayerResult.handId, handId))
        .orderBy(asc(gameResult.startingSeat)),
    ]);

    const primaryWin = wins[0];
    const hand = handRow[0];

    logger.debug(
      {
        query: 'findHandDetails',
        handId,
        rowCount: 1,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.findHandDetails',
    );

    return {
      handNum: hand.handNum,
      wind: hand.wind,
      roundNum: hand.roundNum,
      honba: hand.honba,
      handOutcome: hand.handOutcome,
      riichiDeposits: hand.riichiDeposits,
      han: primaryWin?.han ?? null,
      fu: primaryWin?.fu ?? null,
      handValue: primaryWin?.handValue ?? null,
      wins,
      individualResult: individualResult.map(
        ({ startingSeat: _seat, ...row }) => row,
      ),
    };
  },

  hasPlayerOutcome: async (
    handId: number,
    playerId: number,
  ): Promise<boolean> => {
    const start = performance.now();
    const result = await db
      .select({ outcome: handPlayerResult.outcome })
      .from(handPlayerResult)
      .where(
        and(
          eq(handPlayerResult.handId, handId),
          eq(handPlayerResult.playerId, playerId),
          isNotNull(handPlayerResult.outcome),
        ),
      )
      .limit(1);
    logger.debug(
      {
        query: 'hasPlayerOutcome',
        handId,
        playerId,
        rowCount: result.length,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.hasPlayerOutcome',
    );
    return result.length > 0;
  },

  findScoreCalcInput: async (
    handId: number,
  ): Promise<ScoreCalcInputDto | undefined> => {
    const start = performance.now();
    const handRow = await db
      .select({
        handId: handInfo.handId,
        gameId: handInfo.gameId,
        honba: handInfo.honba,
        riichiDeposits: handInfo.riichiDeposits,
        han: handWin.han,
        fu: handWin.fu,
        kiriageMangan: rulesetInfo.kiriageMangan,
      })
      .from(handInfo)
      .leftJoin(handWin, eq(handInfo.handId, handWin.handId))
      .innerJoin(gameInfo, eq(handInfo.gameId, gameInfo.gameId))
      .innerJoin(
        rulesetInfo,
        eq(gameInfo.rulesetId, rulesetInfo.rulesetId),
      )
      .where(eq(handInfo.handId, handId))
      .limit(1);

    if (!handRow[0]) {
      logger.debug(
        {
          query: 'findScoreCalcInput',
          handId,
          rowCount: 0,
          durationMs: Math.round(performance.now() - start),
        },
        'hand.findScoreCalcInput',
      );
      return undefined;
    }

    const [winCount, handResults] = await Promise.all([
      db
        .select({ value: count() })
        .from(handWin)
        .where(eq(handWin.handId, handId)),
      db
        .select({
          handPlayerResultId: handPlayerResult.handPlayerResultId,
          playerId: handPlayerResult.playerId,
          dealer: handPlayerResult.dealer,
          outcome: handPlayerResult.outcome,
          endScore: handPlayerResult.endScore,
          scoreChange: handPlayerResult.scoreChange,
        })
        .from(handPlayerResult)
        .where(eq(handPlayerResult.handId, handId)),
    ]);

    const hand = handRow[0];
    const isRecordingMultipleRon = (winCount[0]?.value ?? 0) > 1;

    logger.debug(
      {
        query: 'findScoreCalcInput',
        handId,
        rowCount: handResults.length,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.findScoreCalcInput',
    );

    return {
      handId: hand.handId,
      gameId: hand.gameId,
      han: hand.han,
      fu: hand.fu,
      honba: hand.honba,
      riichiDeposits: hand.riichiDeposits,
      isRecordingMultipleRon,
      kiriageMangan: hand.kiriageMangan,
      handResults,
    };
  },

  findMultipleRonStatus: async (
    handId: number,
  ): Promise<MultipleRonStatusDto[]> => {
    const start = performance.now();
    const gameIdRow = await db
      .select({ gameId: handInfo.gameId })
      .from(handInfo)
      .where(eq(handInfo.handId, handId))
      .limit(1);

    const gameId = gameIdRow[0]?.gameId;
    if (gameId === undefined) {
      logger.debug(
        {
          query: 'findMultipleRonStatus',
          handId,
          rowCount: 0,
          durationMs: Math.round(performance.now() - start),
        },
        'hand.findMultipleRonStatus',
      );
      return [];
    }

    const rows = await db
      .select({
        seat: gameResult.startingSeat,
        playerId: gameResult.playerId,
        outcome: handPlayerResult.outcome,
      })
      .from(gameResult)
      .leftJoin(
        handPlayerResult,
        and(
          eq(gameResult.gameId, handPlayerResult.gameInfo),
          eq(gameResult.playerId, handPlayerResult.playerId),
          eq(handPlayerResult.handId, handId),
        ),
      )
      .where(eq(gameResult.gameId, gameId))
      .orderBy(asc(gameResult.startingSeat));

    logger.debug(
      {
        query: 'findMultipleRonStatus',
        handId,
        rowCount: rows.length,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.findMultipleRonStatus',
    );

    return rows.map((row) => ({
      seat: row.seat,
      playerId: row.playerId as number,
      outcome: row.outcome,
    }));
  },
};
