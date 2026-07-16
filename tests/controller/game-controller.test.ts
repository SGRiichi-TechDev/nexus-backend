import gameController from '#controller/game-controller.js';
import { NotFoundError } from '#errors/app-error.js';
import { gameService } from '#services/game.service.js';
import type { playerStatusEnum } from '#drizzle/schema.js';
import { type Request, type Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

export type Status = (typeof playerStatusEnum.enumValues)[number];

vi.mock('#services/game.service.js', () => ({
  gameService: {
    getPlayers: vi.fn(),
    getRuleset: vi.fn(),
  },
}));

const mockedService = vi.mocked(gameService);

const mockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getPlayersByGameId', () => {
  it('returns players on success', async () => {
    const fakePlayers = [
      {
        telegramId: 1,
        playerId: 1,
        displayName: 'Alice',
        status: 'active' as Status,
        ctryCd: '',
        ctyCd: '',
      },
      {
        telegramId: 2,
        playerId: 2,
        displayName: 'Bob',
        status: 'active' as Status,
        ctryCd: '',
        ctyCd: '',
      },
      {
        telegramId: 3,
        playerId: 3,
        displayName: 'Charlie',
        status: 'active' as Status,
        ctryCd: '',
        ctyCd: '',
      },
      {
        telegramId: 4,
        playerId: 4,
        displayName: 'David',
        status: 'active' as Status,
        ctryCd: '',
        ctyCd: '',
      },
    ];

    mockedService.getPlayers.mockResolvedValue(fakePlayers);

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await gameController.getPlayersByGameId(req, res);

    expect(mockedService.getPlayers).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fakePlayers);
  });

  it('returns empty array when no players found', async () => {
    mockedService.getPlayers.mockResolvedValue([]);

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await gameController.getPlayersByGameId(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('propagates NotFoundError when game not found', async () => {
    mockedService.getPlayers.mockRejectedValue(
      new NotFoundError('Game not found', 'json'),
    );

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await expect(
      gameController.getPlayersByGameId(req, res),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('propagates unexpected errors', async () => {
    mockedService.getPlayers.mockRejectedValue(new Error('Database error'));

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await expect(
      gameController.getPlayersByGameId(req, res),
    ).rejects.toThrow('Database error');
  });
});

describe('getRulesetInfoByGameId', () => {
  it('returns ruleset on success', async () => {
    const fakeRuleset = {
      initialValue: 25000,
      aka: 'Aka-Ari' as const,
      umaP1: 15,
      umaP2: 5,
      umaP3: -5,
      umaP4: -15,
      oka: 0,
      chomboValue: 20,
      chomboOption: 'Payment to all' as const,
      kiriageMangan: false,
      multipleRon: false,
    };

    mockedService.getRuleset.mockResolvedValue(fakeRuleset);

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await gameController.getRulesetInfoByGameId(req, res);

    expect(mockedService.getRuleset).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith(fakeRuleset);
  });

  it('propagates NotFoundError when ruleset not found', async () => {
    mockedService.getRuleset.mockRejectedValue(
      new NotFoundError('Ruleset info not found', 'json'),
    );

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await expect(
      gameController.getRulesetInfoByGameId(req, res),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
