import playerController from '#controller/player-controller.js';
import { db } from '#db/index.js';
import { playerStatusEnum } from '#drizzle/schema.js';
import { type Request, type Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

export type Status = (typeof playerStatusEnum.enumValues)[number];

// Mock the database module to avoid actual database calls during testing
vi.mock('#db/index.js', () => ({
  db: {
    query: {
      playerInfo: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
  },
}));

const mockedQuery = vi.mocked(db.query.playerInfo);

const mockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getAllPlayers', () => {
  it('returns players on success', async () => {
    const fakeRows = [
      {
        telegramId: 12345,
        playerId: 1,
        displayName: 'Alice',
        status: 'active' as Status,
        ctryCd: '',
        ctyCd: '',
      },
    ];
    mockedQuery.findMany.mockResolvedValue(fakeRows);

    const req = {} as Request;
    const res = mockResponse();

    await playerController.getAllPlayers(req, res);

    expect(mockedQuery.findMany).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(fakeRows);
  });

  it('returns 404 when no players found', async () => {
    mockedQuery.findMany.mockResolvedValue([]);

    const req = {} as Request;
    const res = mockResponse();

    await playerController.getAllPlayers(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('No players found');
  });

  it('returns 500 on query error', async () => {
    mockedQuery.findMany.mockRejectedValue(new Error('DB error'));

    const req = {} as Request;
    const res = mockResponse();

    await playerController.getAllPlayers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Internal Server Error');
  });
});

describe('getPlayerById', () => {
  it('returns a player when found', async () => {
    const fakePlayer = {
      telegramId: 12345,
      playerId: 1,
      displayName: 'Alice',
      status: 'active' as Status,
      ctryCd: '',
      ctyCd: '',
    };
    mockedQuery.findFirst.mockResolvedValue(fakePlayer);

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await playerController.getPlayerById(req, res);

    expect(mockedQuery.findFirst).toHaveBeenCalledWith({
      where: { playerId: 1 },
    });
    expect(res.json).toHaveBeenCalledWith(fakePlayer);
  });

  it('returns 404 when player not found', async () => {
    // mock to return empty rows to simulate player not found
    mockedQuery.findFirst.mockResolvedValue(undefined);

    const req = { params: { id: '999' } } as unknown as Request;
    const res = mockResponse();

    await playerController.getPlayerById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Player not found');
  });

  it('returns 500 on query error', async () => {
    mockedQuery.findFirst.mockRejectedValue(new Error('DB error'));

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await playerController.getPlayerById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Internal Server Error');
  });
});
