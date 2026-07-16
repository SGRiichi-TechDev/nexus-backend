import playerController from '#controller/player-controller.js';
import {
  BadRequestError,
  NotFoundError,
  isAppError,
} from '#errors/app-error.js';
import { playerService } from '#services/player.service.js';
import { playerStatusEnum } from '#drizzle/schema.js';
import { type NextFunction, type Request, type Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

export type Status = (typeof playerStatusEnum.enumValues)[number];

vi.mock('#services/player.service.js', () => ({
  playerService: {
    list: vi.fn(),
    getById: vi.fn(),
    getCurrentGame: vi.fn(),
  },
}));

const mockedService = vi.mocked(playerService);

const mockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
};

/** Simulate Express error middleware for controller unit tests. */
const mockNext =
  (res: Response): NextFunction =>
  (err?: unknown) => {
    if (!err) return;
    if (isAppError(err)) {
      if (err.format === 'text') {
        res.status(err.status).send(err.message);
        return;
      }
      res.status(err.status).json({ error: err.message });
      return;
    }
    res.status(500).send('Internal Server Error');
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
    mockedService.list.mockResolvedValue(fakeRows);

    const req = {} as Request;
    const res = mockResponse();
    const next = mockNext(res);

    await playerController.getAllPlayers(req, res, next);

    expect(mockedService.list).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(fakeRows);
  });

  it('returns 404 when no players found', async () => {
    mockedService.list.mockRejectedValue(
      new NotFoundError('No players found', 'text'),
    );

    const req = {} as Request;
    const res = mockResponse();
    const next = mockNext(res);

    await playerController.getAllPlayers(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('No players found');
  });

  it('returns 500 on query error', async () => {
    mockedService.list.mockRejectedValue(new Error('DB error'));

    const req = {} as Request;
    const res = mockResponse();
    const next = mockNext(res);

    await playerController.getAllPlayers(req, res, next);

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
    mockedService.getById.mockResolvedValue(fakePlayer);

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();
    const next = mockNext(res);

    await playerController.getPlayerById(req, res, next);

    expect(mockedService.getById).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith(fakePlayer);
  });

  it('returns 404 when player not found', async () => {
    mockedService.getById.mockRejectedValue(
      new NotFoundError('Player not found', 'text'),
    );

    const req = { params: { id: '999' } } as unknown as Request;
    const res = mockResponse();
    const next = mockNext(res);

    await playerController.getPlayerById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Player not found');
  });

  it('returns 500 on query error', async () => {
    mockedService.getById.mockRejectedValue(new Error('DB error'));

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();
    const next = mockNext(res);

    await playerController.getPlayerById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Internal Server Error');
  });
});

describe('getCurrentGameForPlayer', () => {
  it('returns 400 when telegramId is missing or invalid', async () => {
    mockedService.getCurrentGame.mockRejectedValue(
      new BadRequestError('Telegram ID is required', 'text'),
    );

    const req = { query: {} } as unknown as Request;
    const res = mockResponse();
    const next = mockNext(res);

    await playerController.getCurrentGameForPlayer(req, res, next);

    expect(mockedService.getCurrentGame).toHaveBeenCalledWith(Number(undefined));
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Telegram ID is required');
  });

  it('returns 404 when player is not found', async () => {
    mockedService.getCurrentGame.mockRejectedValue(
      new NotFoundError('Player not found', 'text'),
    );

    const req = { query: { telegramId: '12345' } } as unknown as Request;
    const res = mockResponse();
    const next = mockNext(res);

    await playerController.getCurrentGameForPlayer(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Player not found');
  });

  it('returns 404 when player has no current game', async () => {
    mockedService.getCurrentGame.mockRejectedValue(
      new NotFoundError('No current game found for this player', 'text'),
    );

    const req = { query: { telegramId: '12345' } } as unknown as Request;
    const res = mockResponse();
    const next = mockNext(res);

    await playerController.getCurrentGameForPlayer(req, res, next);

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
      handOutcome: 'Ron' as const,
      isRecorded: true,
      han: 3,
      finalScoreOnly: false,
      multipleRon: false,
    };

    mockedService.getCurrentGame.mockResolvedValue(fakeGame);

    const req = { query: { telegramId: '12345' } } as unknown as Request;
    const res = mockResponse();
    const next = mockNext(res);

    await playerController.getCurrentGameForPlayer(req, res, next);

    expect(mockedService.getCurrentGame).toHaveBeenCalledWith(12345);
    expect(res.json).toHaveBeenCalledWith(fakeGame);
    expect(res.status).not.toHaveBeenCalledWith(404);
  });

  it('returns 500 when the query throws', async () => {
    mockedService.getCurrentGame.mockRejectedValue(
      new Error('Database error'),
    );

    const req = { query: { telegramId: '12345' } } as unknown as Request;
    const res = mockResponse();
    const next = mockNext(res);

    await playerController.getCurrentGameForPlayer(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Internal Server Error');
  });
});
