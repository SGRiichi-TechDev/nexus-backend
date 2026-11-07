import { createApp } from '../../src/app.js';
import { describe, expect, it } from 'vitest';
import { api } from './setup/api.js';
import { FIXTURES } from './setup/fixtures.js';

const app = createApp();
const client = api(app);

const SCRATCH_TELEGRAM_ID = 900010;

describe('write flow: player, game, seats, first and next hand', () => {
  it('creates casual player through next hand with copied scores', async () => {
    const casualName = `IT Casual ${Date.now()}`;

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

    const firstHandRes = await client.post(`/api/v1/games/${gameId}/hands`);
    expect(firstHandRes.status).toBe(201);
    const firstHandId = firstHandRes.body.handId as number;

    const firstDetails = await client.get(`/api/v1/hands/${firstHandId}`);
    expect(firstDetails.status).toBe(200);
    expect(firstDetails.body).toMatchObject({
      handNum: 1,
      wind: 'E',
      roundNum: 1,
      honba: 0,
    });
    expect(firstDetails.body.individualResult).toHaveLength(4);
    const firstStartScores = firstDetails.body.individualResult.map(
      (r: { endScore: number }) => r.endScore,
    );
    expect(firstStartScores.every((score: number) => score === 250)).toBe(true);

    const dealersOnFirst = firstDetails.body.individualResult.filter(
      (r: { dealer: boolean }) => r.dealer,
    );
    expect(dealersOnFirst).toHaveLength(1);
    expect(dealersOnFirst[0].displayName).toBe(casualName);

    const nextHandRes = await client
      .post(`/api/v1/hands/${firstHandId}/next`)
      .send({ wind: 'E', roundNum: 1, honba: 1 });
    expect(nextHandRes.status).toBe(201);
    const nextHandId = nextHandRes.body.handId as number;

    const nextDetails = await client.get(`/api/v1/hands/${nextHandId}`);
    expect(nextDetails.status).toBe(200);
    expect(nextDetails.body).toMatchObject({
      handNum: 2,
      wind: 'E',
      roundNum: 1,
      honba: 1,
    });
    expect(nextDetails.body.individualResult).toHaveLength(4);
    const nextStartScores = nextDetails.body.individualResult.map(
      (r: { endScore: number }) => r.endScore,
    );
    expect(nextStartScores).toEqual(firstStartScores);

    const dealersOnNext = nextDetails.body.individualResult.filter(
      (r: { dealer: boolean }) => r.dealer,
    );
    expect(dealersOnNext).toHaveLength(1);
    expect(dealersOnNext[0].displayName).toBe(casualName);
  });
});
