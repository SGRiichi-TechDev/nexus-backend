import {
  and,
  asc,
  desc,
  eq,
  getColumns,
  inArray,
  isNotNull,
  max,
  notInArray,
  sql,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '#db/index.js';
import type {
  HandDetailsDto,
  HandIdDto,
  HandMutationResponseDto,
  HandWinCreateResponseDto,
  IndividualOutcome,
  MultipleRonStatusDto,
  PlayerInfo,
  ScoreCalcInputDto,
  ScoreChangeUpdateDto,
  Wind,
} from '#db/types.js';
import {
  gameInfo,
  gameResult,
  handInfo,
  handPlayerResult,
  handTransaction,
  handWin,
  handYaku,
  playerInfo,
  rulesetInfo,
} from '#drizzle/schema.js';
import { BadRequestError, NotFoundError } from '#errors/app-error.js';
import { createLogger } from '#logger/logger.js';
import { withDbTiming } from '#repositories/timing.util.js';

const logger = createLogger('hand.repository');

type DbOrTx = Pick<typeof db, 'select' | 'insert' | 'update'>;

const WINNER_OUTCOMES = ['Ron', 'Tsumo', 'Nagashi-win'] as const;

const mapWinType = (
  outcome: IndividualOutcome,
): (typeof handWin.$inferInsert)['winType'] => {
  if (outcome === 'Tsumo') {
    return 'Tsumo';
  }
  if (outcome === 'Nagashi-win') {
    return 'Nagashi Mangan';
  }
  return 'Ron';
};

// TODO(leftover_riichi_rule): end-of-game leftover pot (lost | to_first) is not handled by mid-hand mutations.
const computeHandPot = async (tx: DbOrTx, handId: number): Promise<number> => {
  const [handRow, aggRow] = await Promise.all([
    tx
      .select({ riichiPotStart: handInfo.riichiPotStart })
      .from(handInfo)
      .where(eq(handInfo.handId, handId))
      .limit(1),
    tx
      .select({
        deposited: sql<number>`coalesce(sum(${handPlayerResult.riichiDeposited}), 0)`,
        collected: sql<number>`coalesce(sum(${handPlayerResult.riichiCollected}), 0)`,
      })
      .from(handPlayerResult)
      .where(eq(handPlayerResult.handId, handId)),
  ]);
  const start = handRow[0]?.riichiPotStart ?? 0;
  const deposited = Number(aggRow[0]?.deposited ?? 0);
  const collected = Number(aggRow[0]?.collected ?? 0);
  return start + deposited - collected;
};

const allocateNextHandId = async (tx: DbOrTx): Promise<number> => {
  const result = await tx
    .select({ maxHandId: max(handInfo.handId) })
    .from(handInfo);
  return (result[0]?.maxHandId ?? 0) + 1;
};

const allocateNextHandPlayerResultIdBase = async (
  tx: DbOrTx,
): Promise<number> => {
  const result = await tx
    .select({ maxId: max(handPlayerResult.handPlayerResultId) })
    .from(handPlayerResult);
  return result[0]?.maxId ?? 0;
};

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type SavedHandDto = { handId: number; gameId: number };

/**
 * Applies a hand's score changes as one set-based statement (one round trip):
 *
 * - `score_change` = (riichi ? -10 : 0) + payload delta, plus the optional
 *   draw `outcome`, for every row in `updates`.
 * - When `winnerHandValue` is set: every row's `riichi_collected` is reset to
 *   0 and the first winner collects the full pot
 *   (`riichi_pot_start + Σ riichi_deposited`).
 * - `hand_win` is upserted for each winner whose outcome was already set
 *   before this statement (win type comes from that outcome), and every
 *   `hand_win` row of the hand gets `hand_value = winnerHandValue` when set
 *   (otherwise the winner's own score change).
 *
 * Throws NotFoundError when an update's row does not belong to the hand; the
 * caller's transaction then rolls the statement back.
 */
const applyScoreChangesTx = async (
  tx: DbTx,
  handId: number,
  updates: ScoreChangeUpdateDto[],
  winnerHandValue: number | null,
): Promise<void> => {
  if (updates.length === 0) {
    return;
  }
  const uniqueIds = new Set(updates.map((u) => u.handPlayerResultId));
  if (uniqueIds.size !== updates.length) {
    throw new BadRequestError(
      'updates.handPlayerResultId must be unique',
      'json',
    );
  }

  // Multiple Ron is not supported by the bot flow; head-bump winner selection is out of scope.
  const winnerHprId = updates.find((u) => u.winner)?.handPlayerResultId ?? null;
  const inputRows = sql.join(
    updates.map(
      (u) =>
        sql`(${u.handPlayerResultId}::bigint, ${u.scoreChange}::integer, ${u.outcome ?? null}::individual_outcome_enum, ${u.winner}::boolean)`,
    ),
    sql`, `,
  );
  const handValue = sql`${winnerHandValue}::integer`;
  const hand = sql`${handId}::bigint`;

  const rows = await tx.execute<{ matched: number }>(sql`
    with input (hand_player_result_id, score_change, outcome, winner) as (
      values ${inputRows}
    ),
    pot as (
      select coalesce((
        select h.riichi_pot_start from hand_info h where h.hand_id = ${hand}
      ), 0) + coalesce((
        select sum(d.riichi_deposited) from hand_player_result d
        where d.hand_id = ${hand}
      ), 0) as full_pot
    ),
    updated as (
      update hand_player_result hpr
      set
        score_change = case
          when input.hand_player_result_id is null then hpr.score_change
          else (case when hpr.riichi then -10 else 0 end) + input.score_change
        end,
        outcome = coalesce(input.outcome, hpr.outcome),
        riichi_collected = case
          when ${handValue} is null then hpr.riichi_collected
          when hpr.hand_player_result_id = ${winnerHprId}::bigint
            then (select full_pot from pot)
          else 0
        end
      from hand_player_result prev
      left join input
        on input.hand_player_result_id = prev.hand_player_result_id
      where prev.hand_player_result_id = hpr.hand_player_result_id
        and hpr.hand_id = ${hand}
        and (input.hand_player_result_id is not null or ${handValue} is not null)
      returning
        hpr.player_id,
        prev.outcome as prev_outcome,
        input.hand_player_result_id is not null as matched,
        coalesce(input.winner, false) as winner,
        input.score_change
    ),
    winners as (
      select player_id, prev_outcome, score_change
      from updated
      where winner and prev_outcome is not null
    ),
    upserted as (
      insert into hand_win (hand_id, winner_player_id, hand_value, win_type)
      select
        ${hand},
        w.player_id,
        coalesce(${handValue}, w.score_change),
        case w.prev_outcome
          when 'Tsumo' then 'Tsumo'::win_type_enum
          when 'Nagashi-win' then 'Nagashi Mangan'::win_type_enum
          else 'Ron'::win_type_enum
        end
      from winners w
      on conflict (hand_id, winner_player_id)
        do update set hand_value = excluded.hand_value
    ),
    other_wins as (
      update hand_win hw
      set hand_value = ${handValue}
      where ${handValue} is not null
        and hw.hand_id = ${hand}
        and hw.winner_player_id not in (select player_id from winners)
    )
    select (count(*) filter (where matched))::int as matched from updated
  `);

  const matched = Number(rows[0]?.matched ?? 0);
  if (matched !== updates.length) {
    throw new NotFoundError('Hand player result not found', 'json');
  }
};

const confirmHandTx = async (tx: DbTx, handId: number): Promise<void> => {
  await tx
    .update(handInfo)
    .set({ completed: true })
    .where(eq(handInfo.handId, handId));

  const rows = await tx
    .select({
      handPlayerResultId: handPlayerResult.handPlayerResultId,
      endScore: handPlayerResult.endScore,
    })
    .from(handPlayerResult)
    .where(eq(handPlayerResult.handId, handId));

  const scores = rows.map((r) => r.endScore as number);
  for (const row of rows) {
    const endScore = row.endScore as number;
    const countHigher = scores.filter((s) => s > endScore).length;
    const countLower = scores.filter((s) => s < endScore).length;
    const position =
      Math.round(((countHigher - countLower + 5) / 2.0) * 10) / 10;
    await tx
      .update(handPlayerResult)
      .set({ position: String(position) })
      .where(eq(handPlayerResult.handPlayerResultId, row.handPlayerResultId));
  }
};

export const loadScoreCalcInput = async (
  exec: DbOrTx,
  handId: number,
): Promise<ScoreCalcInputDto | undefined> => {
  const start = performance.now();
  const handRow = await exec
    .select({
      handId: handInfo.handId,
      gameId: handInfo.gameId,
      honba: handInfo.honba,
      handOutcome: handInfo.handOutcome,
      han: handWin.han,
      fu: handWin.fu,
      kiriageMangan: rulesetInfo.kiriageMangan,
      // Folded into this query so the transaction path makes one fewer
      // sequential query (they share the transaction's single connection).
      winCount:
        sql<number>`(select count(*) from ${handWin} where ${handWin.handId} = ${handInfo.handId})`.mapWith(
          Number,
        ),
    })
    .from(handInfo)
    .leftJoin(handWin, eq(handInfo.handId, handWin.handId))
    .innerJoin(gameInfo, eq(handInfo.gameId, gameInfo.gameId))
    .leftJoin(rulesetInfo, eq(gameInfo.rulesetId, rulesetInfo.rulesetId))
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

  // Read through `exec` so callers that pass a transaction (saveHand) see
  // their own uncommitted writes and a consistent snapshot.
  const handResults = await exec
    .select({
      handPlayerResultId: handPlayerResult.handPlayerResultId,
      playerId: handPlayerResult.playerId,
      dealer: handPlayerResult.dealer,
      outcome: handPlayerResult.outcome,
      endScore: handPlayerResult.endScore,
      scoreChange: handPlayerResult.scoreChange,
      tenpai: handPlayerResult.tenpai,
      riichi: handPlayerResult.riichi,
      riichiCollected: handPlayerResult.riichiCollected,
    })
    .from(handPlayerResult)
    .where(eq(handPlayerResult.handId, handId));

  const hand = handRow[0];
  const isRecordingMultipleRon = hand.winCount > 1;
  const riichiDeposits = await computeHandPot(exec, handId);

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
    handOutcome: hand.handOutcome,
    riichiDeposits,
    isRecordingMultipleRon,
    kiriageMangan: hand.kiriageMangan ?? false,
    handResults,
  };
};

export type HandPlayerFlag = 'riichi' | 'tenpai' | 'chombo';

export type ToggleFlagResult = {
  /** False when no seat matched (unknown hand, or player not seated on it). */
  toggled: boolean;
  /** Players with the flag set after the toggle (riichi: in declaration order). */
  players: PlayerInfo[];
};

/**
 * SET clause that flips `flag` on a single hand_player_result row, keeping the
 * dependent columns consistent with the matching replace* methods.
 */
const buildToggleSet = (handId: number, flag: HandPlayerFlag) => {
  const current = handPlayerResult[flag];
  if (flag === 'riichi') {
    const existing = alias(handPlayerResult, 'existing_riichi');
    const nextOrder = db
      .select({
        nextOrder: sql<number>`coalesce(max(${existing.riichiOrder}) + 1, 0)`,
      })
      .from(existing)
      .where(and(eq(existing.handId, handId), eq(existing.riichi, true)));
    return {
      riichi: sql<boolean>`not ${current}`,
      riichiDeposited: sql<number>`case when ${current} then 0 else 1 end`,
      riichiOrder: sql<
        number | null
      >`case when ${current} then null else (${nextOrder}) end`,
    };
  }
  if (flag === 'chombo') {
    return {
      chombo: sql<boolean>`not ${current}`,
      outcome: sql<IndividualOutcome | null>`case when ${current} then nullif(${handPlayerResult.outcome}, 'Chombo') else 'Chombo' end`,
    };
  }
  return { tenpai: sql<boolean>`not ${current}` };
};

export const handRepository = withDbTiming('hand', {
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
      .innerJoin(playerInfo, eq(handPlayerResult.playerId, playerInfo.playerId))
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

  /**
   * Flips `flag` for one seated player and returns the resulting flagged
   * players in a single statement: the UPDATE runs in a data-modifying CTE and
   * the outer SELECT overlays the updated row on the pre-update snapshot.
   */
  toggleFlag: async (
    handId: number,
    playerId: number,
    flag: HandPlayerFlag,
  ): Promise<ToggleFlagResult> => {
    const start = performance.now();
    const toggled = db.$with('toggled').as(
      db
        .update(handPlayerResult)
        .set(buildToggleSet(handId, flag))
        .where(
          and(
            eq(handPlayerResult.handId, handId),
            eq(handPlayerResult.playerId, playerId),
          ),
        )
        .returning({
          playerId: handPlayerResult.playerId,
          flagValue: handPlayerResult[flag],
          riichiOrder: handPlayerResult.riichiOrder,
        }),
    );

    const rows = await db
      .with(toggled)
      .select({
        player: getColumns(playerInfo),
        isTarget: sql<boolean>`(${toggled.playerId} is not null)`,
        flagged: sql<boolean>`coalesce(${toggled.flagValue}, ${handPlayerResult[flag]})`,
        riichiOrder: sql<
          number | null
        >`case when ${toggled.playerId} is null then ${handPlayerResult.riichiOrder} else ${toggled.riichiOrder} end`,
      })
      .from(handPlayerResult)
      .innerJoin(playerInfo, eq(handPlayerResult.playerId, playerInfo.playerId))
      .leftJoin(toggled, eq(toggled.playerId, handPlayerResult.playerId))
      .where(eq(handPlayerResult.handId, handId));

    const flaggedRows = rows.filter((row) => row.flagged);
    if (flag === 'riichi') {
      flaggedRows.sort(
        (a, b) =>
          (a.riichiOrder ?? Number.MAX_SAFE_INTEGER) -
          (b.riichiOrder ?? Number.MAX_SAFE_INTEGER),
      );
    }
    const result: ToggleFlagResult = {
      toggled: rows.some((row) => row.isTarget),
      players: flaggedRows.map((row) => row.player),
    };

    logger.debug(
      {
        query: 'toggleFlag',
        handId,
        playerId,
        flag,
        toggled: result.toggled,
        flaggedCount: result.players.length,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.toggleFlag',
    );
    return result;
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
    const riichiDeposits = await computeHandPot(db, handId);

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
      riichiDeposits,
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
  ): Promise<ScoreCalcInputDto | undefined> => loadScoreCalcInput(db, handId),

  /**
   * Computes and persists a hand's score changes, then confirms it, all in one
   * transaction. `compute` receives the score-calculation input read inside the
   * transaction and returns the updates to apply.
   */
  saveHand: async (
    handId: number,
    compute: (input: ScoreCalcInputDto) => {
      updates: ScoreChangeUpdateDto[];
      winnerHandValue: number | null;
    },
  ): Promise<SavedHandDto> => {
    const start = performance.now();
    const gameId = await db.transaction(async (tx) => {
      const input = await loadScoreCalcInput(tx, handId);
      if (!input) {
        throw new NotFoundError('Hand not found', 'json');
      }
      const { updates, winnerHandValue } = compute(input);
      await applyScoreChangesTx(tx, handId, updates, winnerHandValue);
      await confirmHandTx(tx, handId);
      return input.gameId;
    });
    logger.debug(
      {
        query: 'saveHand',
        handId,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.saveHand',
    );
    return { handId, gameId };
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

  insertFirstHand: async (gameId: number): Promise<HandIdDto> => {
    const start = performance.now();
    const result = await db.transaction(async (tx) => {
      const handId = await allocateNextHandId(tx);
      const baseId = await allocateNextHandPlayerResultIdBase(tx);
      const roundNum = 1;

      const rulesetRow = await tx
        .select({ initialValue: rulesetInfo.initialValue })
        .from(gameInfo)
        .leftJoin(rulesetInfo, eq(gameInfo.rulesetId, rulesetInfo.rulesetId))
        .where(eq(gameInfo.gameId, gameId))
        .limit(1);
      const startScore = rulesetRow[0]?.initialValue ?? 250;

      const seats = await tx
        .select({
          startingSeat: gameResult.startingSeat,
          playerId: gameResult.playerId,
        })
        .from(gameResult)
        .where(eq(gameResult.gameId, gameId))
        .orderBy(asc(gameResult.startingSeat));

      await tx.insert(handInfo).values({
        handId,
        gameId,
        handNum: 1,
        wind: 'E',
        roundNum,
      });

      if (seats.length > 0) {
        await tx.insert(handPlayerResult).values(
          seats.map((seat, index) => ({
            handPlayerResultId: baseId + index + 1,
            gameInfo: gameId,
            handId,
            playerId: seat.playerId as number,
            dealer: seat.startingSeat === roundNum,
            startScore,
            scoreChange: 0,
            submittedRow: false,
          })),
        );
      }

      return { handId };
    });
    logger.debug(
      {
        query: 'insertFirstHand',
        gameId,
        handId: result.handId,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.insertFirstHand',
    );
    return result;
  },

  insertNextHand: async (
    previousHandId: number,
    wind: Wind,
    roundNum: number,
    honba: number,
  ): Promise<HandIdDto> => {
    const start = performance.now();
    const result = await db.transaction(async (tx) => {
      const previous = await tx
        .select()
        .from(handInfo)
        .where(eq(handInfo.handId, previousHandId))
        .limit(1);
      const prev = previous[0];
      if (!prev) {
        throw new Error(`Previous hand ${previousHandId} not found`);
      }

      const handId = await allocateNextHandId(tx);
      const baseId = await allocateNextHandPlayerResultIdBase(tx);

      await tx.insert(handInfo).values({
        handId,
        gameId: prev.gameId,
        handNum: prev.handNum + 1,
        wind,
        roundNum,
        honba,
        riichiPotStart: await computeHandPot(tx, previousHandId),
      });

      const seats = await tx
        .select({
          startingSeat: gameResult.startingSeat,
          playerId: gameResult.playerId,
          endScore: handPlayerResult.endScore,
        })
        .from(gameResult)
        .innerJoin(
          handPlayerResult,
          and(
            eq(handPlayerResult.gameInfo, gameResult.gameId),
            eq(handPlayerResult.playerId, gameResult.playerId),
            eq(handPlayerResult.handId, previousHandId),
          ),
        )
        .where(eq(gameResult.gameId, prev.gameId))
        .orderBy(asc(gameResult.startingSeat));

      if (seats.length > 0) {
        await tx.insert(handPlayerResult).values(
          seats.map((seat, index) => ({
            handPlayerResultId: baseId + index + 1,
            gameInfo: prev.gameId,
            handId,
            playerId: seat.playerId as number,
            dealer: seat.startingSeat === roundNum,
            startScore: seat.endScore as number,
            scoreChange: 0,
            submittedRow: false,
          })),
        );
      }

      return { handId };
    });
    logger.debug(
      {
        query: 'insertNextHand',
        previousHandId,
        handId: result.handId,
        wind,
        roundNum,
        honba,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.insertNextHand',
    );
    return result;
  },

  existsPlayerOnHand: async (
    handId: number,
    playerId: number,
  ): Promise<boolean> => {
    const start = performance.now();
    const result = await db
      .select({ handPlayerResultId: handPlayerResult.handPlayerResultId })
      .from(handPlayerResult)
      .where(
        and(
          eq(handPlayerResult.handId, handId),
          eq(handPlayerResult.playerId, playerId),
        ),
      )
      .limit(1);
    logger.debug(
      {
        query: 'existsPlayerOnHand',
        handId,
        playerId,
        rowCount: result.length,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.existsPlayerOnHand',
    );
    return result.length > 0;
  },

  replaceRiichi: async (
    handId: number,
    playerIds: number[],
  ): Promise<HandMutationResponseDto> => {
    const start = performance.now();
    await db.transaction(async (tx) => {
      await tx
        .update(handPlayerResult)
        .set({ riichi: false, riichiDeposited: 0, riichiOrder: null })
        .where(eq(handPlayerResult.handId, handId));

      for (const [index, playerId] of playerIds.entries()) {
        await tx
          .update(handPlayerResult)
          .set({ riichi: true, riichiDeposited: 1, riichiOrder: index })
          .where(
            and(
              eq(handPlayerResult.handId, handId),
              eq(handPlayerResult.playerId, playerId),
            ),
          );
      }
    });

    logger.debug(
      {
        query: 'replaceRiichi',
        handId,
        playerCount: playerIds.length,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.replaceRiichi',
    );
    return { handId };
  },

  applyRiichiResult: async (
    handId: number,
    playerIds: number[],
  ): Promise<HandMutationResponseDto> => {
    const start = performance.now();
    await db.transaction(async (tx) => {
      if (playerIds.length > 0) {
        await tx
          .update(handPlayerResult)
          .set({ riichi: true, riichiDeposited: 1, scoreChange: -10 })
          .where(
            and(
              eq(handPlayerResult.handId, handId),
              inArray(handPlayerResult.playerId, playerIds),
            ),
          );
        await tx
          .update(handPlayerResult)
          .set({
            riichi: false,
            riichiDeposited: 0,
            riichiOrder: null,
            scoreChange: 0,
          })
          .where(
            and(
              eq(handPlayerResult.handId, handId),
              notInArray(handPlayerResult.playerId, playerIds),
            ),
          );
      } else {
        await tx
          .update(handPlayerResult)
          .set({
            riichi: false,
            riichiDeposited: 0,
            riichiOrder: null,
            scoreChange: 0,
          })
          .where(eq(handPlayerResult.handId, handId));
      }
    });
    logger.debug(
      {
        query: 'applyRiichiResult',
        handId,
        playerCount: playerIds.length,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.applyRiichiResult',
    );
    return { handId };
  },

  resetRiichi: async (handId: number): Promise<HandMutationResponseDto> => {
    const start = performance.now();
    await db.transaction(async (tx) => {
      await tx
        .update(handPlayerResult)
        .set({
          riichi: false,
          riichiDeposited: 0,
          riichiOrder: null,
          scoreChange: 0,
        })
        .where(eq(handPlayerResult.handId, handId));
    });
    logger.debug(
      {
        query: 'resetRiichi',
        handId,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.resetRiichi',
    );
    return { handId };
  },

  setHandOutcome: async (
    handId: number,
    outcome: (typeof handInfo.$inferInsert)['handOutcome'],
  ): Promise<HandMutationResponseDto> => {
    const start = performance.now();
    await db
      .update(handInfo)
      .set({ handOutcome: outcome })
      .where(eq(handInfo.handId, handId));
    logger.debug(
      {
        query: 'setHandOutcome',
        handId,
        outcome,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.setHandOutcome',
    );
    return { handId };
  },

  setPlayerOutcome: async (
    handId: number,
    playerId: number,
    outcome: IndividualOutcome,
  ): Promise<HandMutationResponseDto> => {
    const start = performance.now();
    await db
      .update(handPlayerResult)
      .set({ outcome })
      .where(
        and(
          eq(handPlayerResult.handId, handId),
          eq(handPlayerResult.playerId, playerId),
        ),
      );
    logger.debug(
      {
        query: 'setPlayerOutcome',
        handId,
        playerId,
        outcome,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.setPlayerOutcome',
    );
    return { handId, playerId };
  },

  setDealIn: async (
    handId: number,
    playerId: number,
  ): Promise<HandMutationResponseDto> => {
    const start = performance.now();
    await db.transaction(async (tx) => {
      const ronRow = await tx
        .select({
          dealer: handPlayerResult.dealer,
          riichi: handPlayerResult.riichi,
        })
        .from(handPlayerResult)
        .where(
          and(
            eq(handPlayerResult.handId, handId),
            eq(handPlayerResult.outcome, 'Ron'),
          ),
        )
        .limit(1);

      const ron = ronRow[0];
      await tx
        .update(handPlayerResult)
        .set({
          outcome: 'Deal-in',
          dealIntoOya: ron?.dealer ?? null,
          dealIntoRiichi: ron?.riichi ?? null,
        })
        .where(
          and(
            eq(handPlayerResult.handId, handId),
            eq(handPlayerResult.playerId, playerId),
          ),
        );
    });
    logger.debug(
      {
        query: 'setDealIn',
        handId,
        playerId,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.setDealIn',
    );
    return { handId, playerId };
  },

  upsertHan: async (
    handId: number,
    han: number,
  ): Promise<HandMutationResponseDto> => {
    const start = performance.now();
    await upsertWinnerHandWin(handId, han, null);
    logger.debug(
      {
        query: 'upsertHan',
        handId,
        han,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.upsertHan',
    );
    return { handId };
  },

  upsertFu: async (
    handId: number,
    fu: number,
  ): Promise<HandMutationResponseDto> => {
    const start = performance.now();
    await upsertWinnerHandWin(handId, null, fu);
    logger.debug(
      {
        query: 'upsertFu',
        handId,
        fu,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.upsertFu',
    );
    return { handId };
  },

  findGameIdByHandId: async (handId: number): Promise<number | undefined> => {
    const start = performance.now();
    const result = await db
      .select({ gameId: handInfo.gameId })
      .from(handInfo)
      .where(eq(handInfo.handId, handId))
      .limit(1);
    logger.debug(
      {
        query: 'findGameIdByHandId',
        handId,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.findGameIdByHandId',
    );
    return result[0]?.gameId;
  },

  findPlayerIdsOnHand: async (handId: number): Promise<number[]> => {
    const start = performance.now();
    const rows = await db
      .select({ playerId: handPlayerResult.playerId })
      .from(handPlayerResult)
      .where(eq(handPlayerResult.handId, handId));
    logger.debug(
      {
        query: 'findPlayerIdsOnHand',
        handId,
        rowCount: rows.length,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.findPlayerIdsOnHand',
    );
    return rows.map((r) => r.playerId);
  },

  existsHandPlayerResultOnHand: async (
    handId: number,
    handPlayerResultId: number,
  ): Promise<boolean> => {
    const start = performance.now();
    const result = await db
      .select({ handPlayerResultId: handPlayerResult.handPlayerResultId })
      .from(handPlayerResult)
      .where(
        and(
          eq(handPlayerResult.handId, handId),
          eq(handPlayerResult.handPlayerResultId, handPlayerResultId),
        ),
      )
      .limit(1);
    logger.debug(
      {
        query: 'existsHandPlayerResultOnHand',
        handId,
        handPlayerResultId,
        rowCount: result.length,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.existsHandPlayerResultOnHand',
    );
    return result.length > 0;
  },

  replaceTenpai: async (
    handId: number,
    playerIds: number[],
  ): Promise<HandMutationResponseDto> => {
    const start = performance.now();
    await db.transaction(async (tx) => {
      await tx
        .update(handPlayerResult)
        .set({ tenpai: false })
        .where(eq(handPlayerResult.handId, handId));

      for (const playerId of playerIds) {
        await tx
          .update(handPlayerResult)
          .set({ tenpai: true })
          .where(
            and(
              eq(handPlayerResult.handId, handId),
              eq(handPlayerResult.playerId, playerId),
            ),
          );
      }
    });

    logger.debug(
      {
        query: 'replaceTenpai',
        handId,
        playerCount: playerIds.length,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.replaceTenpai',
    );
    return { handId };
  },

  setDrawPayments: async (
    handId: number,
    payments: {
      playerId: number;
      outcome: IndividualOutcome;
      scoreChange: number;
    }[],
  ): Promise<HandMutationResponseDto> => {
    const start = performance.now();
    await db.transaction(async (tx) => {
      for (const payment of payments) {
        // score_change SET = (riichi ? -10 : 0) + payload delta
        await tx
          .update(handPlayerResult)
          .set({
            outcome: payment.outcome,
            scoreChange: sql`(case when ${handPlayerResult.riichi} then -10 else 0 end) + ${payment.scoreChange}`,
          })
          .where(
            and(
              eq(handPlayerResult.handId, handId),
              eq(handPlayerResult.playerId, payment.playerId),
            ),
          );
      }
    });
    logger.debug(
      {
        query: 'setDrawPayments',
        handId,
        paymentCount: payments.length,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.setDrawPayments',
    );
    return { handId };
  },

  replaceChombo: async (
    handId: number,
    playerIds: number[],
  ): Promise<HandMutationResponseDto> => {
    const start = performance.now();
    await db.transaction(async (tx) => {
      await tx
        .update(handPlayerResult)
        .set({ chombo: false })
        .where(eq(handPlayerResult.handId, handId));
      await tx
        .update(handPlayerResult)
        .set({ outcome: null })
        .where(
          and(
            eq(handPlayerResult.handId, handId),
            eq(handPlayerResult.outcome, 'Chombo'),
          ),
        );

      for (const playerId of playerIds) {
        await tx
          .update(handPlayerResult)
          .set({ chombo: true, outcome: 'Chombo' })
          .where(
            and(
              eq(handPlayerResult.handId, handId),
              eq(handPlayerResult.playerId, playerId),
            ),
          );
      }
    });

    logger.debug(
      {
        query: 'replaceChombo',
        handId,
        playerCount: playerIds.length,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.replaceChombo',
    );
    return { handId };
  },

  applyChomboScores: async (
    handId: number,
    scoreByPlayerId: Map<number, number>,
  ): Promise<HandMutationResponseDto> => {
    const start = performance.now();
    await db.transaction(async (tx) => {
      for (const [playerId, scoreChange] of scoreByPlayerId) {
        await tx
          .update(handPlayerResult)
          .set({ scoreChange })
          .where(
            and(
              eq(handPlayerResult.handId, handId),
              eq(handPlayerResult.playerId, playerId),
            ),
          );
      }
    });
    logger.debug(
      {
        query: 'applyChomboScores',
        handId,
        playerCount: scoreByPlayerId.size,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.applyChomboScores',
    );
    return { handId };
  },

  applyScoreChanges: async (
    handId: number,
    updates: ScoreChangeUpdateDto[],
    winnerHandValue: number | null,
  ): Promise<HandMutationResponseDto> => {
    const start = performance.now();
    await db.transaction((tx) =>
      applyScoreChangesTx(tx, handId, updates, winnerHandValue),
    );
    logger.debug(
      {
        query: 'applyScoreChanges',
        handId,
        updateCount: updates.length,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.applyScoreChanges',
    );
    return { handId };
  },

  confirmHand: async (handId: number): Promise<HandMutationResponseDto> => {
    const start = performance.now();
    await db.transaction((tx) => confirmHandTx(tx, handId));
    logger.debug(
      {
        query: 'confirmHand',
        handId,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.confirmHand',
    );
    return { handId };
  },

  insertHandWin: async (
    handId: number,
    winnerPlayerId: number,
  ): Promise<HandWinCreateResponseDto> => {
    const start = performance.now();
    await db
      .insert(handWin)
      .values({
        handId,
        winnerPlayerId,
        handValue: 0,
        winType: 'Ron',
      })
      .onConflictDoNothing({
        target: [handWin.handId, handWin.winnerPlayerId],
      });
    logger.debug(
      {
        query: 'insertHandWin',
        handId,
        winnerPlayerId,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.insertHandWin',
    );
    return { handId, winnerPlayerId };
  },

  deleteLatestForGame: async (
    gameId: number,
  ): Promise<{ handId: number | null }> => {
    const start = performance.now();
    const handId = await db.transaction(async (tx) => {
      const locked = await tx
        .select({ completed: gameInfo.completed })
        .from(gameInfo)
        .where(eq(gameInfo.gameId, gameId))
        .for('update')
        .limit(1);

      const game = locked[0];
      if (!game) {
        throw new NotFoundError('Game not found', 'json');
      }
      if (game.completed) {
        throw new BadRequestError('Game is already completed', 'json');
      }

      const latest = await tx
        .select({ handId: handInfo.handId })
        .from(handInfo)
        .where(eq(handInfo.gameId, gameId))
        .orderBy(desc(handInfo.handId))
        .limit(1);

      const latestHandId = latest[0]?.handId;
      if (latestHandId === undefined) {
        return null;
      }

      await tx
        .delete(handYaku)
        .where(
          inArray(
            handYaku.handWinId,
            tx
              .select({ id: handWin.handWinId })
              .from(handWin)
              .where(eq(handWin.handId, latestHandId)),
          ),
        );
      await tx.delete(handWin).where(eq(handWin.handId, latestHandId));
      await tx
        .delete(handTransaction)
        .where(eq(handTransaction.handId, latestHandId));
      await tx
        .delete(handPlayerResult)
        .where(eq(handPlayerResult.handId, latestHandId));
      await tx.delete(handInfo).where(eq(handInfo.handId, latestHandId));

      return latestHandId;
    });
    logger.debug(
      {
        query: 'deleteLatestForGame',
        gameId,
        handId,
        durationMs: Math.round(performance.now() - start),
      },
      'hand.deleteLatestForGame',
    );
    return { handId };
  },
});

const upsertWinnerHandWin = async (
  handId: number,
  han: number | null,
  fu: number | null,
): Promise<void> => {
  await db.transaction(async (tx) => {
    const winners = await tx
      .select({
        playerId: handPlayerResult.playerId,
        outcome: handPlayerResult.outcome,
      })
      .from(handPlayerResult)
      .where(
        and(
          eq(handPlayerResult.handId, handId),
          inArray(handPlayerResult.outcome, [...WINNER_OUTCOMES]),
        ),
      );

    for (const winner of winners) {
      if (!winner.outcome) {
        continue;
      }
      await tx
        .insert(handWin)
        .values({
          handId,
          winnerPlayerId: winner.playerId,
          han,
          fu,
          handValue: 0,
          winType: mapWinType(winner.outcome),
        })
        .onConflictDoUpdate({
          target: [handWin.handId, handWin.winnerPlayerId],
          set: {
            han: sql`coalesce(excluded.han, ${handWin.han})`,
            fu: sql`coalesce(excluded.fu, ${handWin.fu})`,
          },
        });
    }
  });
};
