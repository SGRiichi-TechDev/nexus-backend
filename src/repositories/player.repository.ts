import { and, desc, eq, ilike, isNotNull, lt } from 'drizzle-orm';
import { db } from '#db/index.js';
import type { ActiveParticipationDto, PlayerInfo } from '#db/types.js';
import { gameInfo, gameResult, playerInfo } from '#drizzle/schema.js';
import { createLogger } from '#logger/logger.js';

const logger = createLogger('player.repository');

const BOT_PLAYER_ID_CEILING = 100_000;

export const playerRepository = {
  insert: async ({
    displayName,
  }: {
    displayName: string;
  }): Promise<PlayerInfo> => {
    const start = performance.now();
    const rows = await db
      .insert(playerInfo)
      .values({ displayName })
      .returning();
    const player = rows[0];
    if (player === undefined) {
      throw new Error('Failed to insert player');
    }
    logger.debug(
      {
        query: 'insert',
        playerId: player.playerId,
        durationMs: Math.round(performance.now() - start),
      },
      'player.insert',
    );
    return player;
  },

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
    playerId: number,
  ): Promise<ActiveParticipationDto> => {
    const start = performance.now();

    const recording = await db
      .select({ gameId: gameInfo.gameId })
      .from(gameInfo)
      .where(
        and(
          eq(gameInfo.recordedByPid, playerId),
          eq(gameInfo.deleted, false),
          eq(gameInfo.completed, false),
        ),
      )
      .orderBy(desc(gameInfo.gameId))
      .limit(1);

    const seated = await db
      .select({ gameId: gameInfo.gameId })
      .from(gameResult)
      .innerJoin(
        gameInfo,
        and(
          eq(gameResult.gameId, gameInfo.gameId),
          eq(gameInfo.deleted, false),
          eq(gameInfo.completed, false),
        ),
      )
      .where(eq(gameResult.playerId, playerId))
      .orderBy(desc(gameInfo.gameId))
      .limit(1);

    const isRecorder = recording[0] !== undefined;
    const isSeated = seated[0] !== undefined;
    // Recorders count as participants even before they are seated.
    const isParticipant = isRecorder || isSeated;
    const gameId = recording[0]?.gameId ?? seated[0]?.gameId ?? null;

    logger.debug(
      {
        query: 'findActiveParticipation',
        playerId,
        isParticipant,
        isRecorder,
        gameId,
        durationMs: Math.round(performance.now() - start),
      },
      'player.findActiveParticipation',
    );
    return { isParticipant, isRecorder, gameId };
  },
};
