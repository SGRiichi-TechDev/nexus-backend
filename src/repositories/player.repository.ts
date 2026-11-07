import { db } from '#db/index.js';
import type { ActiveParticipationDto, PlayerInfo } from '#db/types.js';
import {
  gameInfo,
  gameResult,
  handInfo,
  playerInfo,
} from '#drizzle/schema.js';
import { createLogger } from '#logger/logger.js';
import { and, desc, eq, ilike, isNotNull, lt } from 'drizzle-orm';

const logger = createLogger('player.repository');

const BOT_PLAYER_ID_CEILING = 100_000;

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

  findByIdRegistered: async (
    playerId: number,
  ): Promise<PlayerInfo | undefined> => {
    const start = performance.now();
    const result = await db
      .select()
      .from(playerInfo)
      .where(
        and(
          eq(playerInfo.playerId, playerId),
          lt(playerInfo.playerId, BOT_PLAYER_ID_CEILING),
          isNotNull(playerInfo.telegramId),
        ),
      )
      .limit(1);
    logger.debug(
      {
        query: 'findByIdRegistered',
        playerId,
        rowCount: result.length,
        durationMs: Math.round(performance.now() - start),
      },
      'player.findByIdRegistered',
    );
    return result[0];
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

  findByName: async (name: string): Promise<PlayerInfo | undefined> => {
    const start = performance.now();
    const result = await db
      .select()
      .from(playerInfo)
      .where(
        and(
          ilike(playerInfo.displayName, name),
          lt(playerInfo.playerId, BOT_PLAYER_ID_CEILING),
          isNotNull(playerInfo.telegramId),
        ),
      )
      .limit(1);
    logger.debug(
      {
        query: 'findByName',
        name,
        rowCount: result.length,
        durationMs: Math.round(performance.now() - start),
      },
      'player.findByName',
    );
    return result[0];
  },

  findActiveParticipation: async (
    telegramId: number,
  ): Promise<ActiveParticipationDto | undefined> => {
    const start = performance.now();
    const result = await db
      .select({
        gameId: gameInfo.gameId,
        handId: handInfo.handId,
      })
      .from(playerInfo)
      .innerJoin(gameResult, eq(playerInfo.playerId, gameResult.playerId))
      .innerJoin(
        gameInfo,
        and(
          eq(gameResult.gameId, gameInfo.gameId),
          eq(gameInfo.deleted, false),
          eq(gameInfo.completed, false),
        ),
      )
      .innerJoin(
        handInfo,
        and(
          eq(gameInfo.gameId, handInfo.gameId),
          eq(handInfo.completed, true),
        ),
      )
      .where(eq(playerInfo.telegramId, telegramId))
      .orderBy(desc(handInfo.handId))
      .limit(1);
    logger.debug(
      {
        query: 'findActiveParticipation',
        telegramId,
        rowCount: result.length,
        durationMs: Math.round(performance.now() - start),
      },
      'player.findActiveParticipation',
    );
    return result[0];
  },
};
