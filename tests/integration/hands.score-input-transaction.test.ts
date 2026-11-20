import { and, eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { handPlayerResult, handWin } from '#drizzle/schema.js';
import { loadScoreCalcInput } from '#repositories/hand.repository.js';
import { createApp } from '../../src/app.js';
import { db } from '../../src/db/index.js';
import { api } from './setup/api.js';
import { FIXTURES } from './setup/fixtures.js';

const client = api(createApp());

const SCRATCH_TELEGRAM_ID = 900010;

class Rollback extends Error {}

async function bootstrapHand(): Promise<{
  handId: number;
  playerIds: number[];
}> {
  const playerRes = await client.post('/api/v1/players').send({
    displayName: `IT Tx ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  });
  expect(playerRes.status).toBe(201);

  const gameRes = await client
    .post('/api/v1/games')
    .send({ telegramId: SCRATCH_TELEGRAM_ID });
  expect(gameRes.status).toBe(201);
  const gameId = gameRes.body.gameId as number;

  const playerIds = [
    playerRes.body.playerId as number,
    ...FIXTURES.players.slice(0, 3).map((p) => p.playerId),
  ];
  for (const [index, playerId] of playerIds.entries()) {
    const seatRes = await client
      .post(`/api/v1/games/${gameId}/players`)
      .send({ startingSeat: index + 1, playerId });
    expect(seatRes.status).toBe(201);
  }

  const handRes = await client.post(`/api/v1/games/${gameId}/hands`);
  expect(handRes.status).toBe(201);
  return { handId: handRes.body.handId as number, playerIds };
}

describe('loadScoreCalcInput inside a transaction', () => {
  it('sees uncommitted writes made earlier in the same transaction', async () => {
    const { handId, playerIds } = await bootstrapHand();
    const [winnerId, otherId] = playerIds as [number, number];

    await expect(
      db.transaction(async (tx) => {
        await tx
          .update(handPlayerResult)
          .set({ outcome: 'Ron' })
          .where(
            and(
              eq(handPlayerResult.handId, handId),
              eq(handPlayerResult.playerId, winnerId),
            ),
          );
        await tx.insert(handWin).values([
          { handId, winnerPlayerId: winnerId, handValue: 0, winType: 'Ron' },
          { handId, winnerPlayerId: otherId, handValue: 0, winType: 'Ron' },
        ]);

        const input = await loadScoreCalcInput(tx, handId);
        expect(
          input?.handResults.find((r) => r.playerId === winnerId)?.outcome,
        ).toBe('Ron');
        expect(input?.isRecordingMultipleRon).toBe(true);

        throw new Rollback();
      }),
    ).rejects.toBeInstanceOf(Rollback);

    // The transaction rolled back, so nothing it wrote is visible afterwards.
    const committed = await loadScoreCalcInput(db, handId);
    expect(
      committed?.handResults.find((r) => r.playerId === winnerId)?.outcome,
    ).toBeNull();
    expect(committed?.isRecordingMultipleRon).toBe(false);
  });
});
