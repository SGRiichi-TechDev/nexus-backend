import { BadRequestError, NotFoundError } from '#errors/app-error.js';
import { gameRepository } from '#repositories/game.repository.js';
import { modeRepository } from '#repositories/mode.repository.js';
import { playerRepository } from '#repositories/player.repository.js';
import { rulesetRepository } from '#repositories/ruleset.repository.js';
import { gameService } from '#services/game.service.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#repositories/game.repository.js', () => ({
  gameRepository: {
    allocateNextGameId: vi.fn(),
    insertDraftGame: vi.fn(),
    updateGameFields: vi.fn(),
    existsById: vi.fn(),
    findFirstResultByGameId: vi.fn(),
    findPlayersOrderedBySeat: vi.fn(),
    findRulesetByGameId: vi.fn(),
    findFinalScoreByGameId: vi.fn(),
    findPenaltiesByGameId: vi.fn(),
    countCompletedHands: vi.fn(),
    findLastCompletedHandId: vi.fn(),
    findLastHandForNextInsert: vi.fn(),
    findTelegramIdsByGameId: vi.fn(),
    findVenueAndModeByGameId: vi.fn(),
    findVenueIdByGameId: vi.fn(),
  },
}));

vi.mock('#repositories/player.repository.js', () => ({
  playerRepository: {
    findByTelegramId: vi.fn(),
  },
}));

vi.mock('#repositories/mode.repository.js', () => ({
  modeRepository: {
    findActiveByVenueId: vi.fn(),
    findModeIdByGameAndName: vi.fn(),
  },
}));

vi.mock('#repositories/ruleset.repository.js', () => ({
  rulesetRepository: {
    findAvailableNames: vi.fn(),
  },
}));

const mockedRepo = vi.mocked(gameRepository);
const mockedModeRepo = vi.mocked(modeRepository);
const mockedRulesetRepo = vi.mocked(rulesetRepository);
const mockedPlayerRepo = vi.mocked(playerRepository);

beforeEach(() => {
  vi.clearAllMocks();
  mockedRepo.existsById.mockResolvedValue(true);
});

describe('gameService.createDraftGame', () => {
  it('throws BadRequestError when telegramId is missing', async () => {
    await expect(gameService.createDraftGame(0)).rejects.toBeInstanceOf(
      BadRequestError,
    );
    expect(mockedPlayerRepo.findByTelegramId).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when player is missing', async () => {
    mockedPlayerRepo.findByTelegramId.mockResolvedValue(undefined);

    await expect(gameService.createDraftGame(123)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(mockedRepo.allocateNextGameId).not.toHaveBeenCalled();
  });

  it('allocates id and inserts draft game', async () => {
    mockedPlayerRepo.findByTelegramId.mockResolvedValue({
      playerId: 5,
    } as never);
    mockedRepo.allocateNextGameId.mockResolvedValue(42);
    mockedRepo.insertDraftGame.mockResolvedValue({ gameId: 42 });

    await expect(gameService.createDraftGame(123)).resolves.toEqual({
      gameId: 42,
    });
    expect(mockedRepo.insertDraftGame).toHaveBeenCalledWith({
      gameId: 42,
      recordedByPid: 5,
    });
  });
});

describe('gameService.updateGame', () => {
  it('throws BadRequestError for empty patch', async () => {
    await expect(gameService.updateGame(1, {})).rejects.toBeInstanceOf(
      BadRequestError,
    );
    expect(mockedRepo.existsById).not.toHaveBeenCalled();
  });

  it('throws when game missing', async () => {
    mockedRepo.existsById.mockResolvedValue(false);

    await expect(
      gameService.updateGame(1, { venueId: 2 }),
    ).rejects.toMatchObject({ message: 'Game not found' });
    expect(mockedRepo.updateGameFields).not.toHaveBeenCalled();
  });

  it('updates fields and returns gameId', async () => {
    await expect(
      gameService.updateGame(1, { modeId: 3, isRecorded: true }),
    ).resolves.toEqual({ gameId: 1 });
    expect(mockedRepo.updateGameFields).toHaveBeenCalledWith(1, {
      modeId: 3,
      isRecorded: true,
    });
  });

  it('allows soft-delete via deleted patch', async () => {
    await expect(
      gameService.updateGame(1, { deleted: true }),
    ).resolves.toEqual({ gameId: 1 });
    expect(mockedRepo.updateGameFields).toHaveBeenCalledWith(1, {
      deleted: true,
    });
  });
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

describe('gameService.getFinalScore', () => {
  it('throws when game missing', async () => {
    mockedRepo.existsById.mockResolvedValue(false);

    await expect(gameService.getFinalScore(1)).rejects.toMatchObject({
      message: 'Game not found',
    });
  });

  it('returns final score when found', async () => {
    const finalScore = {
      gameId: 1,
      initialValue: 25000,
      umaP1: 15,
      umaP2: 5,
      umaP3: -5,
      umaP4: -15,
      individual: [],
    };
    mockedRepo.findFinalScoreByGameId.mockResolvedValue(finalScore);

    await expect(gameService.getFinalScore(1)).resolves.toEqual(finalScore);
  });
});

describe('gameService.getAvailableRulesets', () => {
  it('returns active ruleset names', async () => {
    mockedRulesetRepo.findAvailableNames.mockResolvedValue(['Club', 'Tournament']);

    await expect(gameService.getAvailableRulesets(1)).resolves.toEqual({
      names: ['Club', 'Tournament'],
    });
    expect(mockedRulesetRepo.findAvailableNames).toHaveBeenCalled();
  });
});

describe('gameService.getModes', () => {
  it('returns modes for game venue', async () => {
    mockedRepo.findVenueIdByGameId.mockResolvedValue(2);
    mockedModeRepo.findActiveByVenueId.mockResolvedValue([{ name: 'Club' }]);

    await expect(gameService.getModes(1)).resolves.toEqual([{ name: 'Club' }]);
    expect(mockedModeRepo.findActiveByVenueId).toHaveBeenCalledWith(2);
  });
});
