import { NotFoundError } from '#errors/app-error.js';
import { gameRepository } from '#repositories/game.repository.js';
import { gameService } from '#services/game.service.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#repositories/game.repository.js', () => ({
  gameRepository: {
    findFirstResultByGameId: vi.fn(),
    findPlayersOrderedBySeat: vi.fn(),
    findRulesetByGameId: vi.fn(),
  },
}));

const mockedRepo = vi.mocked(gameRepository);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('gameService.getPlayers', () => {
  it('throws NotFoundError when game does not exist', async () => {
    mockedRepo.findFirstResultByGameId.mockResolvedValue(undefined);

    await expect(gameService.getPlayers(1)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(mockedRepo.findPlayersOrderedBySeat).not.toHaveBeenCalled();
  });

  it('returns players ordered by seat when game exists', async () => {
    const players = [{ playerId: 1 } as never];
    mockedRepo.findFirstResultByGameId.mockResolvedValue({
      gameId: 1,
    } as never);
    mockedRepo.findPlayersOrderedBySeat.mockResolvedValue(players);

    await expect(gameService.getPlayers(1)).resolves.toEqual(players);
    expect(mockedRepo.findPlayersOrderedBySeat).toHaveBeenCalledWith(1);
  });
});

describe('gameService.getRuleset', () => {
  it('throws NotFoundError when ruleset missing', async () => {
    mockedRepo.findRulesetByGameId.mockResolvedValue(undefined);

    await expect(gameService.getRuleset(1)).rejects.toMatchObject({
      message: 'Ruleset info not found',
      status: 404,
      format: 'json',
    });
  });

  it('returns ruleset when found', async () => {
    const ruleset = { initialValue: 25000 } as never;
    mockedRepo.findRulesetByGameId.mockResolvedValue(ruleset);

    await expect(gameService.getRuleset(1)).resolves.toEqual(ruleset);
  });
});
