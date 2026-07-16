import gameController from '#controller/game-controller.js';
import { NotFoundError, isAppError } from '#errors/app-error.js';
import { gameService } from '#services/game.service.js';
import type { playerStatusEnum } from '#drizzle/schema.js';
import { type NextFunction, type Request, type Response } from 'express';
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

const mockNext =
  (res: Response): NextFunction =>
  (err?: unknown) => {
    if (!err) return;
    if (isAppError(err)) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
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
    const next = mockNext(res);

    await gameController.getPlayersByGameId(req, res, next);

    expect(mockedService.getPlayers).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fakePlayers);
  });

  it('returns empty array when no players found', async () => {
    mockedService.getPlayers.mockResolvedValue([]);

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();
    const next = mockNext(res);

    await gameController.getPlayersByGameId(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('returns 404 when game not found', async () => {
    mockedService.getPlayers.mockRejectedValue(
      new NotFoundError('Game not found', 'json'),
    );

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();
    const next = mockNext(res);

    await gameController.getPlayersByGameId(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Game not found',
    });
  });

  it('returns 500 on query error', async () => {
    mockedService.getPlayers.mockRejectedValue(new Error('Database error'));

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();
    const next = mockNext(res);

    await gameController.getPlayersByGameId(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
    });
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
    const next = mockNext(res);

    await gameController.getRulesetInfoByGameId(req, res, next);

    expect(mockedService.getRuleset).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith(fakeRuleset);
  });

  it('returns 404 when ruleset not found', async () => {
    mockedService.getRuleset.mockRejectedValue(
      new NotFoundError('Ruleset info not found', 'json'),
    );

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();
    const next = mockNext(res);

    await gameController.getRulesetInfoByGameId(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Ruleset info not found',
    });
  });
});
