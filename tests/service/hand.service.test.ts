import { NotFoundError } from '#errors/app-error.js';
import { handRepository } from '#repositories/hand.repository.js';
import { handService } from '#services/hand.service.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#repositories/hand.repository.js', () => ({
  handRepository: {
    existsById: vi.fn(),
    findPlayersByFlag: vi.fn(),
    findHandDetails: vi.fn(),
    hasPlayerOutcome: vi.fn(),
    findScoreCalcInput: vi.fn(),
    findMultipleRonStatus: vi.fn(),
  },
}));

const mockedRepo = vi.mocked(handRepository);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('handService', () => {
  it('getPlayersInRiichi delegates with riichi flag', async () => {
    const players = [{ playerId: 1 } as never];
    mockedRepo.findPlayersByFlag.mockResolvedValue(players);

    await expect(handService.getPlayersInRiichi(5)).resolves.toEqual(players);
    expect(mockedRepo.findPlayersByFlag).toHaveBeenCalledWith(5, 'riichi');
  });

  it('getPlayersInTenpai delegates with tenpai flag', async () => {
    mockedRepo.findPlayersByFlag.mockResolvedValue([]);

    await expect(handService.getPlayersInTenpai(5)).resolves.toEqual([]);
    expect(mockedRepo.findPlayersByFlag).toHaveBeenCalledWith(5, 'tenpai');
  });

  it('getPlayersThatChombo delegates with chombo flag', async () => {
    mockedRepo.findPlayersByFlag.mockResolvedValue([]);

    await expect(handService.getPlayersThatChombo(5)).resolves.toEqual([]);
    expect(mockedRepo.findPlayersByFlag).toHaveBeenCalledWith(5, 'chombo');
  });

  it('getHandDetails throws when hand missing', async () => {
    mockedRepo.findHandDetails.mockResolvedValue(undefined);

    await expect(handService.getHandDetails(1)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('hasPlayerOutcome returns outcome flag', async () => {
    mockedRepo.existsById.mockResolvedValue(true);
    mockedRepo.hasPlayerOutcome.mockResolvedValue(true);

    await expect(handService.hasPlayerOutcome(1, 2)).resolves.toEqual({
      hasOutcome: true,
    });
  });
});
