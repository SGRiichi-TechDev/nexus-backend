import playerController from '#controller/player-controller.ts';
import { pool } from '#db/db.ts';
import { type Request, type Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the database module to avoid actual database calls during testing
vi.mock('#db/db.ts', () => ({
  pool: {
    query: vi.fn(),
  },
}));

const mockedQuery = vi.mocked(pool.query);

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
    const fakeRows = [{ pid: 1, display_name: 'Alice' }];
    mockedQuery.mockResolvedValue({ rows: fakeRows } as any);

    const req = {} as Request;
    const res = mockResponse();

    await playerController.getAllPlayers(req, res);

    expect(mockedQuery).toHaveBeenCalledWith('SELECT * FROM players');
    expect(res.json).toHaveBeenCalledWith(fakeRows);
  });

  it('returns 500 on query error', async () => {
    mockedQuery.mockRejectedValue(new Error('DB error'));

    const req = {} as Request;
    const res = mockResponse();

    await playerController.getAllPlayers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Internal Server Error');
  });
});

describe('getPlayerById', () => {
  it('returns a player when found', async () => {
    const fakePlayer = { pid: 1, display_name: 'Alice' };
    mockedQuery.mockResolvedValue({ rows: [fakePlayer] } as any);

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await playerController.getPlayerById(req, res);

    expect(mockedQuery).toHaveBeenCalledWith(
      'SELECT * FROM players WHERE pid = $1',
      ['1'],
    );
    expect(res.json).toHaveBeenCalledWith(fakePlayer);
  });

  it('returns 404 when player not found', async () => {
    mockedQuery.mockResolvedValue({ rows: [] } as any);

    const req = { params: { id: '999' } } as unknown as Request;
    const res = mockResponse();

    await playerController.getPlayerById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Player not found');
  });

  it('returns 500 on query error', async () => {
    mockedQuery.mockRejectedValue(new Error('DB error'));

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await playerController.getPlayerById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Internal Server Error');
  });
});
