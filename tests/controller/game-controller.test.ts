import gameController from '#controller/game-controller.ts';
import { db } from '#db/index.ts';
import type { playerStatusEnum } from '#drizzle/schema.ts';
import { type Request, type Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

export type Status = (typeof playerStatusEnum.enumValues)[number];

vi.mock('#db/index.ts', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    query: {
      gameResult: {
        findFirst: vi.fn(),
      },
    },
  },
}));

const mockedDb = vi.mocked(db);

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

    mockedDb.query.gameResult.findFirst.mockResolvedValueOnce({
      gameId: 1,
      playerId: 1,
      startingSeat: 1,
    });
    mockedDb.orderBy.mockResolvedValueOnce(fakePlayers);

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await gameController.getPlayersByGameId(req, res);

    expect(mockedDb.select).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fakePlayers);
  });

  it('returns empty array when no players found', async () => {
    mockedDb.query.gameResult.findFirst.mockResolvedValueOnce({
      gameId: 1,
      playerId: 1,
      startingSeat: 1,
    });
    mockedDb.orderBy.mockResolvedValueOnce([]);

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await gameController.getPlayersByGameId(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('returns 404 when game not found', async () => {
    mockedDb.query.gameResult.findFirst.mockResolvedValueOnce(null);

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await gameController.getPlayersByGameId(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Game not found',
    });
  });

  it('returns 500 on query error', async () => {
    mockedDb.query.gameResult.findFirst.mockRejectedValueOnce(
      new Error('Database error'),
    );

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await gameController.getPlayersByGameId(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
    });
  });
});
