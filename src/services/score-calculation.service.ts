import type {
  HandResultForScoreCalc,
  IndividualOutcome,
  ScoreCalcInputDto,
  ScoreChangeUpdateDto,
  ScoreLookupRow,
} from '#db/types.js';
import { BadRequestError } from '#errors/app-error.js';

/**
 * Server-side hand score calculation. Scores are in hundreds of points
 * (see docs/score_validation.md), so one riichi stick is 10 and a draw pool
 * of 3,000 points is 30.
 *
 * The values returned here are *deltas* before the riichi deposit: the write
 * path (`applyScoreChanges`) adds -10 for every player who is in riichi.
 */

const RIICHI_STICK = 10;
const DRAW_POOL = 30;
/** Han at or above this are looked up with fu = 0 (mangan and up). */
const MANGAN_HAN = 5;

export type ComputedScoreChanges = {
  updates: ScoreChangeUpdateDto[];
  /** The winner's total score change (incl. honba and riichi sticks); null when nobody won by Ron/Tsumo. */
  winnerHandValue: number | null;
};

const findLookupRow = (
  lookup: ScoreLookupRow[],
  key: {
    han: number;
    fu: number;
    dealer: boolean;
    kiriageMangan: boolean;
    outcome: IndividualOutcome;
  },
): ScoreLookupRow => {
  const row = lookup.find(
    (r) =>
      r.han === key.han &&
      r.fu === key.fu &&
      r.dealer === key.dealer &&
      r.kiriageMangan === key.kiriageMangan &&
      r.outcome === key.outcome,
  );
  if (!row) {
    throw new BadRequestError(
      `No score found for han ${key.han}, fu ${key.fu} (${key.outcome})`,
      'json',
    );
  }
  return row;
};

const withHonba = (row: ScoreLookupRow, honba: number): number =>
  row.value + honba * row.honbaMultiplier;

const computeDraw = (input: ScoreCalcInputDto): ComputedScoreChanges => {
  const tenpaiCount = input.handResults.filter((r) => r.tenpai).length;
  const noTransfer =
    tenpaiCount === 0 || tenpaiCount === input.handResults.length;
  const updates = input.handResults.map((r) => ({
    handPlayerResultId: r.handPlayerResultId,
    scoreChange: noTransfer
      ? 0
      : r.tenpai
        ? DRAW_POOL / tenpaiCount
        : -(DRAW_POOL / (input.handResults.length - tenpaiCount)),
    winner: false,
    outcome: 'Draw' as const,
  }));
  return { updates, winnerHandValue: null };
};

const computeWin = (
  input: ScoreCalcInputDto,
  lookup: ScoreLookupRow[],
  winType: 'Ron' | 'Tsumo',
): ComputedScoreChanges => {
  const winners = input.handResults.filter((r) => r.outcome === winType);
  if (winners.length !== 1) {
    throw new BadRequestError(
      `Expected exactly one ${winType} winner, found ${winners.length}`,
      'json',
    );
  }
  const winner = winners[0] as HandResultForScoreCalc;
  if (input.han === null) {
    throw new BadRequestError('han is required to score a win', 'json');
  }
  const han = input.han;
  const mangan = han >= MANGAN_HAN;
  const fu = mangan ? 0 : (input.fu ?? 0);
  if (!mangan && fu <= 0) {
    throw new BadRequestError('fu is required for hands below 5 han', 'json');
  }
  const key = { han, fu, kiriageMangan: input.kiriageMangan };

  const winRow = findLookupRow(lookup, {
    ...key,
    dealer: winner.dealer,
    outcome: winType,
  });
  // Riichi sticks on the table (including this hand's) all go to the winner.
  const potSticks =
    input.riichiDeposits +
    input.handResults.reduce((sum, r) => sum + r.riichiCollected, 0);
  const winnerDelta = withHonba(winRow, input.honba) + potSticks * RIICHI_STICK;

  const deltaByResultId = new Map<number, number>();
  deltaByResultId.set(winner.handPlayerResultId, winnerDelta);

  if (winType === 'Ron') {
    const dealIns = input.handResults.filter((r) => r.outcome === 'Deal-in');
    if (dealIns.length !== 1) {
      throw new BadRequestError(
        `Expected exactly one deal-in player, found ${dealIns.length}`,
        'json',
      );
    }
    const dealIn = dealIns[0] as HandResultForScoreCalc;
    const lossRow = findLookupRow(lookup, {
      ...key,
      dealer: winner.dealer,
      outcome: 'Deal-in',
    });
    deltaByResultId.set(
      dealIn.handPlayerResultId,
      withHonba(lossRow, input.honba),
    );
  } else {
    for (const loser of input.handResults) {
      if (loser === winner) {
        continue;
      }
      // Tsumo-loss rows are keyed on whether the payer pays the larger share:
      // the dealer always does, and everyone does when the dealer wins.
      const lossRow = findLookupRow(lookup, {
        ...key,
        dealer: loser.dealer || winner.dealer,
        outcome: 'Tsumo-loss',
      });
      deltaByResultId.set(
        loser.handPlayerResultId,
        withHonba(lossRow, input.honba),
      );
    }
  }

  const updates = input.handResults.map((r) => ({
    handPlayerResultId: r.handPlayerResultId,
    scoreChange: deltaByResultId.get(r.handPlayerResultId) ?? 0,
    winner: r === winner,
  }));
  return { updates, winnerHandValue: winnerDelta };
};

/**
 * Nagashi mangan: winners and losers come straight from the individual
 * outcomes (Nagashi-win / Nagashi-loss) and are looked up with han 0, fu 0.
 * Nobody collects riichi sticks, and no hand_win row is written.
 */
const computeNagashi = (
  input: ScoreCalcInputDto,
  lookup: ScoreLookupRow[],
): ComputedScoreChanges => {
  const firstWinner = input.handResults.find(
    (r) => r.outcome === 'Nagashi-win',
  );
  if (!firstWinner) {
    throw new BadRequestError('No Nagashi-win player found', 'json');
  }
  const updates = input.handResults.map((r) => {
    let scoreChange = 0;
    if (r.outcome === 'Nagashi-win') {
      scoreChange = withHonba(
        findLookupRow(lookup, {
          han: 0,
          fu: 0,
          kiriageMangan: input.kiriageMangan,
          dealer: r.dealer,
          outcome: 'Nagashi-win',
        }),
        input.honba,
      );
    } else if (r.outcome === 'Nagashi-loss') {
      scoreChange = withHonba(
        findLookupRow(lookup, {
          han: 0,
          fu: 0,
          kiriageMangan: input.kiriageMangan,
          dealer: r.dealer || firstWinner.dealer,
          outcome: 'Nagashi-loss',
        }),
        input.honba,
      );
    }
    return {
      handPlayerResultId: r.handPlayerResultId,
      scoreChange,
      winner: false,
    };
  });
  return { updates, winnerHandValue: null };
};

export const computeScoreChanges = (
  input: ScoreCalcInputDto,
  lookup: ScoreLookupRow[],
): ComputedScoreChanges => {
  if (input.isRecordingMultipleRon) {
    throw new BadRequestError('Multiple ron is not supported', 'json');
  }
  switch (input.handOutcome) {
    case 'Ron':
    case 'Tsumo':
      return computeWin(input, lookup, input.handOutcome);
    case 'Draw':
      return computeDraw(input);
    case 'Nagashi Mangan':
      return computeNagashi(input, lookup);
    case 'Mid Game Draw':
    case 'Chombo':
      // Nothing to calculate: riichi sticks / chombo penalties were applied
      // by their own endpoints, so the hand only needs confirming.
      return { updates: [], winnerHandValue: null };
    default:
      throw new BadRequestError(
        `Cannot save a hand with outcome ${input.handOutcome ?? 'unset'}`,
        'json',
      );
  }
};
