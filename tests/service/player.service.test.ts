import { BadRequestError, NotFoundError } from '#errors/app-error.js';
import { gameRepository } from '#repositories/game.repository.js';
import { playerRepository } from '#repositories/player.repository.js';
import { playerService } from '#services/player.service.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#repositories/player.repository.js', () => ({
  playerRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByTelegramId: vi.fn(),
  },
}));

vi.mock('#repositories/game.repository.js', () => ({
  gameRepository: {
    findCurrentIncompleteByRecorder: vi.fn(),
  },
}));

const mockedPlayerRepo = vi.mocked(playerRepository);
const mockedGameRepo = vi.mocked(gameRepository);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('playerService.list', () => {
  it('returns players when present', async () => {
    const players = [{ playerId: 1 } as never];
    mockedPlayerRepo.findAll.mockResolvedValue(players);

    await expect(playerService.list()).resolves.toEqual(players);
  });

  it('throws NotFoundError when empty', async () => {
    mockedPlayerRepo.findAll.mockResolvedValue([]);

    await expect(playerService.list()).rejects.toBeInstanceOf(NotFoundError);
    await expect(playerService.list()).rejects.toMatchObject({
      message: 'No players found',
      status: 404,
      format: 'text',
    });
  });
});

describe('playerService.getById', () => {
  it('returns player when found', async () => {
    const player = { playerId: 1 } as never;
    mockedPlayerRepo.findById.mockResolvedValue(player);

    await expect(playerService.getById(1)).resolves.toEqual(player);
    expect(mockedPlayerRepo.findById).toHaveBeenCalledWith(1);
  });

  it('throws NotFoundError when missing', async () => {
    mockedPlayerRepo.findById.mockResolvedValue(undefined);

    await expect(playerService.getById(999)).rejects.toMatchObject({
      message: 'Player not found',
      status: 404,
    });
  });
});

describe('playerService.getCurrentGame', () => {
  it('throws BadRequestError for falsy telegramId', async () => {
    await expect(playerService.getCurrentGame(0)).rejects.toBeInstanceOf(
      BadRequestError,
    );
    expect(mockedPlayerRepo.findByTelegramId).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when player missing', async () => {
    mockedPlayerRepo.findByTelegramId.mockResolvedValue(undefined);

    await expect(playerService.getCurrentGame(12345)).rejects.toMatchObject({
      message: 'Player not found',
    });
  });

  it('throws NotFoundError when no current game', async () => {
    mockedPlayerRepo.findByTelegramId.mockResolvedValue({
      playerId: 1,
    } as never);
    mockedGameRepo.findCurrentIncompleteByRecorder.mockResolvedValue(undefined);

    await expect(playerService.getCurrentGame(12345)).rejects.toMatchObject({
      message: 'No current game found for this player',
    });
  });

  it('returns current game on success', async () => {
    const game = { gameId: 10 } as never;
    mockedPlayerRepo.findByTelegramId.mockResolvedValue({
      playerId: 1,
    } as never);
    mockedGameRepo.findCurrentIncompleteByRecorder.mockResolvedValue(game);

    await expect(playerService.getCurrentGame(12345)).resolves.toEqual(game);
    expect(mockedGameRepo.findCurrentIncompleteByRecorder).toHaveBeenCalledWith(
      1,
    );
  });
});
