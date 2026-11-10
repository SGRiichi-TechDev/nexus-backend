import { BadRequestError, NotFoundError } from '#errors/app-error.js';
import { handRepository } from '#repositories/hand.repository.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#repositories/hand.repository.js', () => ({
  handRepository: {
    existsById: vi.fn(),
    insertNextHand: vi.fn(),
    findPlayersByFlag: vi.fn(),
    findHandDetails: vi.fn(),
    hasPlayerOutcome: vi.fn(),
    findScoreCalcInput: vi.fn(),
    findMultipleRonStatus: vi.fn(),
    existsPlayerOnHand: vi.fn(),
    replaceRiichi: vi.fn(),
    applyRiichiResult: vi.fn(),
    resetRiichi: vi.fn(),
    setHandOutcome: vi.fn(),
    setPlayerOutcome: vi.fn(),
    setDealIn: vi.fn(),
    upsertHan: vi.fn(),
    upsertFu: vi.fn(),
    replaceTenpai: vi.fn(),
    setDrawPayments: vi.fn(),
    replaceChombo: vi.fn(),
    findGameIdByHandId: vi.fn(),
    findPlayerIdsOnHand: vi.fn(),
    applyChomboScores: vi.fn(),
    existsHandPlayerResultOnHand: vi.fn(),
    applyScoreChanges: vi.fn(),
    confirmHand: vi.fn(),
    insertHandWin: vi.fn(),
  },
}));

vi.mock('#repositories/game.repository.js', () => ({
  gameRepository: {
    findRulesetByGameId: vi.fn(),
  },
}));

vi.mock('#repositories/player.repository.js', () => ({
  playerRepository: {
    findById: vi.fn(),
  },
}));

import { gameRepository } from '#repositories/game.repository.js';
import { playerRepository } from '#repositories/player.repository.js';
import {
  computeChomboScoreByPlayer,
  handService,
} from '#services/hand.service.js';

const mockedRepo = vi.mocked(handRepository);
const mockedGameRepo = vi.mocked(gameRepository);
const mockedPlayerRepo = vi.mocked(playerRepository);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('handService.createNextHand', () => {
  it('throws NotFoundError when previous hand is missing', async () => {
    mockedRepo.existsById.mockResolvedValue(false);

    await expect(
      handService.createNextHand(1, { wind: 'E', roundNum: 1, honba: 0 }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(mockedRepo.insertNextHand).not.toHaveBeenCalled();
  });

  it('throws BadRequestError for invalid wind', async () => {
    await expect(
      handService.createNextHand(1, {
        wind: 'X' as 'E',
        roundNum: 1,
        honba: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(mockedRepo.existsById).not.toHaveBeenCalled();
  });

  it('returns handId on success', async () => {
    mockedRepo.existsById.mockResolvedValue(true);
    mockedRepo.insertNextHand.mockResolvedValue({ handId: 99 });

    await expect(
      handService.createNextHand(5, { wind: 'S', roundNum: 4, honba: 2 }),
    ).resolves.toEqual({ handId: 99 });
    expect(mockedRepo.insertNextHand).toHaveBeenCalledWith(5, 'S', 4, 2);
  });
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

describe('handService mid-game mutations', () => {
  it('replaceRiichi throws NotFoundError when hand missing', async () => {
    mockedRepo.existsById.mockResolvedValue(false);

    await expect(handService.replaceRiichi(1, [2, 3])).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(mockedRepo.replaceRiichi).not.toHaveBeenCalled();
  });

  it('replaceRiichi forwards playerIds when hand exists', async () => {
    mockedRepo.existsById.mockResolvedValue(true);
    mockedRepo.replaceRiichi.mockResolvedValue({ handId: 1 });

    await expect(handService.replaceRiichi(1, [10, 20])).resolves.toEqual({
      handId: 1,
    });
    expect(mockedRepo.replaceRiichi).toHaveBeenCalledWith(1, [10, 20]);
  });

  it('replaceRiichi rejects non-array playerIds', async () => {
    await expect(handService.replaceRiichi(1, 'bad')).rejects.toBeInstanceOf(
      BadRequestError,
    );
    expect(mockedRepo.existsById).not.toHaveBeenCalled();
  });

  it('setHandOutcome rejects invalid enum', async () => {
    await expect(
      handService.setHandOutcome(1, 'NotARealOutcome'),
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(mockedRepo.setHandOutcome).not.toHaveBeenCalled();
  });

  it('applyRiichi calls applyRiichiResult', async () => {
    mockedRepo.existsById.mockResolvedValue(true);
    mockedRepo.findPlayerIdsOnHand.mockResolvedValue([1, 2, 3, 4]);
    mockedRepo.applyRiichiResult.mockResolvedValue({ handId: 5 });

    await expect(handService.applyRiichi(5, [1])).resolves.toEqual({
      handId: 5,
    });
    expect(mockedRepo.applyRiichiResult).toHaveBeenCalledWith(5, [1]);
  });

  it('applyRiichi rejects duplicate playerIds', async () => {
    mockedRepo.existsById.mockResolvedValue(true);

    await expect(handService.applyRiichi(5, [1, 1])).rejects.toBeInstanceOf(
      BadRequestError,
    );
    expect(mockedRepo.applyRiichiResult).not.toHaveBeenCalled();
  });

  it('applyRiichi rejects playerIds not on hand', async () => {
    mockedRepo.existsById.mockResolvedValue(true);
    mockedRepo.findPlayerIdsOnHand.mockResolvedValue([1, 2, 3, 4]);

    await expect(handService.applyRiichi(5, [99])).rejects.toBeInstanceOf(
      BadRequestError,
    );
    expect(mockedRepo.applyRiichiResult).not.toHaveBeenCalled();
  });

  it('replaceRiichi rejects more than four playerIds', async () => {
    await expect(
      handService.replaceRiichi(1, [1, 2, 3, 4, 5]),
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(mockedRepo.existsById).not.toHaveBeenCalled();
  });

  it('resetRiichi calls resetRiichi', async () => {
    mockedRepo.existsById.mockResolvedValue(true);
    mockedRepo.resetRiichi.mockResolvedValue({ handId: 3 });

    await expect(handService.resetRiichi(3)).resolves.toEqual({ handId: 3 });
    expect(mockedRepo.resetRiichi).toHaveBeenCalledWith(3);
  });

  it('setHan rejects non-integer han', async () => {
    await expect(handService.setHan(1, 1.5)).rejects.toBeInstanceOf(
      BadRequestError,
    );
    expect(mockedRepo.upsertHan).not.toHaveBeenCalled();
  });

  it('setFu rejects non-integer fu', async () => {
    await expect(handService.setFu(1, Number.NaN)).rejects.toBeInstanceOf(
      BadRequestError,
    );
    expect(mockedRepo.upsertFu).not.toHaveBeenCalled();
  });

  it('setDealIn forwards playerId when player on hand', async () => {
    mockedRepo.existsById.mockResolvedValue(true);
    mockedRepo.existsPlayerOnHand.mockResolvedValue(true);
    mockedRepo.setDealIn.mockResolvedValue({ handId: 7, playerId: 99 });

    await expect(handService.setDealIn(7, 99)).resolves.toEqual({
      handId: 7,
      playerId: 99,
    });
    expect(mockedRepo.setDealIn).toHaveBeenCalledWith(7, 99);
  });
});

describe('handService tenpai chombo score confirm', () => {
  it('replaceTenpai forwards playerIds', async () => {
    mockedRepo.existsById.mockResolvedValue(true);
    mockedRepo.replaceTenpai.mockResolvedValue({ handId: 2 });

    await expect(handService.replaceTenpai(2, [1, 3])).resolves.toEqual({
      handId: 2,
    });
    expect(mockedRepo.replaceTenpai).toHaveBeenCalledWith(2, [1, 3]);
  });

  it('setDrawPayments forwards payments', async () => {
    mockedRepo.existsById.mockResolvedValue(true);
    mockedRepo.setDrawPayments.mockResolvedValue({ handId: 4 });

    const payments = [
      { playerId: 1, outcome: 'Draw', scoreChange: 30 },
      { playerId: 2, outcome: 'Draw', scoreChange: -10 },
    ];
    await expect(handService.setDrawPayments(4, payments)).resolves.toEqual({
      handId: 4,
    });
    expect(mockedRepo.setDrawPayments).toHaveBeenCalledWith(4, payments);
  });

  it('applyChombo throws when game has no ruleset', async () => {
    mockedRepo.existsById.mockResolvedValue(true);
    mockedRepo.findGameIdByHandId.mockResolvedValue(100);
    mockedGameRepo.findRulesetByGameId.mockResolvedValue(undefined);

    await expect(handService.applyChombo(5, [1])).rejects.toBeInstanceOf(
      BadRequestError,
    );
    expect(mockedRepo.applyChomboScores).not.toHaveBeenCalled();
  });

  it('applyChombo rejects duplicate chombo playerIds', async () => {
    mockedRepo.existsById.mockResolvedValue(true);

    await expect(handService.applyChombo(5, [1, 1])).rejects.toBeInstanceOf(
      BadRequestError,
    );
    expect(mockedRepo.applyChomboScores).not.toHaveBeenCalled();
  });

  it('applyChombo rejects chombo playerIds not on hand', async () => {
    mockedRepo.existsById.mockResolvedValue(true);
    mockedRepo.findPlayerIdsOnHand.mockResolvedValue([1, 2, 3, 4]);

    await expect(handService.applyChombo(5, [99])).rejects.toBeInstanceOf(
      BadRequestError,
    );
    expect(mockedRepo.applyChomboScores).not.toHaveBeenCalled();
  });

  it('applyChombo forwards computed scores for payment to all n=1', async () => {
    mockedRepo.existsById.mockResolvedValue(true);
    mockedRepo.findGameIdByHandId.mockResolvedValue(100);
    mockedGameRepo.findRulesetByGameId.mockResolvedValue({
      chomboValue: 1000,
      chomboOption: 'Payment to all',
    } as never);
    mockedRepo.findPlayerIdsOnHand.mockResolvedValue([1, 2, 3, 4]);
    mockedRepo.applyChomboScores.mockResolvedValue({ handId: 5 });

    await expect(handService.applyChombo(5, [1])).resolves.toEqual({
      handId: 5,
    });

    const expected = computeChomboScoreByPlayer(
      [1, 2, 3, 4],
      [1],
      { chomboValue: 1000, chomboOption: 'Payment to all' },
    );
    expect(mockedRepo.applyChomboScores).toHaveBeenCalledWith(5, expected);
    expect(expected.get(1)).toBe(-3000);
    expect(expected.get(2)).toBe(1000);
  });

  it('applyChombo uses flat deduction for n=2 chombos', async () => {
    mockedRepo.existsById.mockResolvedValue(true);
    mockedRepo.findGameIdByHandId.mockResolvedValue(100);
    mockedGameRepo.findRulesetByGameId.mockResolvedValue({
      chomboValue: 500,
      chomboOption: 'Flat deduction',
    } as never);
    mockedRepo.findPlayerIdsOnHand.mockResolvedValue([10, 20, 30, 40]);
    mockedRepo.applyChomboScores.mockResolvedValue({ handId: 8 });

    await handService.applyChombo(8, [10, 20]);

    const expected = computeChomboScoreByPlayer(
      [10, 20, 30, 40],
      [10, 20],
      { chomboValue: 500, chomboOption: 'Flat deduction' },
    );
    expect(expected.get(10)).toBe(-500);
    expect(expected.get(30)).toBe(0);
    expect(mockedRepo.applyChomboScores).toHaveBeenCalledWith(8, expected);
  });

  it('applyScoreChanges no-ops on empty updates', async () => {
    mockedRepo.existsById.mockResolvedValue(true);

    await expect(
      handService.applyScoreChanges(1, [], null),
    ).resolves.toEqual({ handId: 1 });
    expect(mockedRepo.applyScoreChanges).not.toHaveBeenCalled();
  });

  it('applyScoreChanges forwards updates', async () => {
    mockedRepo.existsById.mockResolvedValue(true);
    mockedRepo.applyScoreChanges.mockResolvedValue({ handId: 9 });

    const updates = [
      { handPlayerResultId: 50, scoreChange: 52, winner: true },
      { handPlayerResultId: 51, scoreChange: -26, winner: false },
    ];
    await expect(
      handService.applyScoreChanges(9, updates, 52),
    ).resolves.toEqual({ handId: 9 });
    expect(mockedRepo.applyScoreChanges).toHaveBeenCalledWith(9, updates, 52);
    expect(mockedRepo.existsHandPlayerResultOnHand).not.toHaveBeenCalled();
  });

  it('applyScoreChanges rejects more than four updates', async () => {
    mockedRepo.existsById.mockResolvedValue(true);

    const updates = Array.from({ length: 5 }, (_, i) => ({
      handPlayerResultId: i + 1,
      scoreChange: 0,
      winner: false,
    }));
    await expect(
      handService.applyScoreChanges(9, updates, null),
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(mockedRepo.applyScoreChanges).not.toHaveBeenCalled();
  });

  it('applyScoreChanges surfaces missing hand player result from repository', async () => {
    mockedRepo.existsById.mockResolvedValue(true);
    mockedRepo.applyScoreChanges.mockRejectedValue(
      new NotFoundError('Hand player result not found', 'json'),
    );

    const updates = [
      { handPlayerResultId: 999, scoreChange: 10, winner: false },
    ];
    await expect(
      handService.applyScoreChanges(9, updates, null),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('createHandWin requires player seated on hand', async () => {
    mockedRepo.existsById.mockResolvedValue(true);
    mockedRepo.existsPlayerOnHand.mockResolvedValue(false);

    await expect(handService.createHandWin(1, 99)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(mockedRepo.insertHandWin).not.toHaveBeenCalled();
    expect(mockedPlayerRepo.findById).not.toHaveBeenCalled();
  });
});

describe('computeChomboScoreByPlayer', () => {
  const all = [1, 2, 3, 4];

  it('payment to all n=2 gives -2*val per chombo and n*val to others', () => {
    const map = computeChomboScoreByPlayer(all, [1, 2], {
      chomboValue: 100,
      chomboOption: 'Payment to all',
    });
    expect(map.get(1)).toBe(-200);
    expect(map.get(2)).toBe(-200);
    expect(map.get(3)).toBe(200);
    expect(map.get(4)).toBe(200);
  });
});
