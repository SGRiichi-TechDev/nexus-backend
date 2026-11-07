import playerController from '#controller/player-controller.js';
import { playerStatusEnum } from '#drizzle/schema.js';
import { BadRequestError, NotFoundError } from '#errors/app-error.js';
import { playerService } from '#services/player.service.js';
import { type Request, type Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

export type Status = (typeof playerStatusEnum.enumValues)[number];

vi.mock('#services/player.service.js', () => ({
  playerService: {
    list: vi.fn(),
    getById: vi.fn(),
    getByTelegramId: vi.fn(),
    searchByName: vi.fn(),
    getCurrentGame: vi.fn(),
    getActiveParticipation: vi.fn(),
  },
}));

const mockedService = vi.mocked(playerService);

const mockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  res.sendStatus = vi.fn().mockReturnValue(res);
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

  it('returns empty array when no players', async () => {
    mockedService.list.mockResolvedValue([]);

    const req = {} as Request;
    const res = mockResponse();

    await playerController.getAllPlayers(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
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

    const req = { params: { id: '1' }, query: {} } as unknown as Request;
    const res = mockResponse();

    await playerController.getPlayerById(req, res);

    expect(mockedService.getById).toHaveBeenCalledWith(1, false);
    expect(res.json).toHaveBeenCalledWith(fakePlayer);
  });

  it('propagates NotFoundError when player not found', async () => {
    mockedService.getById.mockRejectedValue(
      new NotFoundError('Player not found', 'text'),
    );

    const req = { params: { id: '999' }, query: {} } as unknown as Request;
    const res = mockResponse();

    await expect(
      playerController.getPlayerById(req, res),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('propagates unexpected errors', async () => {
    mockedService.getById.mockRejectedValue(new Error('DB error'));

    const req = { params: { id: '1' }, query: {} } as unknown as Request;
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
    expect(mockedService.getCurrentGame).toHaveBeenCalledWith(
      Number(undefined),
    );
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

  it('returns 204 when player has no current game', async () => {
    mockedService.getCurrentGame.mockResolvedValue(null);

    const req = { query: { telegramId: '12345' } } as unknown as Request;
    const res = mockResponse();

    await playerController.getCurrentGameForPlayer(req, res);

    expect(mockedService.getCurrentGame).toHaveBeenCalledWith(12345);
    expect(res.sendStatus).toHaveBeenCalledWith(204);
    expect(res.json).not.toHaveBeenCalled();
  });

  it('returns the current game on success', async () => {
    const fakeGame = {
      gameId: 1,
      status: 'draft' as const,
      handId: 5,
      handOutcome: 'Ron' as const,
      isRecorded: true,
      han: 3,
      finalScoreOnly: false,
      multipleRon: false,
      isRecordingMultipleRon: false,
      players: [],
    };

    mockedService.getCurrentGame.mockResolvedValue(fakeGame);

    const req = { query: { telegramId: '12345' } } as unknown as Request;
    const res = mockResponse();

    await playerController.getCurrentGameForPlayer(req, res);

    expect(mockedService.getCurrentGame).toHaveBeenCalledWith(12345);
    expect(res.json).toHaveBeenCalledWith(fakeGame);
    expect(res.sendStatus).not.toHaveBeenCalledWith(204);
  });

  it('propagates unexpected errors', async () => {
    mockedService.getCurrentGame.mockRejectedValue(new Error('Database error'));

    const req = { query: { telegramId: '12345' } } as unknown as Request;
    const res = mockResponse();

    await expect(
      playerController.getCurrentGameForPlayer(req, res),
    ).rejects.toThrow('Database error');
  });
});
