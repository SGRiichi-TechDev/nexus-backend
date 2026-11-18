import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { api } from './setup/api.js';
import { FIXTURES } from './setup/fixtures.js';

const app = createApp();
const client = api(app);

const SCRATCH_TELEGRAM_ID = 900010;

describe('write endpoints with ?include=session', () => {
  it('returns the refreshed session, and null once the game is gone', async () => {
    const created = await client
      .post('/api/v1/games')
      .send({ telegramId: SCRATCH_TELEGRAM_ID });
    expect(created.status).toBe(201);
    const gameId = created.body.gameId as number;

    // Default response shape is unchanged without the opt-in.
    const plain = await client
      .patch(`/api/v1/games/${gameId}`)
      .send({ isRecorded: false });
    expect(plain.status).toBe(200);
    expect(plain.body).toEqual({ gameId });

    const seat = await client
      .post(`/api/v1/games/${gameId}/players`)
      .query({ include: 'session' })
      .send({ startingSeat: 1, playerId: FIXTURES.players[0].playerId });
    expect(seat.status).toBe(201);
    expect(seat.body.session.gameId).toBe(gameId);
    expect(seat.body.session.players.map((p: { playerId: number }) => p.playerId))
      .toEqual([FIXTURES.players[0].playerId]);

    const updated = await client
      .patch(`/api/v1/games/${gameId}`)
      .query({ include: 'session' })
      .send({ isRecorded: true });
    expect(updated.status).toBe(200);
    expect(updated.body.gameId).toBe(gameId);
    expect(updated.body.session).toMatchObject({
      gameId,
      isRecorded: true,
      handId: null,
      isRecordingMultipleRon: false,
    });
    expect(updated.body.session.players[0].displayName).toBe('IT Alice');

    const hand = await client
      .post(`/api/v1/games/${gameId}/hands`)
      .query({ include: 'session' });
    expect(hand.status).toBe(201);
    expect(hand.body.session.handId).toBe(hand.body.handId);

    const outcome = await client
      .patch(`/api/v1/hands/${hand.body.handId}/outcome`)
      .query({ include: 'session' })
      .send({ outcome: 'Draw' });
    expect(outcome.body.session.gameId).toBe(gameId);
    expect(outcome.body.session.handOutcome).toBe('Draw');

    const removed = await client
      .patch(`/api/v1/games/${gameId}`)
      .query({ include: 'session' })
      .send({ deleted: true });
    expect(removed.status).toBe(200);
    expect(removed.body.session).toBeNull();
  });
});
