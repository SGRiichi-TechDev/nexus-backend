import { createApp } from '../../src/app.js';
import { db } from '../../src/db/index.js';
import { gameInfo } from '#drizzle/schema.js';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { api } from './setup/api.js';
import { FIXTURES } from './setup/fixtures.js';

const app = createApp();
const client = api(app);

const SCRATCH_TELEGRAM_ID = 900010;
const MISSING_GAME_ID = 999999;

const CUSTOM_AFTER_FIRST_PATCH = {
  initialValue: 300,
  aka: 'Aka-Nashi',
  umaP1: 15,
  umaP2: 5,
  umaP3: -5,
  umaP4: -15,
  oka: 0,
  chomboValue: 40,
  chomboOption: 'Payment to all',
  kiriageMangan: true,
  multipleRon: false,
};

type ScratchGame = {
  gameId: number;
  casualPlayerId: number;
  handId?: number | undefined;
};

async function bootstrapScratchGame(options?: {
  withHand?: boolean;
  seatCount?: number;
}): Promise<ScratchGame> {
  const casualName = `IT Settings ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

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

async function applyItRuleset(gameId: number): Promise<void> {
  const res = await client
    .put(`/api/v1/games/${gameId}/ruleset`)
    .send({ name: 'IT Ruleset' });
  expect(res.status).toBe(200);
}

async function readGameCompletion(gameId: number) {
  const rows = await db
    .select({
      completed: gameInfo.completed,
      endedAt: gameInfo.endedAt,
    })
    .from(gameInfo)
    .where(eq(gameInfo.gameId, gameId))
    .limit(1);
  return rows[0];
}

describe('write flow: settings and game completion', () => {
  it('creates Custom ruleset and applies in-place patches', async () => {
    const { gameId } = await bootstrapScratchGame();

    const before = await client.get(`/api/v1/games/${gameId}/ruleset`);
    expect(before.status).toBe(204);

    const patch1 = await client
      .patch(`/api/v1/games/${gameId}/ruleset`)
      .send({ initialValue: 300, aka: 'Aka-Nashi' });
    expect(patch1.status).toBe(200);

    const after1 = await client.get(`/api/v1/games/${gameId}/ruleset`);
    expect(after1.status).toBe(200);
    expect(after1.body).toEqual(CUSTOM_AFTER_FIRST_PATCH);

    const patch2 = await client
      .patch(`/api/v1/games/${gameId}/ruleset`)
      .send({
        multipleRon: true,
        chomboOption: 'Flat deduction',
        chomboValue: 0,
      });
    expect(patch2.status).toBe(200);

    const after2 = await client.get(`/api/v1/games/${gameId}/ruleset`);
    expect(after2.status).toBe(200);
    expect(after2.body).toMatchObject({
      initialValue: 300,
      aka: 'Aka-Nashi',
      multipleRon: true,
      chomboOption: 'Flat deduction',
      chomboValue: 0,
    });
  });

  it('ruleset patch is idempotent on retry', async () => {
    const { gameId } = await bootstrapScratchGame();
    const body = { initialValue: 275, kiriageMangan: false };

    await client.patch(`/api/v1/games/${gameId}/ruleset`).send(body);
    await client.patch(`/api/v1/games/${gameId}/ruleset`).send(body);

    const ruleset = await client.get(`/api/v1/games/${gameId}/ruleset`);
    expect(ruleset.status).toBe(200);
    expect(ruleset.body.initialValue).toBe(275);
    expect(ruleset.body.kiriageMangan).toBe(false);
  });

  it('applies named ruleset and copy-on-write keeps seed preset untouched', async () => {
    const { gameId } = await bootstrapScratchGame();

    const applyRes = await client
      .put(`/api/v1/games/${gameId}/ruleset`)
      .send({ name: 'IT Ruleset' });
    expect(applyRes.status).toBe(200);

    const localRuleset = await client.get(`/api/v1/games/${gameId}/ruleset`);
    expect(localRuleset.body).toEqual(FIXTURES.ruleset);

    const patchRes = await client
      .patch(`/api/v1/games/${gameId}/ruleset`)
      .send({ chomboValue: 99 });
    expect(patchRes.status).toBe(200);

    const afterPatch = await client.get(`/api/v1/games/${gameId}/ruleset`);
    expect(afterPatch.body.chomboValue).toBe(99);

    const seedRuleset = await client.get(
      `/api/v1/games/${FIXTURES.gameId}/ruleset`,
    );
    expect(seedRuleset.status).toBe(200);
    expect(seedRuleset.body).toEqual(FIXTURES.ruleset);

    const unknown = await client
      .put(`/api/v1/games/${gameId}/ruleset`)
      .send({ name: 'Does Not Exist' });
    expect(unknown.status).toBe(404);
    expect(unknown.body).toEqual({ error: 'Ruleset not found' });

    const customName = await client
      .put(`/api/v1/games/${gameId}/ruleset`)
      .send({ name: 'Custom' });
    expect(customName.status).toBe(400);
  });

  it('available rulesets lists IT Ruleset but not Custom', async () => {
    const { gameId } = await bootstrapScratchGame();
    await client
      .patch(`/api/v1/games/${gameId}/ruleset`)
      .send({ initialValue: 260 });

    const res = await client.get(
      `/api/v1/games/${gameId}/available-rulesets`,
    );
    expect(res.status).toBe(200);
    expect(res.body.names).toContain('IT Ruleset');
    expect(res.body.names).not.toContain('Custom');
  });

  it('validates ruleset and game patch inputs', async () => {
    const { gameId } = await bootstrapScratchGame();

    const emptyPatch = await client
      .patch(`/api/v1/games/${gameId}/ruleset`)
      .send({});
    expect(emptyPatch.status).toBe(400);

    const badAka = await client
      .patch(`/api/v1/games/${gameId}/ruleset`)
      .send({ aka: 'x' });
    expect(badAka.status).toBe(400);

    const badInitial = await client
      .patch(`/api/v1/games/${gameId}/ruleset`)
      .send({ initialValue: -1 });
    expect(badInitial.status).toBe(400);

    const badBool = await client
      .patch(`/api/v1/games/${gameId}/ruleset`)
      .send({ kiriageMangan: 'yes' });
    expect(badBool.status).toBe(400);

    const missingGame = await client.patch(
      `/api/v1/games/${MISSING_GAME_ID}/ruleset`,
    ).send({ initialValue: 250 });
    expect(missingGame.status).toBe(404);

    const finalScoreOnly = await client
      .patch(`/api/v1/games/${gameId}`)
      .send({ finalScoreOnly: true });
    expect(finalScoreOnly.status).toBe(200);
    expect(finalScoreOnly.body).toEqual({ gameId });
  });

  it('sets and overwrites player penalties', async () => {
    const { gameId, casualPlayerId } = await bootstrapScratchGame();

    const first = await client
      .put(`/api/v1/games/${gameId}/players/${casualPlayerId}/penalty`)
      .send({ penalty: 40 });
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ gameId, playerId: casualPlayerId });

    let penalties = await client.get(`/api/v1/games/${gameId}/penalties`);
    const firstPenalty = penalties.body.find(
      (row: { name: string; penalty: number }) => row.penalty === 40,
    );
    expect(firstPenalty).toBeDefined();

    const second = await client
      .put(`/api/v1/games/${gameId}/players/${casualPlayerId}/penalty`)
      .send({ penalty: 10 });
    expect(second.status).toBe(200);

    penalties = await client.get(`/api/v1/games/${gameId}/penalties`);
    const updated = penalties.body.find(
      (row: { penalty: number }) => row.penalty === 10,
    );
    expect(updated).toBeDefined();

    const unseated = await client
      .put(`/api/v1/games/${gameId}/players/${FIXTURES.players[3].playerId}/penalty`)
      .send({ penalty: 5 });
    expect(unseated.status).toBe(404);
    expect(unseated.body).toEqual({ error: 'Player not seated in game' });

    const negative = await client
      .put(`/api/v1/games/${gameId}/players/${casualPlayerId}/penalty`)
      .send({ penalty: -1 });
    expect(negative.status).toBe(400);
  });

  it('sets final scores, recomputes positions, and handles validation', async () => {
    const { gameId } = await bootstrapScratchGame();
    await applyItRuleset(gameId);

    const scores = [350, 280, 220, -40];
    for (let seat = 1; seat <= 4; seat += 1) {
      const res = await client
        .put(`/api/v1/games/${gameId}/seats/${seat}/final-score`)
        .send({ score: scores[seat - 1] });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ gameId, startingSeat: seat });
    }

    const recompute = await client.post(
      `/api/v1/games/${gameId}/positions/recompute`,
    );
    expect(recompute.status).toBe(200);

    let finalScore = await client.get(`/api/v1/games/${gameId}/final-score`);
    expect(finalScore.status).toBe(200);
    const positions = finalScore.body.individual.map(
      (row: { position: number }) => row.position,
    );
    expect(positions).toEqual([1, 2, 3, 4]);

    await client.post(`/api/v1/games/${gameId}/positions/recompute`);
    finalScore = await client.get(`/api/v1/games/${gameId}/final-score`);
    expect(
      finalScore.body.individual.map(
        (row: { position: number }) => row.position,
      ),
    ).toEqual([1, 2, 3, 4]);

    for (let seat = 1; seat <= 4; seat += 1) {
      await client
        .put(`/api/v1/games/${gameId}/seats/${seat}/final-score`)
        .send({ score: 250 });
    }
    await client.post(`/api/v1/games/${gameId}/positions/recompute`);
    finalScore = await client.get(`/api/v1/games/${gameId}/final-score`);
    expect(
      finalScore.body.individual.every(
        (row: { position: number }) => row.position === 2.5,
      ),
    ).toBe(true);

    const badSeat = await client
      .put(`/api/v1/games/${gameId}/seats/5/final-score`)
      .send({ score: 100 });
    expect(badSeat.status).toBe(400);

    const emptySeatGame = await bootstrapScratchGame({ seatCount: 3 });
    const missingSeat = await client
      .put(`/api/v1/games/${emptySeatGame.gameId}/seats/4/final-score`)
      .send({ score: 100 });
    expect(missingSeat.status).toBe(404);
    expect(missingSeat.body).toEqual({ error: 'Seat not found' });
  });

  it('completes a normal game from the last confirmed hand', async () => {
    const { gameId, casualPlayerId, handId } = await bootstrapScratchGame({
      withHand: true,
    });
    await applyItRuleset(gameId);

    await client
      .put(`/api/v1/hands/${handId}/riichi`)
      .send({ playerIds: [casualPlayerId] });
    await client
      .post(`/api/v1/hands/${handId}/riichi/apply`)
      .send({ playerIds: [casualPlayerId] });
    await client.post(`/api/v1/hands/${handId}/confirm`);

    const complete1 = await client.post(`/api/v1/games/${gameId}/complete`);
    expect(complete1.status).toBe(200);
    expect(complete1.body).toEqual({ gameId });

    const finalScore = await client.get(`/api/v1/games/${gameId}/final-score`);
    expect(finalScore.status).toBe(200);
    const scoresByValue = finalScore.body.individual.map(
      (row: { score: number; position: number }) => ({
        score: row.score,
        position: row.position,
      }),
    );
    expect(scoresByValue).toContainEqual({ score: 240, position: 4 });
    expect(
      scoresByValue.filter(
        (row: { score: number; position: number }) => row.score === 250,
      ),
    ).toEqual([
      { score: 250, position: 2 },
      { score: 250, position: 2 },
      { score: 250, position: 2 },
    ]);

    const afterFirst = await readGameCompletion(gameId);
    expect(afterFirst?.completed).toBe(true);
    expect(afterFirst?.endedAt).not.toBeNull();

    const complete2 = await client.post(`/api/v1/games/${gameId}/complete`);
    expect(complete2.status).toBe(200);

    const afterSecond = await readGameCompletion(gameId);
    expect(afterSecond?.endedAt?.toISOString()).toBe(
      afterFirst?.endedAt?.toISOString(),
    );
  });

  it('rejects complete when there are no completed hands', async () => {
    const seatedOnly = await bootstrapScratchGame();
    const noHands = await client.post(
      `/api/v1/games/${seatedOnly.gameId}/complete`,
    );
    expect(noHands.status).toBe(400);
    expect(noHands.body).toEqual({ error: 'Game has no completed hands' });

    const withHand = await bootstrapScratchGame({ withHand: true });
    const unconfirmed = await client.post(
      `/api/v1/games/${withHand.gameId}/complete`,
    );
    expect(unconfirmed.status).toBe(400);
    expect(unconfirmed.body).toEqual({ error: 'Game has no completed hands' });
  });

  it('completes final-score-only games without hands', async () => {
    const { gameId } = await bootstrapScratchGame();
    await applyItRuleset(gameId);

    await client.patch(`/api/v1/games/${gameId}`).send({ finalScoreOnly: true });

    const scores = [400, 300, 200, 100];
    for (let seat = 1; seat <= 4; seat += 1) {
      await client
        .put(`/api/v1/games/${gameId}/seats/${seat}/final-score`)
        .send({ score: scores[seat - 1] });
    }
    await client.post(`/api/v1/games/${gameId}/positions/recompute`);

    const complete = await client.post(`/api/v1/games/${gameId}/complete`);
    expect(complete.status).toBe(200);

    const finalScore = await client.get(`/api/v1/games/${gameId}/final-score`);
    expect(
      finalScore.body.individual.map((row: { score: number }) => row.score),
    ).toEqual(scores);

    const flags = await readGameCompletion(gameId);
    expect(flags?.completed).toBe(true);
    expect(flags?.endedAt).not.toBeNull();
  });

  it('returns 404 for missing games on new write routes', async () => {
    const routes: Array<{
      call: () => ReturnType<typeof client.post>;
      label: string;
    }> = [
      {
        label: 'PATCH ruleset',
        call: () =>
          client
            .patch(`/api/v1/games/${MISSING_GAME_ID}/ruleset`)
            .send({ initialValue: 250 }),
      },
      {
        label: 'PUT ruleset',
        call: () =>
          client
            .put(`/api/v1/games/${MISSING_GAME_ID}/ruleset`)
            .send({ name: 'IT Ruleset' }),
      },
      {
        label: 'PUT penalty',
        call: () =>
          client
            .put(
              `/api/v1/games/${MISSING_GAME_ID}/players/${FIXTURES.players[0].playerId}/penalty`,
            )
            .send({ penalty: 1 }),
      },
      {
        label: 'PUT final-score',
        call: () =>
          client
            .put(`/api/v1/games/${MISSING_GAME_ID}/seats/1/final-score`)
            .send({ score: 250 }),
      },
      {
        label: 'POST positions/recompute',
        call: () =>
          client.post(
            `/api/v1/games/${MISSING_GAME_ID}/positions/recompute`,
          ),
      },
      {
        label: 'POST complete',
        call: () => client.post(`/api/v1/games/${MISSING_GAME_ID}/complete`),
      },
    ];

    for (const route of routes) {
      const res = await route.call();
      expect(res.status, route.label).toBe(404);
      expect(res.body).toEqual({ error: 'Game not found' });
    }
  });
});
