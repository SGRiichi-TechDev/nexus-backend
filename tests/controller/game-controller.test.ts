import gameController from '#controller/game-controller.js';
import { db } from '#db/index.js';
import type { playerStatusEnum } from '#drizzle/schema.js';
import { type Request, type Response } from 'express';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

export type Status = (typeof playerStatusEnum.enumValues)[number];

interface MockDb {
  select: Mock;
  from: Mock;
  innerJoin: Mock;
  where: Mock;
  orderBy: Mock;
  limit: Mock;
}

function createMockDb(): MockDb {
  return {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  };
}

vi.mock('#db/index.js', () => ({
  db: createMockDb(),
}));

const mockedDb = db as unknown as MockDb;

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

    mockedDb.limit.mockResolvedValueOnce([
      {
        gameId: 1,
        playerId: 1,
        startingSeat: 1,
      },
    ]);
    mockedDb.orderBy.mockResolvedValueOnce(fakePlayers);

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await gameController.getPlayersByGameId(req, res);

    expect(mockedDb.select).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fakePlayers);
  });

  it('returns empty array when no players found', async () => {
    mockedDb.limit.mockResolvedValueOnce([
      {
        gameId: 1,
        playerId: 1,
        startingSeat: 1,
      },
    ]);
    mockedDb.orderBy.mockResolvedValueOnce([]);

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await gameController.getPlayersByGameId(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('returns 404 when game not found', async () => {
    mockedDb.limit.mockResolvedValueOnce([]);

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await gameController.getPlayersByGameId(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Game not found',
    });
  });

  it('returns 500 on query error', async () => {
    mockedDb.limit.mockRejectedValueOnce(new Error('Database error'));

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await gameController.getPlayersByGameId(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
    });
  });
});
