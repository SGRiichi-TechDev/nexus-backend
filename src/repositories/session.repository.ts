import { and, desc, eq, getColumns, type SQL, sql } from 'drizzle-orm';
import { db } from '#db/index.js';
import type { PlayerInfo, SessionGameDto } from '#db/types.js';
import {
  gameInfo,
  gameResult,
  handInfo,
  handWin,
  playerInfo,
  rulesetInfo,
} from '#drizzle/schema.js';
import { createLogger } from '#logger/logger.js';
import { withDbTiming } from '#repositories/timing.util.js';

const logger = createLogger('session.repository');

/** Maps player_info DB column names (from to_jsonb) back to PlayerInfo keys. */
const playerKeyByColumn = new Map<string, keyof PlayerInfo>(
  Object.entries(getColumns(playerInfo)).map(([key, column]) => [
    column.name,
    key as keyof PlayerInfo,
  ]),
);

const toPlayerInfo = (row: Record<string, unknown>): PlayerInfo => {
  const mapped: Record<string, unknown> = {};
  for (const [column, value] of Object.entries(row)) {
    mapped[playerKeyByColumn.get(column) ?? column] = value;
  }
  return mapped as PlayerInfo;
};

// Seated players, ordered by starting seat, computed inside the same statement.
const seatedPlayers = sql<Record<string, unknown>[]>`coalesce((
  select json_agg(to_jsonb(p) order by gr.starting_seat)
  from ${gameResult} gr
  join ${playerInfo} p on p.player_id = gr.player_id
  where gr.game_id = ${gameInfo.gameId}
), '[]'::json)`;

const sessionColumns = {
  gameId: gameInfo.gameId,
  status: gameInfo.status,
  handId: handInfo.handId,
  handOutcome: handInfo.handOutcome,
  isRecorded: gameInfo.isRecorded,
  han: handWin.han,
  finalScoreOnly: gameInfo.finalScoreOnly,
  multipleRon: rulesetInfo.multipleRon,
  seatedPlayers,
};

type SessionRow = {
  gameId: number;
  status: SessionGameDto['status'];
  handId: number | null;
  handOutcome: SessionGameDto['handOutcome'];
  isRecorded: boolean | null;
  han: number | null;
  finalScoreOnly: boolean;
  multipleRon: boolean | null;
  seatedPlayers: Record<string, unknown>[];
};

const toSessionDto = (row: SessionRow): SessionGameDto => ({
  gameId: row.gameId,
  status: row.status,
  handId: row.handId,
  handOutcome: row.handOutcome,
  isRecorded: row.isRecorded,
  han: row.han,
  finalScoreOnly: row.finalScoreOnly,
  // TODO(multiple-ron): Forced off for Akako until multiple-ron is re-enabled.
  multipleRon: false,
  isRecordingMultipleRon: false,
  players: row.seatedPlayers.map(toPlayerInfo),
});

export type TelegramSessionLookup =
  | { found: false }
  | { found: true; session: SessionGameDto | null };

export const sessionRepository = withDbTiming('session', {
  /**
   * One round trip: player (by telegram id) -> incomplete recorded game ->
   * latest hand -> seated players. Distinguishes "unknown player" from
   * "player without a current game".
   */
  findByTelegramId: async (
    telegramId: number,
  ): Promise<TelegramSessionLookup> => {
    const start = performance.now();
    const rows = await db
      .select({ ...sessionColumns, playerId: playerInfo.playerId })
      .from(playerInfo)
      .leftJoin(
        gameInfo,
        and(
          eq(gameInfo.recordedByPid, playerInfo.playerId),
          eq(gameInfo.completed, false),
          eq(gameInfo.deleted, false),
        ),
      )
      .leftJoin(handInfo, eq(gameInfo.gameId, handInfo.gameId))
      .leftJoin(handWin, eq(handInfo.handId, handWin.handId))
      .leftJoin(rulesetInfo, eq(gameInfo.rulesetId, rulesetInfo.rulesetId))
      .where(eq(playerInfo.telegramId, telegramId))
      .orderBy(desc(handInfo.handId))
      .limit(1);
    logger.debug(
      {
        query: 'findByTelegramId',
        rowCount: rows.length,
        durationMs: Math.round(performance.now() - start),
      },
      'session.findByTelegramId',
    );

    const row = rows[0];
    if (row === undefined) return { found: false };
    // gameId is null when the left join matched no incomplete game.
    if (row.gameId === null) return { found: true, session: null };
    return { found: true, session: toSessionDto(row as SessionRow) };
  },

  /** Session for an incomplete, non-deleted game; null once completed/deleted. */
  findByGameId: async (gameId: number): Promise<SessionGameDto | null> => {
    return findByGameCondition(eq(gameInfo.gameId, gameId), 'findByGameId');
  },

  /** Session for the game that owns the given hand. */
  findByHandId: async (handId: number): Promise<SessionGameDto | null> => {
    return findByGameCondition(
      eq(
        gameInfo.gameId,
        sql`(select ${handInfo.gameId} from ${handInfo} where ${handInfo.handId} = ${handId})`,
      ),
      'findByHandId',
    );
  },
});

async function findByGameCondition(
  condition: SQL,
  query: string,
): Promise<SessionGameDto | null> {
  const start = performance.now();
  const rows = await db
    .select(sessionColumns)
    .from(gameInfo)
    .leftJoin(handInfo, eq(gameInfo.gameId, handInfo.gameId))
    .leftJoin(handWin, eq(handInfo.handId, handWin.handId))
    .leftJoin(rulesetInfo, eq(gameInfo.rulesetId, rulesetInfo.rulesetId))
    .where(
      and(
        condition,
        eq(gameInfo.completed, false),
        eq(gameInfo.deleted, false),
      ),
    )
    .orderBy(desc(handInfo.handId))
    .limit(1);
  logger.debug(
    {
      query,
      rowCount: rows.length,
      durationMs: Math.round(performance.now() - start),
    },
    `session.${query}`,
  );
  const row = rows[0];
  return row === undefined ? null : toSessionDto(row as SessionRow);
}
