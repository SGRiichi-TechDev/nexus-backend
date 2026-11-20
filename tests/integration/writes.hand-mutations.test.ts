import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { api } from './setup/api.js';
import { FIXTURES } from './setup/fixtures.js';

const app = createApp();
const client = api(app);

const SCRATCH_TELEGRAM_ID = 900010;

type ScratchContext = {
  casualPlayerId: number;
  gameId: number;
  handId: number;
  handPlayerBySeat: Map<
    number,
    { playerId: number; handPlayerResultId?: number }
  >;
};

async function bootstrapScratchHand(): Promise<ScratchContext> {
  const casualName = `IT Mut ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const playerRes = await client
    .post('/api/v1/players')
    .send({ displayName: casualName });
  expect(playerRes.status).toBe(201);
  const casualPlayerId = playerRes.body.playerId as number;

  const gameRes = await client
    .post('/api/v1/games')
    .send({ telegramId: SCRATCH_TELEGRAM_ID });
  expect(gameRes.status).toBe(201);
  const gameId = gameRes.body.gameId as number;

  const seatAssignments = [
    { startingSeat: 1, playerId: casualPlayerId },
    { startingSeat: 2, playerId: FIXTURES.players[0].playerId },
    { startingSeat: 3, playerId: FIXTURES.players[1].playerId },
    { startingSeat: 4, playerId: FIXTURES.players[2].playerId },
  ];

  for (const seat of seatAssignments) {
    const seatRes = await client
      .post(`/api/v1/games/${gameId}/players`)
      .send(seat);
    expect(seatRes.status).toBe(201);
  }

  const handRes = await client.post(`/api/v1/games/${gameId}/hands`);
  expect(handRes.status).toBe(201);
  const handId = handRes.body.handId as number;

  const scoreInput = await client.get(`/api/v1/hands/${handId}/score-input`);
  expect(scoreInput.status).toBe(200);

  const handPlayerBySeat = new Map<
    number,
    { playerId: number; handPlayerResultId?: number }
  >();
  handPlayerBySeat.set(1, { playerId: casualPlayerId });
  for (const row of scoreInput.body.handResults as {
    handPlayerResultId: number;
    playerId: number;
  }[]) {
    if (row.playerId === casualPlayerId) {
      handPlayerBySeat.set(1, {
        playerId: casualPlayerId,
        handPlayerResultId: row.handPlayerResultId,
      });
    }
    const seat =
      row.playerId === casualPlayerId
        ? 1
        : FIXTURES.players.findIndex((p) => p.playerId === row.playerId) + 2;
    if (seat >= 1) {
      handPlayerBySeat.set(seat, {
        playerId: row.playerId,
        handPlayerResultId: row.handPlayerResultId,
      });
    }
  }

  return { casualPlayerId, gameId, handId, handPlayerBySeat };
}

describe('write flow: hand mid-game mutations', () => {
  it('riichi + ron path through confirm', async () => {
    const ctx = await bootstrapScratchHand();
    const { handId, casualPlayerId, handPlayerBySeat } = ctx;
    const loserPlayerId = handPlayerBySeat.get(2)?.playerId as number;

    const riichiRes = await client
      .put(`/api/v1/hands/${handId}/riichi`)
      .send({ playerIds: [casualPlayerId] });
    expect(riichiRes.status).toBe(200);

    const inRiichi = await client.get(
      `/api/v1/hands/${handId}/players-in-riichi`,
    );
    expect(inRiichi.status).toBe(200);
    expect(inRiichi.body.map((p: { playerId: number }) => p.playerId)).toEqual([
      casualPlayerId,
    ]);

    const applyRes = await client
      .post(`/api/v1/hands/${handId}/riichi/apply`)
      .send({ playerIds: [casualPlayerId] });
    expect(applyRes.status).toBe(200);

    const afterRiichi = await client.get(`/api/v1/hands/${handId}`);
    expect(afterRiichi.status).toBe(200);
    expect(afterRiichi.body.riichiDeposits).toBe(1);
    const winnerRow = afterRiichi.body.individualResult.find(
      (r: { playerId?: number; riichi: boolean; scoreChange: number }) =>
        r.riichi,
    );
    expect(winnerRow?.scoreChange).toBe(-10);

    await client
      .patch(`/api/v1/hands/${handId}/outcome`)
      .send({ outcome: 'Ron' });
    await client
      .patch(`/api/v1/hands/${handId}/players/${casualPlayerId}`)
      .send({ outcome: 'Ron' });
    await client.post(
      `/api/v1/hands/${handId}/players/${loserPlayerId}/deal-in`,
    );

    await client.patch(`/api/v1/hands/${handId}/han`).send({ han: 3 });
    await client.patch(`/api/v1/hands/${handId}/fu`).send({ fu: 30 });

    const withHanFu = await client.get(`/api/v1/hands/${handId}`);
    expect(withHanFu.body.han).toBe(3);
    expect(withHanFu.body.fu).toBe(30);

    const scoreInput = await client.get(`/api/v1/hands/${handId}/score-input`);
    const winnerHpr = scoreInput.body.handResults.find(
      (r: { playerId: number }) => r.playerId === casualPlayerId,
    );
    const loserHpr = scoreInput.body.handResults.find(
      (r: { playerId: number }) => r.playerId === loserPlayerId,
    );

    const scoreRes = await client
      .post(`/api/v1/hands/${handId}/score-changes`)
      .send({
        updates: [
          {
            handPlayerResultId: winnerHpr.handPlayerResultId,
            scoreChange: 39,
            winner: true,
          },
          {
            handPlayerResultId: loserHpr.handPlayerResultId,
            scoreChange: -39,
            winner: false,
          },
        ],
        winnerHandValue: 49,
      });
    expect(scoreRes.status).toBe(200);

    const afterScore = await client.get(`/api/v1/hands/${handId}`);
    expect(afterScore.body.riichiDeposits).toBe(0);
    expect(afterScore.body.handValue).toBe(49);

    const confirmRes = await client.post(`/api/v1/hands/${handId}/confirm`);
    expect(confirmRes.status).toBe(200);

    const afterConfirm = await client.get(`/api/v1/hands/${handId}`);
    const casualAfter = afterConfirm.body.individualResult.find(
      (r: { riichi: boolean }) => r.riichi,
    );
    expect(casualAfter?.endScore).toBeGreaterThan(250);
  });

  it('riichi apply is idempotent on retry', async () => {
    const ctx = await bootstrapScratchHand();
    const { handId, casualPlayerId } = ctx;

    await client
      .put(`/api/v1/hands/${handId}/riichi`)
      .send({ playerIds: [casualPlayerId] });

    await client
      .post(`/api/v1/hands/${handId}/riichi/apply`)
      .send({ playerIds: [casualPlayerId] });
    await client
      .post(`/api/v1/hands/${handId}/riichi/apply`)
      .send({ playerIds: [casualPlayerId] });

    const details = await client.get(`/api/v1/hands/${handId}`);
    expect(details.body.riichiDeposits).toBe(1);
  });

  it('tenpai and draw payments include riichi penalty in score', async () => {
    const ctx = await bootstrapScratchHand();
    const { handId, casualPlayerId, handPlayerBySeat } = ctx;
    const p2 = handPlayerBySeat.get(2)?.playerId as number;
    const p3 = handPlayerBySeat.get(3)?.playerId as number;
    const p4 = handPlayerBySeat.get(4)?.playerId as number;

    await client
      .put(`/api/v1/hands/${handId}/riichi`)
      .send({ playerIds: [casualPlayerId] });
    await client
      .post(`/api/v1/hands/${handId}/riichi/apply`)
      .send({ playerIds: [casualPlayerId] });

    await client
      .put(`/api/v1/hands/${handId}/tenpai`)
      .send({ playerIds: [casualPlayerId] });

    const inTenpai = await client.get(
      `/api/v1/hands/${handId}/players-in-tenpai`,
    );
    expect(inTenpai.body).toHaveLength(1);

    const drawRes = await client
      .put(`/api/v1/hands/${handId}/draw-payments`)
      .send({
        payments: [
          { playerId: casualPlayerId, outcome: 'Draw', scoreChange: 30 },
          { playerId: p2, outcome: 'Draw', scoreChange: -10 },
          { playerId: p3, outcome: 'Draw', scoreChange: -10 },
          { playerId: p4, outcome: 'Draw', scoreChange: -10 },
        ],
      });
    expect(drawRes.status).toBe(200);

    const details = await client.get(`/api/v1/hands/${handId}`);
    const casualRow = details.body.individualResult.find(
      (r: { riichi: boolean }) => r.riichi,
    );
    expect(casualRow?.scoreChange).toBe(20);
    const notenRows = details.body.individualResult.filter(
      (r: { outcome: string; scoreChange: number }) =>
        r.outcome === 'Draw' && r.scoreChange === -10,
    );
    expect(
      notenRows.every((r: { scoreChange: number }) => r.scoreChange === -10),
    ).toBe(true);
  });

  it('insert hand win twice is conflict-safe', async () => {
    const ctx = await bootstrapScratchHand();
    const { handId, casualPlayerId } = ctx;

    const first = await client
      .post(`/api/v1/hands/${handId}/wins`)
      .send({ winnerPlayerId: casualPlayerId });
    expect(first.status).toBe(201);

    const second = await client
      .post(`/api/v1/hands/${handId}/wins`)
      .send({ winnerPlayerId: casualPlayerId });
    expect(second.status).toBe(201);

    const details = await client.get(`/api/v1/hands/${handId}`);
    const winsForPlayer = details.body.wins.filter(
      (w: { winnerPlayerId: number }) => w.winnerPlayerId === casualPlayerId,
    );
    expect(winsForPlayer).toHaveLength(1);
  });

  it('carries riichi pot to next hand after draw without win', async () => {
    const ctx = await bootstrapScratchHand();
    const { handId, casualPlayerId, handPlayerBySeat } = ctx;
    const p2 = handPlayerBySeat.get(2)?.playerId as number;
    const p3 = handPlayerBySeat.get(3)?.playerId as number;
    const p4 = handPlayerBySeat.get(4)?.playerId as number;

    await client
      .put(`/api/v1/hands/${handId}/riichi`)
      .send({ playerIds: [casualPlayerId] });
    await client
      .post(`/api/v1/hands/${handId}/riichi/apply`)
      .send({ playerIds: [casualPlayerId] });

    const beforeNext = await client.get(`/api/v1/hands/${handId}`);
    expect(beforeNext.body.riichiDeposits).toBe(1);

    await client.put(`/api/v1/hands/${handId}/draw-payments`).send({
      payments: [
        { playerId: casualPlayerId, outcome: 'Draw', scoreChange: 0 },
        { playerId: p2, outcome: 'Draw', scoreChange: 0 },
        { playerId: p3, outcome: 'Draw', scoreChange: 0 },
        { playerId: p4, outcome: 'Draw', scoreChange: 0 },
      ],
    });

    const nextHandRes = await client
      .post(`/api/v1/hands/${handId}/next`)
      .send({ wind: 'E', roundNum: 1, honba: 1 });
    expect(nextHandRes.status).toBe(201);
    const nextHandId = nextHandRes.body.handId as number;

    const nextDetails = await client.get(`/api/v1/hands/${nextHandId}`);
    expect(nextDetails.body.riichiDeposits).toBe(1);

    const nextScoreInput = await client.get(
      `/api/v1/hands/${nextHandId}/score-input`,
    );
    expect(nextScoreInput.body.riichiDeposits).toBe(1);

    await client
      .put(`/api/v1/hands/${nextHandId}/riichi`)
      .send({ playerIds: [p2] });
    await client
      .post(`/api/v1/hands/${nextHandId}/riichi/apply`)
      .send({ playerIds: [p2] });

    const afterSecondRiichi = await client.get(`/api/v1/hands/${nextHandId}`);
    expect(afterSecondRiichi.body.riichiDeposits).toBe(2);
  });

  it('replaceRiichi swaps depositing players while keeping pot stick count', async () => {
    const ctx = await bootstrapScratchHand();
    const { handId, casualPlayerId, handPlayerBySeat } = ctx;
    const p2 = handPlayerBySeat.get(2)?.playerId as number;

    await client
      .put(`/api/v1/hands/${handId}/riichi`)
      .send({ playerIds: [casualPlayerId] });
    await client
      .post(`/api/v1/hands/${handId}/riichi/apply`)
      .send({ playerIds: [casualPlayerId] });

    const beforeReplace = await client.get(`/api/v1/hands/${handId}`);
    expect(beforeReplace.body.riichiDeposits).toBe(1);

    const replaceRes = await client
      .put(`/api/v1/hands/${handId}/riichi`)
      .send({ playerIds: [p2] });
    expect(replaceRes.status).toBe(200);

    const afterReplace = await client.get(`/api/v1/hands/${handId}`);
    expect(afterReplace.body.riichiDeposits).toBe(1);

    const inRiichi = await client.get(
      `/api/v1/hands/${handId}/players-in-riichi`,
    );
    expect(inRiichi.body.map((p: { playerId: number }) => p.playerId)).toEqual([
      p2,
    ]);
  });

  it('resetRiichi clears live deposits back to riichiPotStart', async () => {
    const ctx = await bootstrapScratchHand();
    const { handId, casualPlayerId } = ctx;

    await client
      .put(`/api/v1/hands/${handId}/riichi`)
      .send({ playerIds: [casualPlayerId] });
    await client
      .post(`/api/v1/hands/${handId}/riichi/apply`)
      .send({ playerIds: [casualPlayerId] });

    const beforeReset = await client.get(`/api/v1/hands/${handId}`);
    expect(beforeReset.body.riichiDeposits).toBe(1);

    const resetRes = await client.post(`/api/v1/hands/${handId}/riichi/reset`);
    expect(resetRes.status).toBe(200);

    const afterReset = await client.get(`/api/v1/hands/${handId}`);
    expect(afterReset.body.riichiDeposits).toBe(0);

    const scoreInput = await client.get(`/api/v1/hands/${handId}/score-input`);
    expect(scoreInput.body.riichiDeposits).toBe(0);
  });

  it('winner score-changes collects pot and next hand starts with zero riichi', async () => {
    const ctx = await bootstrapScratchHand();
    const { handId, casualPlayerId, handPlayerBySeat } = ctx;
    const loserPlayerId = handPlayerBySeat.get(2)?.playerId as number;

    await client
      .put(`/api/v1/hands/${handId}/riichi`)
      .send({ playerIds: [casualPlayerId] });
    await client
      .post(`/api/v1/hands/${handId}/riichi/apply`)
      .send({ playerIds: [casualPlayerId] });

    await client
      .patch(`/api/v1/hands/${handId}/outcome`)
      .send({ outcome: 'Ron' });
    await client
      .patch(`/api/v1/hands/${handId}/players/${casualPlayerId}`)
      .send({ outcome: 'Ron' });
    await client.post(
      `/api/v1/hands/${handId}/players/${loserPlayerId}/deal-in`,
    );
    await client.patch(`/api/v1/hands/${handId}/han`).send({ han: 1 });
    await client.patch(`/api/v1/hands/${handId}/fu`).send({ fu: 30 });

    const scoreInput = await client.get(`/api/v1/hands/${handId}/score-input`);
    const winnerHpr = scoreInput.body.handResults.find(
      (r: { playerId: number }) => r.playerId === casualPlayerId,
    );
    const loserHpr = scoreInput.body.handResults.find(
      (r: { playerId: number }) => r.playerId === loserPlayerId,
    );

    const scoreRes = await client
      .post(`/api/v1/hands/${handId}/score-changes`)
      .send({
        updates: [
          {
            handPlayerResultId: winnerHpr.handPlayerResultId,
            scoreChange: 10,
            winner: true,
          },
          {
            handPlayerResultId: loserHpr.handPlayerResultId,
            scoreChange: -10,
            winner: false,
          },
        ],
        winnerHandValue: 20,
      });
    expect(scoreRes.status).toBe(200);

    const afterScore = await client.get(`/api/v1/hands/${handId}`);
    expect(afterScore.body.riichiDeposits).toBe(0);

    const nextHandRes = await client
      .post(`/api/v1/hands/${handId}/next`)
      .send({ wind: 'E', roundNum: 1, honba: 0 });
    expect(nextHandRes.status).toBe(201);
    const nextHandId = nextHandRes.body.handId as number;

    const nextDetails = await client.get(`/api/v1/hands/${nextHandId}`);
    expect(nextDetails.body.riichiDeposits).toBe(0);

    const nextScoreInput = await client.get(
      `/api/v1/hands/${nextHandId}/score-input`,
    );
    expect(nextScoreInput.body.riichiDeposits).toBe(0);
  });
});

describe('write flow: flag toggles', () => {
  const ids = (body: { playerId: number }[]) => body.map((p) => p.playerId);

  it('riichi toggle adds in declaration order, removes, and matches GET', async () => {
    const { handId, handPlayerBySeat } = await bootstrapScratchHand();
    const p1 = handPlayerBySeat.get(1)?.playerId as number;
    const p2 = handPlayerBySeat.get(2)?.playerId as number;
    const p3 = handPlayerBySeat.get(3)?.playerId as number;

    const first = await client
      .post(`/api/v1/hands/${handId}/riichi/toggle`)
      .send({ playerId: p3 });
    expect(first.status).toBe(200);
    expect(ids(first.body)).toEqual([p3]);
    expect(first.body[0].displayName).toEqual(expect.any(String));

    const second = await client
      .post(`/api/v1/hands/${handId}/riichi/toggle`)
      .send({ playerId: p1 });
    expect(ids(second.body)).toEqual([p3, p1]);

    const removed = await client
      .post(`/api/v1/hands/${handId}/riichi/toggle`)
      .send({ playerId: p3 });
    expect(ids(removed.body)).toEqual([p1]);

    const third = await client
      .post(`/api/v1/hands/${handId}/riichi/toggle`)
      .send({ playerId: p2 });
    expect(ids(third.body)).toEqual([p1, p2]);

    const listed = await client.get(
      `/api/v1/hands/${handId}/players-in-riichi`,
    );
    expect(ids(listed.body)).toEqual([p1, p2]);

    const details = await client.get(`/api/v1/hands/${handId}`);
    const rows = details.body.individualResult as { riichi: boolean }[];
    expect(rows.filter((r) => r.riichi)).toHaveLength(2);
  });

  it('tenpai toggle flips the flag on and off', async () => {
    const { handId, handPlayerBySeat } = await bootstrapScratchHand();
    const p2 = handPlayerBySeat.get(2)?.playerId as number;
    const p4 = handPlayerBySeat.get(4)?.playerId as number;

    await client
      .post(`/api/v1/hands/${handId}/tenpai/toggle`)
      .send({ playerId: p2 });
    const both = await client
      .post(`/api/v1/hands/${handId}/tenpai/toggle`)
      .send({ playerId: p4 });
    expect(both.status).toBe(200);
    expect(ids(both.body).sort()).toEqual([p2, p4].sort());

    const off = await client
      .post(`/api/v1/hands/${handId}/tenpai/toggle`)
      .send({ playerId: p2 });
    expect(ids(off.body)).toEqual([p4]);

    const listed = await client.get(
      `/api/v1/hands/${handId}/players-in-tenpai`,
    );
    expect(ids(listed.body)).toEqual([p4]);
  });

  it('chombo toggle sets and clears the Chombo outcome', async () => {
    const { handId, handPlayerBySeat } = await bootstrapScratchHand();
    const p3 = handPlayerBySeat.get(3)?.playerId as number;

    const on = await client
      .post(`/api/v1/hands/${handId}/chombo/toggle`)
      .send({ playerId: p3 });
    expect(on.status).toBe(200);
    expect(ids(on.body)).toEqual([p3]);
    const outcomeOn = await client.get(
      `/api/v1/hands/${handId}/players/${p3}/has-outcome`,
    );
    expect(outcomeOn.body.hasOutcome).toBe(true);

    const off = await client
      .post(`/api/v1/hands/${handId}/chombo/toggle`)
      .send({ playerId: p3 });
    expect(off.body).toEqual([]);
    const outcomeOff = await client.get(
      `/api/v1/hands/${handId}/players/${p3}/has-outcome`,
    );
    expect(outcomeOff.body.hasOutcome).toBe(false);

    const listed = await client.get(
      `/api/v1/hands/${handId}/players-that-chombo`,
    );
    expect(listed.body).toEqual([]);
  });

  it('returns 404 for an unknown hand', async () => {
    const res = await client
      .post('/api/v1/hands/999999999/riichi/toggle')
      .send({ playerId: FIXTURES.players[0].playerId });
    expect(res.status).toBe(404);
  });

  it('returns 400 for a player not seated on the hand', async () => {
    const { handId } = await bootstrapScratchHand();
    const res = await client
      .post(`/api/v1/hands/${handId}/tenpai/toggle`)
      .send({ playerId: 999999999 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when playerId is missing', async () => {
    const { handId } = await bootstrapScratchHand();
    const res = await client
      .post(`/api/v1/hands/${handId}/chombo/toggle`)
      .send({});
    expect(res.status).toBe(400);
  });
});
