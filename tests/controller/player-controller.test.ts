import playerController from '#controller/player-controller.js';
import { db } from '#db/index.js';
import { playerStatusEnum } from '#drizzle/schema.js';
import { type Request, type Response } from 'express';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

export type Status = (typeof playerStatusEnum.enumValues)[number];

interface MockDb {
  select: Mock;
  from: Mock;
  where: Mock;
  leftJoin: Mock;
  orderBy: Mock;
  limit: Mock;
}

// Mock the database module to avoid actual database calls during testing
vi.mock('#db/index.js', () => ({
  db: {
    query: {
      playerInfo: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn(),
  },
}));

const mockedQuery = vi.mocked(db.query.playerInfo);
const mockedDb = vi.mocked(db) as unknown as MockDb;

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

describe('getCurrentGameForPlayer', () => {
  it('returns 400 when telegramId is missing or invalid', async () => {
    const req = { query: {} } as unknown as Request;
    const res = mockResponse();

    await playerController.getCurrentGameForPlayer(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Telegram ID is required');
    expect(mockedDb.select).not.toHaveBeenCalled(); // never reaches the query
  });

  it('returns 404 when player is not found', async () => {
    mockedDb.limit.mockResolvedValueOnce([]); // playerInfo lookup: empty

    const req = { query: { telegramId: '12345' } } as unknown as Request;
    const res = mockResponse();

    await playerController.getCurrentGameForPlayer(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Player not found');
  });

  it('returns 404 when player has no current game', async () => {
    mockedDb.limit
      .mockResolvedValueOnce([{ playerId: 1, telegramId: 12345 }]) // playerInfo lookup
      .mockResolvedValueOnce([]); // currentGame lookup: empty

    const req = { query: { telegramId: '12345' } } as unknown as Request;
    const res = mockResponse();

    await playerController.getCurrentGameForPlayer(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith(
      'No current game found for this player',
    );
  });

  it('returns the current game on success', async () => {
    const fakeGame = {
      gameId: 1,
      submissionStage: 'in_progress',
      handId: 5,
      handOutcome: 'win',
      isRecorded: true,
      han: 3,
      finalScoreOnly: false,
      multipleRon: false,
    };

    mockedDb.limit
      .mockResolvedValueOnce([{ playerId: 1, telegramId: 12345 }]) // playerInfo lookup
      .mockResolvedValueOnce([fakeGame]); // currentGame lookup

    const req = { query: { telegramId: '12345' } } as unknown as Request;
    const res = mockResponse();

    await playerController.getCurrentGameForPlayer(req, res);

    expect(res.json).toHaveBeenCalledWith(fakeGame);
    expect(res.status).not.toHaveBeenCalledWith(404);
  });

  it('returns 500 when the query throws', async () => {
    mockedDb.limit.mockRejectedValueOnce(new Error('Database error'));

    const req = { query: { telegramId: '12345' } } as unknown as Request;
    const res = mockResponse();

    await playerController.getCurrentGameForPlayer(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Internal Server Error');
  });
});
