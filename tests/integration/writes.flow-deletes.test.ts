import { createApp } from '../../src/app.js';
import { db } from '../../src/db/index.js';
import {
  handInfo,
  handPlayerResult,
  handTransaction,
  handWin,
  handYaku,
  yakuLookup,
} from '#drizzle/schema.js';
import { count, eq, inArray } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { api } from './setup/api.js';
import { FIXTURES } from './setup/fixtures.js';

const app = createApp();
const client = api(app);

const SCRATCH_TELEGRAM_ID = 900010;
const MISSING_GAME_ID = 999999;
const SEED_GAME_ID = FIXTURES.gameId;

type ScratchGame = {
  gameId: number;
  casualPlayerId: number;
  handId?: number | undefined;
};

type HandSeatMap = Map<
  number,
  { playerId: number; handPlayerResultId?: number }
>;

async function bootstrapScratchGame(options?: {
  withHand?: boolean;
  seatCount?: number;
}): Promise<ScratchGame> {
  const casualName = `IT FlowDel ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

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

  const seatCount = options?.seatCount ?? 4;
  const fixturePlayers = [
    casualPlayerId,
    FIXTURES.players[0].playerId,
    FIXTURES.players[1].playerId,
    FIXTURES.players[2].playerId,
  ].slice(0, seatCount);

  for (let seat = 0; seat < fixturePlayers.length; seat += 1) {
    const seatRes = await client
      .post(`/api/v1/games/${gameId}/players`)
      .send({ startingSeat: seat + 1, playerId: fixturePlayers[seat] });
    expect(seatRes.status).toBe(201);
  }

  if (options?.withHand) {
    const handRes = await client.post(`/api/v1/games/${gameId}/hands`);
    expect(handRes.status).toBe(201);
    return {
      gameId,
      casualPlayerId,
      handId: handRes.body.handId as number,
    };
  }

  return { gameId, casualPlayerId };
}

async function loadHandPlayerBySeat(
  handId: number,
  casualPlayerId: number,
): Promise<HandSeatMap> {
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
  return handPlayerBySeat;
}

async function applyRonPath(
  handId: number,
  winnerPlayerId: number,
  loserPlayerId: number,
): Promise<void> {
  await client.patch(`/api/v1/hands/${handId}/outcome`).send({ outcome: 'Ron' });
  await client
    .patch(`/api/v1/hands/${handId}/players/${winnerPlayerId}`)
    .send({ outcome: 'Ron' });
  await client.post(
    `/api/v1/hands/${handId}/players/${loserPlayerId}/deal-in`,
  );
  await client.patch(`/api/v1/hands/${handId}/han`).send({ han: 3 });
  await client.patch(`/api/v1/hands/${handId}/fu`).send({ fu: 30 });
}

async function countHandWinRows(handId: number): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(handWin)
    .where(eq(handWin.handId, handId));
  return Number(row?.value ?? 0);
}

async function countHandYakuRows(handId: number): Promise<number> {
  const winIds = await db
    .select({ handWinId: handWin.handWinId })
    .from(handWin)
    .where(eq(handWin.handId, handId));
  if (winIds.length === 0) {
    return 0;
  }
  const [row] = await db
    .select({ value: count() })
    .from(handYaku)
    .where(
      inArray(
        handYaku.handWinId,
        winIds.map((w) => w.handWinId),
      ),
    );
  return Number(row?.value ?? 0);
}

async function countByHandId(
  table:
    | typeof handTransaction
    | typeof handPlayerResult
    | typeof handInfo,
  handId: number,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(table)
    .where(eq(table.handId, handId));
  return Number(row?.value ?? 0);
}

async function assertAllHandChildrenZero(handId: number): Promise<void> {
  expect(await countHandYakuRows(handId)).toBe(0);
  expect(await countHandWinRows(handId)).toBe(0);
  expect(await countByHandId(handTransaction, handId)).toBe(0);
  expect(await countByHandId(handPlayerResult, handId)).toBe(0);
  expect(await countByHandId(handInfo, handId)).toBe(0);
}

async function nagashiManganYakuId(): Promise<number> {
  const rows = await db
    .select({ yakuId: yakuLookup.yakuId })
    .from(yakuLookup)
    .where(eq(yakuLookup.yakuName, 'Nagashi Mangan'))
    .limit(1);
  expect(rows[0]?.yakuId).toBeDefined();
  return rows[0]!.yakuId;
}

type SeedSnapshot = {
  handCount: number;
  players: unknown;
};

let seedBefore: SeedSnapshot;

describe('write flow: hand delete and seat clear', () => {
  beforeAll(async () => {
    const handCount = await client.get(
      `/api/v1/games/${SEED_GAME_ID}/hands/count`,
    );
    expect(handCount.status).toBe(200);
    const players = await client.get(`/api/v1/games/${SEED_GAME_ID}/players`);
    expect(players.status).toBe(200);
    seedBefore = {
      handCount: handCount.body.count as number,
      players: players.body,
    };
  });

  it('deletes latest incomplete first hand and allows recreate', async () => {
    const { gameId, handId } = await bootstrapScratchGame({ withHand: true });
    expect(handId).toBeDefined();

    const delRes = await client.delete(
      `/api/v1/games/${gameId}/hands/latest`,
    );
    expect(delRes.status).toBe(200);
    expect(delRes.body).toEqual({
      gameId,
      handId,
      deleted: true,
    });

    const missingHand = await client.get(`/api/v1/hands/${handId}`);
    expect(missingHand.status).toBe(404);

    const handCount = await client.get(`/api/v1/games/${gameId}/hands/count`);
    expect(handCount.status).toBe(200);
    expect(handCount.body).toEqual({ count: 0 });

    const players = await client.get(`/api/v1/games/${gameId}/players`);
    expect(players.status).toBe(200);
    expect(players.body).toHaveLength(4);

    expect(await countByHandId(handPlayerResult, handId!)).toBe(0);

    const recreate = await client.post(`/api/v1/games/${gameId}/hands`);
    expect(recreate.status).toBe(201);
  });

  it('cascades all five hand child tables including transaction and yaku', async () => {
    const { gameId, casualPlayerId, handId } = await bootstrapScratchGame({
      withHand: true,
    });
    const handPlayerBySeat = await loadHandPlayerBySeat(handId!, casualPlayerId);
    const loserPlayerId = handPlayerBySeat.get(2)!.playerId;

    await applyRonPath(handId!, casualPlayerId, loserPlayerId);

    const winRows = await db
      .select({ handWinId: handWin.handWinId })
      .from(handWin)
      .where(eq(handWin.handId, handId!));
    expect(winRows).toHaveLength(1);
    const handWinId = winRows[0]!.handWinId;

    await db.insert(handTransaction).values({
      handId: handId!,
      payerPlayerId: loserPlayerId,
      payeePlayerId: casualPlayerId,
      amount: 3900,
    });

    const yakuId = await nagashiManganYakuId();
    await db.insert(handYaku).values({ handWinId, yakuId });

    expect(await countHandYakuRows(handId!)).toBeGreaterThan(0);
    expect(await countHandWinRows(handId!)).toBeGreaterThan(0);
    expect(await countByHandId(handTransaction, handId!)).toBe(1);
    expect(await countByHandId(handPlayerResult, handId!)).toBe(4);
    expect(await countByHandId(handInfo, handId!)).toBe(1);

    const delRes = await client.delete(
      `/api/v1/games/${gameId}/hands/latest`,
    );
    expect(delRes.status).toBe(200);
    expect(delRes.body.deleted).toBe(true);
    expect(delRes.body.handId).toBe(handId);

    await assertAllHandChildrenZero(handId!);
  });

  it('removes only the latest hand across repeated deletes', async () => {
    const { gameId, casualPlayerId, handId: hand1Id } = await bootstrapScratchGame({
      withHand: true,
    });
    const handPlayerBySeat = await loadHandPlayerBySeat(hand1Id!, casualPlayerId);
    const p2 = handPlayerBySeat.get(2)!.playerId;
    const p3 = handPlayerBySeat.get(3)!.playerId;
    const p4 = handPlayerBySeat.get(4)!.playerId;

    await client.put(`/api/v1/hands/${hand1Id}/draw-payments`).send({
      payments: [
        { playerId: casualPlayerId, outcome: 'Draw', scoreChange: 0 },
        { playerId: p2, outcome: 'Draw', scoreChange: 0 },
        { playerId: p3, outcome: 'Draw', scoreChange: 0 },
        { playerId: p4, outcome: 'Draw', scoreChange: 0 },
      ],
    });
    const confirm1 = await client.post(`/api/v1/hands/${hand1Id}/confirm`);
    expect(confirm1.status).toBe(200);

    const nextRes = await client
      .post(`/api/v1/hands/${hand1Id}/next`)
      .send({ wind: 'E', roundNum: 1, honba: 1 });
    expect(nextRes.status).toBe(201);
    const hand2Id = nextRes.body.handId as number;

    const del2 = await client.delete(`/api/v1/games/${gameId}/hands/latest`);
    expect(del2.status).toBe(200);
    expect(del2.body).toEqual({ gameId, handId: hand2Id, deleted: true });

    const hand1Still = await client.get(`/api/v1/hands/${hand1Id}`);
    expect(hand1Still.status).toBe(200);

    const lastCompleted = await client.get(
      `/api/v1/games/${gameId}/hands/last-completed`,
    );
    expect(lastCompleted.status).toBe(200);
    expect(lastCompleted.body).toEqual({ handId: hand1Id });

    expect(await countByHandId(handPlayerResult, hand1Id!)).toBe(4);

    const del1 = await client.delete(`/api/v1/games/${gameId}/hands/latest`);
    expect(del1.status).toBe(200);
    expect(del1.body).toEqual({ gameId, handId: hand1Id, deleted: true });

    const hand1Gone = await client.get(`/api/v1/hands/${hand1Id}`);
    expect(hand1Gone.status).toBe(404);

    const delNone = await client.delete(`/api/v1/games/${gameId}/hands/latest`);
    expect(delNone.status).toBe(200);
    expect(delNone.body).toEqual({
      gameId,
      handId: null,
      deleted: false,
    });
  });

  it('no-ops when the game has no hands', async () => {
    const { gameId } = await bootstrapScratchGame();

    const delRes = await client.delete(
      `/api/v1/games/${gameId}/hands/latest`,
    );
    expect(delRes.status).toBe(200);
    expect(delRes.body).toEqual({
      gameId,
      handId: null,
      deleted: false,
    });

    const players = await client.get(`/api/v1/games/${gameId}/players`);
    expect(players.body).toHaveLength(4);
  });

  it('rejects delete latest on completed games', async () => {
    const { gameId } = await bootstrapScratchGame();

    await client.patch(`/api/v1/games/${gameId}`).send({ finalScoreOnly: true });
    const complete = await client.post(`/api/v1/games/${gameId}/complete`);
    expect(complete.status).toBe(200);

    const delRes = await client.delete(
      `/api/v1/games/${gameId}/hands/latest`,
    );
    expect(delRes.status).toBe(400);
    expect(delRes.body).toEqual({ error: 'Game is already completed' });
  });

  it('returns 404 when deleting latest hand for a missing game', async () => {
    const res = await client.delete(
      `/api/v1/games/${MISSING_GAME_ID}/hands/latest`,
    );
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Game not found' });
  });

  it('clears seats, supports re-seat, and idempotent second clear', async () => {
    const { gameId } = await bootstrapScratchGame();

    const clear1 = await client.delete(`/api/v1/games/${gameId}/players`);
    expect(clear1.status).toBe(200);
    expect(clear1.body).toEqual({ gameId, deleted: 4 });

    const empty = await client.get(`/api/v1/games/${gameId}/players`);
    expect(empty.status).toBe(200);
    expect(empty.body).toEqual([]);

    const secondPlayers = [
      FIXTURES.players[3].playerId,
      FIXTURES.players[4].playerId,
      FIXTURES.players[5].playerId,
      await createCasualPlayerId(),
    ];
    for (let seat = 0; seat < 4; seat += 1) {
      const seatRes = await client
        .post(`/api/v1/games/${gameId}/players`)
        .send({ startingSeat: seat + 1, playerId: secondPlayers[seat] });
      expect(seatRes.status).toBe(201);
    }

    const clear2 = await client.delete(`/api/v1/games/${gameId}/players`);
    expect(clear2.status).toBe(200);
    expect(clear2.body).toEqual({ gameId, deleted: 4 });

    const clear3 = await client.delete(`/api/v1/games/${gameId}/players`);
    expect(clear3.status).toBe(200);
    expect(clear3.body).toEqual({ gameId, deleted: 0 });
  });

  it('rejects clear seats when hands exist or game is completed', async () => {
    const withHand = await bootstrapScratchGame({ withHand: true });
    const blocked = await client.delete(
      `/api/v1/games/${withHand.gameId}/players`,
    );
    expect(blocked.status).toBe(400);
    expect(blocked.body).toEqual({
      error: 'Cannot clear seats after hands exist',
    });
    const stillSeated = await client.get(
      `/api/v1/games/${withHand.gameId}/players`,
    );
    expect(stillSeated.body).toHaveLength(4);

    const completedGame = await bootstrapScratchGame();
    await client
      .patch(`/api/v1/games/${completedGame.gameId}`)
      .send({ finalScoreOnly: true });
    const complete = await client.post(
      `/api/v1/games/${completedGame.gameId}/complete`,
    );
    expect(complete.status).toBe(200);

    const completedClear = await client.delete(
      `/api/v1/games/${completedGame.gameId}/players`,
    );
    expect(completedClear.status).toBe(400);
    expect(completedClear.body).toEqual({
      error: 'Game is already completed',
    });

    const missing = await client.delete(
      `/api/v1/games/${MISSING_GAME_ID}/players`,
    );
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: 'Game not found' });
  });

  it('rejects seating without clearing when seats are already taken', async () => {
    const { gameId, casualPlayerId } = await bootstrapScratchGame();
    const duplicate = await client
      .post(`/api/v1/games/${gameId}/players`)
      .send({ startingSeat: 1, playerId: FIXTURES.players[3].playerId });
    expect(duplicate.status).toBeGreaterThanOrEqual(400);

    const unchanged = await client.get(`/api/v1/games/${gameId}/players`);
    expect(unchanged.body).toHaveLength(4);
    const seatedIds = unchanged.body.map(
      (row: { playerId: number }) => row.playerId,
    );
    expect(seatedIds).toContain(casualPlayerId);
  });

  it('leaves integration seed game 9001 unchanged', async () => {
    const handCount = await client.get(
      `/api/v1/games/${SEED_GAME_ID}/hands/count`,
    );
    expect(handCount.status).toBe(200);
    expect(handCount.body.count).toBe(seedBefore.handCount);

    const players = await client.get(`/api/v1/games/${SEED_GAME_ID}/players`);
    expect(players.status).toBe(200);
    expect(players.body).toEqual(seedBefore.players);
  });
});

async function createCasualPlayerId(): Promise<number> {
  const casualName = `IT Re-seat ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const playerRes = await client
    .post('/api/v1/players')
    .send({ displayName: casualName });
  expect(playerRes.status).toBe(201);
  return playerRes.body.playerId as number;
}