import playerController from '#controller/player-controller.js';
import {
  BadRequestError,
  NotFoundError,
} from '#errors/app-error.js';
import { playerService } from '#services/player.service.js';
import { playerStatusEnum } from '#drizzle/schema.js';
import { type Request, type Response } from 'express';
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

    await playerController.getAllPlayers(req, res);

    expect(mockedService.list).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(fakeRows);
  });

  it('propagates NotFoundError when no players found', async () => {
    mockedService.list.mockRejectedValue(
      new NotFoundError('No players found', 'text'),
    );

    const req = {} as Request;
    const res = mockResponse();

    await expect(
      playerController.getAllPlayers(req, res),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('propagates unexpected errors', async () => {
    mockedService.list.mockRejectedValue(new Error('DB error'));

    const req = {} as Request;
    const res = mockResponse();

    await expect(playerController.getAllPlayers(req, res)).rejects.toThrow(
      'DB error',
    );
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

    await playerController.getPlayerById(req, res);

    expect(mockedService.getById).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith(fakePlayer);
  });

  it('propagates NotFoundError when player not found', async () => {
    mockedService.getById.mockRejectedValue(
      new NotFoundError('Player not found', 'text'),
    );

    const req = { params: { id: '999' } } as unknown as Request;
    const res = mockResponse();

    await expect(
      playerController.getPlayerById(req, res),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('propagates unexpected errors', async () => {
    mockedService.getById.mockRejectedValue(new Error('DB error'));

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await expect(playerController.getPlayerById(req, res)).rejects.toThrow(
      'DB error',
    );
  });
});

describe('getCurrentGameForPlayer', () => {
  it('propagates BadRequestError when telegramId is missing or invalid', async () => {
    mockedService.getCurrentGame.mockRejectedValue(
      new BadRequestError('Telegram ID is required', 'text'),
    );

    const req = { query: {} } as unknown as Request;
    const res = mockResponse();

    await expect(
      playerController.getCurrentGameForPlayer(req, res),
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(mockedService.getCurrentGame).toHaveBeenCalledWith(Number(undefined));
  });

  it('propagates NotFoundError when player is not found', async () => {
    mockedService.getCurrentGame.mockRejectedValue(
      new NotFoundError('Player not found', 'text'),
    );

    const req = { query: { telegramId: '12345' } } as unknown as Request;
    const res = mockResponse();

    await expect(
      playerController.getCurrentGameForPlayer(req, res),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('propagates NotFoundError when player has no current game', async () => {
    mockedService.getCurrentGame.mockRejectedValue(
      new NotFoundError('No current game found for this player', 'text'),
    );

    const req = { query: { telegramId: '12345' } } as unknown as Request;
    const res = mockResponse();

    await expect(
      playerController.getCurrentGameForPlayer(req, res),
    ).rejects.toBeInstanceOf(NotFoundError);
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

    await playerController.getCurrentGameForPlayer(req, res);

    expect(mockedService.getCurrentGame).toHaveBeenCalledWith(12345);
    expect(res.json).toHaveBeenCalledWith(fakeGame);
    expect(res.status).not.toHaveBeenCalledWith(404);
  });

  it('propagates unexpected errors', async () => {
    mockedService.getCurrentGame.mockRejectedValue(
      new Error('Database error'),
    );

    const req = { query: { telegramId: '12345' } } as unknown as Request;
    const res = mockResponse();

    await expect(
      playerController.getCurrentGameForPlayer(req, res),
    ).rejects.toThrow('Database error');
  });
});
