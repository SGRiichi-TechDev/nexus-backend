import { describe, expect, it } from 'vitest';
import type {
  HandResultForScoreCalc,
  IndividualOutcome,
  ScoreCalcInputDto,
  ScoreLookupRow,
} from '#db/types.js';
import { BadRequestError } from '#errors/app-error.js';
import { computeScoreChanges } from '#services/score-calculation.service.js';

let nextId = 1;
const row = (
  han: number,
  fu: number,
  dealer: boolean,
  outcome: IndividualOutcome,
  value: number,
  honbaMultiplier: number,
  kiriageMangan = false,
): ScoreLookupRow => ({
  id: nextId++,
  han,
  fu,
  dealer,
  kiriageMangan,
  honbaMultiplier,
  value,
  outcome,
});

// Values copied from supabase/seed.sql (score_lookup).
const lookup: ScoreLookupRow[] = [
  row(2, 30, false, 'Ron', 20, 3),
  row(2, 30, false, 'Deal-in', -20, -3),
  row(2, 30, true, 'Ron', 29, 3),
  row(2, 30, true, 'Deal-in', -29, -3),
  row(5, 0, false, 'Ron', 80, 3),
  row(5, 0, false, 'Deal-in', -80, -3),
  row(1, 30, false, 'Tsumo', 11, 3),
  row(1, 30, false, 'Tsumo-loss', -3, -1),
  row(1, 30, true, 'Tsumo-loss', -5, -1),
  row(2, 30, true, 'Tsumo', 30, 3),
  row(2, 30, true, 'Tsumo-loss', -10, -1),
  row(4, 30, false, 'Tsumo', 78, 3, false),
  row(4, 30, false, 'Tsumo', 79, 3, true),
  row(4, 30, false, 'Tsumo-loss', -20, -1, false),
  row(4, 30, false, 'Tsumo-loss', -20, -1, true),
  row(4, 30, true, 'Tsumo-loss', -39, -1, false),
  row(4, 30, true, 'Tsumo-loss', -40, -1, true),
];

const seat = (
  id: number,
  dealer: boolean,
  over: Partial<HandResultForScoreCalc> = {},
): HandResultForScoreCalc => ({
  handPlayerResultId: id,
  playerId: id * 10,
  dealer,
  outcome: null,
  endScore: 250,
  scoreChange: 0,
  tenpai: false,
  riichi: false,
  riichiCollected: 0,
  ...over,
});

const input = (over: Partial<ScoreCalcInputDto>): ScoreCalcInputDto => ({
  handId: 1,
  gameId: 1,
  han: 2,
  fu: 30,
  honba: 0,
  handOutcome: 'Ron',
  riichiDeposits: 0,
  isRecordingMultipleRon: false,
  kiriageMangan: false,
  handResults: [seat(1, true), seat(2, false), seat(3, false), seat(4, false)],
  ...over,
});

const deltas = (r: ReturnType<typeof computeScoreChanges>) =>
  r.updates.map((u) => u.scoreChange);

describe('computeScoreChanges', () => {
  describe('Ron', () => {
    const results = (winnerSeat: number, dealInSeat: number) =>
      [seat(1, true), seat(2, false), seat(3, false), seat(4, false)].map(
        (s) =>
          s.handPlayerResultId === winnerSeat
            ? { ...s, outcome: 'Ron' as const }
            : s.handPlayerResultId === dealInSeat
              ? { ...s, outcome: 'Deal-in' as const }
              : s,
      );

    it('pays a non-dealer ron from the deal-in player', () => {
      const r = computeScoreChanges(
        input({ handResults: results(2, 3) }),
        lookup,
      );
      expect(deltas(r)).toEqual([0, 20, -20, 0]);
      expect(r.winnerHandValue).toBe(20);
      expect(r.updates.filter((u) => u.winner)).toHaveLength(1);
    });

    it('uses dealer values when the dealer wins', () => {
      const r = computeScoreChanges(
        input({ handResults: results(1, 4) }),
        lookup,
      );
      expect(deltas(r)).toEqual([29, 0, 0, -29]);
    });

    it('adds honba and riichi sticks to the winner only', () => {
      const r = computeScoreChanges(
        input({ honba: 2, riichiDeposits: 2, handResults: results(2, 3) }),
        lookup,
      );
      // 20 + 2*3 honba + 2 sticks * 10 = 46; deal-in pays 20 + 2*3 = 26
      expect(deltas(r)).toEqual([0, 46, -26, 0]);
      expect(r.winnerHandValue).toBe(20);
    });

    it('looks up mangan and above with fu 0', () => {
      const r = computeScoreChanges(
        input({ han: 5, fu: null, handResults: results(2, 3) }),
        lookup,
      );
      expect(deltas(r)).toEqual([0, 80, -80, 0]);
    });

    it('is idempotent when the pot was already collected by a previous save', () => {
      const handResults = results(2, 3).map((s) =>
        s.handPlayerResultId === 2 ? { ...s, riichiCollected: 2 } : s,
      );
      const r = computeScoreChanges(
        input({ riichiDeposits: 0, handResults }),
        lookup,
      );
      expect(deltas(r)).toEqual([0, 40, -20, 0]);
    });

    it('rejects a ron without exactly one deal-in player', () => {
      expect(() =>
        computeScoreChanges(
          input({
            handResults: results(2, 3).map((s) => ({
              ...s,
              outcome: s.outcome === 'Deal-in' ? null : s.outcome,
            })),
          }),
          lookup,
        ),
      ).toThrow(BadRequestError);
    });
  });

  describe('Tsumo', () => {
    const tsumo = (winnerSeat: number) =>
      [seat(1, true), seat(2, false), seat(3, false), seat(4, false)].map(
        (s) =>
          s.handPlayerResultId === winnerSeat
            ? { ...s, outcome: 'Tsumo' as const }
            : s,
      );

    it('non-dealer tsumo: dealer pays the larger share', () => {
      const r = computeScoreChanges(
        input({ han: 1, fu: 30, handOutcome: 'Tsumo', handResults: tsumo(2) }),
        lookup,
      );
      expect(deltas(r)).toEqual([-5, 11, -3, -3]);
      expect(deltas(r).reduce((a, b) => a + b, 0)).toBe(0);
    });

    it('dealer tsumo: everyone pays the larger share', () => {
      const r = computeScoreChanges(
        input({ han: 2, fu: 30, handOutcome: 'Tsumo', handResults: tsumo(1) }),
        lookup,
      );
      expect(deltas(r)).toEqual([30, -10, -10, -10]);
    });

    it('applies honba per payer and collects the sticks', () => {
      const r = computeScoreChanges(
        input({
          han: 1,
          fu: 30,
          honba: 2,
          riichiDeposits: 1,
          handOutcome: 'Tsumo',
          handResults: tsumo(2),
        }),
        lookup,
      );
      // winner 11 + 2*3 + 10 stick; payers: -5-2, -3-2, -3-2
      expect(deltas(r)).toEqual([-7, 27, -5, -5]);
    });

    it('honours kiriage mangan rounding', () => {
      const base = { han: 4, fu: 30, handOutcome: 'Tsumo' as const };
      const normal = computeScoreChanges(
        input({ ...base, handResults: tsumo(2) }),
        lookup,
      );
      const kiriage = computeScoreChanges(
        input({ ...base, kiriageMangan: true, handResults: tsumo(2) }),
        lookup,
      );
      expect(deltas(normal)[0]).toBe(-39);
      expect(deltas(kiriage)[0]).toBe(-40);
    });
  });

  describe('Draw', () => {
    const draw = (tenpai: boolean[]) =>
      tenpai.map((t, i) => seat(i + 1, i === 0, { tenpai: t }));

    it.each([
      [
        [true, false, false, false],
        [30, -10, -10, -10],
      ],
      [
        [true, true, false, false],
        [15, 15, -15, -15],
      ],
      [
        [true, true, true, false],
        [10, 10, 10, -30],
      ],
      [
        [false, false, false, false],
        [0, 0, 0, 0],
      ],
      [
        [true, true, true, true],
        [0, 0, 0, 0],
      ],
    ])('tenpai %j pays %j', (tenpai, expected) => {
      const r = computeScoreChanges(
        input({ handOutcome: 'Draw', handResults: draw(tenpai) }),
        lookup,
      );
      expect(deltas(r)).toEqual(expected);
      expect(r.winnerHandValue).toBeNull();
      expect(r.updates.every((u) => u.outcome === 'Draw')).toBe(true);
    });
  });

  describe('other outcomes', () => {
    it('applies nothing for a mid game draw', () => {
      const r = computeScoreChanges(
        input({ handOutcome: 'Mid Game Draw' }),
        lookup,
      );
      expect(r.updates).toEqual([]);
    });

    it('rejects multiple ron', () => {
      expect(() =>
        computeScoreChanges(input({ isRecordingMultipleRon: true }), lookup),
      ).toThrow(BadRequestError);
    });

    it('rejects an unset outcome', () => {
      expect(() =>
        computeScoreChanges(input({ handOutcome: null }), lookup),
      ).toThrow(BadRequestError);
    });

    it('rejects a win without han', () => {
      expect(() =>
        computeScoreChanges(
          input({
            han: null,
            handResults: [seat(1, true, { outcome: 'Ron' }), seat(2, false)],
          }),
          lookup,
        ),
      ).toThrow(BadRequestError);
    });

    it('rejects han/fu combinations missing from the lookup', () => {
      expect(() =>
        computeScoreChanges(
          input({
            fu: 110,
            handResults: [
              seat(1, true, { outcome: 'Ron' }),
              seat(2, false, { outcome: 'Deal-in' }),
            ],
          }),
          lookup,
        ),
      ).toThrow(/No score found/);
    });
  });
});
