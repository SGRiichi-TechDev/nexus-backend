import gameController from '#controller/game-controller.js';
import { NotFoundError } from '#errors/app-error.js';
import { gameService } from '#services/game.service.js';
import type { playerStatusEnum } from '#drizzle/schema.js';
import { type Request, type Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

export type Status = (typeof playerStatusEnum.enumValues)[number];

vi.mock('#services/game.service.js', () => ({
  gameService: {
    createDraftGame: vi.fn(),
    addGamePlayer: vi.fn(),
    createFirstHand: vi.fn(),
    updateGame: vi.fn(),
    updateRuleset: vi.fn(),
    applyNamedRuleset: vi.fn(),
    setPlayerPenalty: vi.fn(),
    setSeatFinalScore: vi.fn(),
    recomputeFinalPositions: vi.fn(),
    completeGame: vi.fn(),
    deleteLatestHand: vi.fn(),
    clearSeats: vi.fn(),
    getPlayers: vi.fn(),
    getRuleset: vi.fn(),
    getFinalScore: vi.fn(),
    getLastCompletedHand: vi.fn(),
    getLastHandForNext: vi.fn(),
    getVenueMode: vi.fn(),
  },
}));

const mockedService = vi.mocked(gameService);

const mockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.sendStatus = vi.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createGame', () => {
  it('returns 201 with gameId', async () => {
    mockedService.createDraftGame.mockResolvedValue({ gameId: 10 });

    const req = { body: { telegramId: 99 } } as unknown as Request;
    const res = mockResponse();

    await gameController.createGame(req, res);

    expect(mockedService.createDraftGame).toHaveBeenCalledWith(99);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ gameId: 10 });
  });
});

describe('createFirstHand', () => {
  it('returns 201 with handId', async () => {
    mockedService.createFirstHand.mockResolvedValue({ handId: 55 });

    const req = { params: { id: '7' }, body: {} } as unknown as Request;
    const res = mockResponse();

    await gameController.createFirstHand(req, res);

    expect(mockedService.createFirstHand).toHaveBeenCalledWith(7);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ handId: 55 });
  });
});

describe('addGamePlayer', () => {
  it('returns 201 with seat response', async () => {
    mockedService.addGamePlayer.mockResolvedValue({
      gameId: 7,
      startingSeat: 2,
      playerId: 3,
    });

    const req = {
      params: { id: '7' },
      body: { startingSeat: 2, playerId: 3 },
    } as unknown as Request;
    const res = mockResponse();

    await gameController.addGamePlayer(req, res);

    expect(mockedService.addGamePlayer).toHaveBeenCalledWith(7, 2, 3);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      gameId: 7,
      startingSeat: 2,
      playerId: 3,
    });
  });
});

describe('updateGame', () => {
  it('returns 200 with gameId', async () => {
    mockedService.updateGame.mockResolvedValue({ gameId: 1 });

    const req = {
      params: { id: '1' },
      body: { venueId: 2, isRecorded: true },
    } as unknown as Request;
    const res = mockResponse();

    await gameController.updateGame(req, res);

    expect(mockedService.updateGame).toHaveBeenCalledWith(1, {
      venueId: 2,
      isRecorded: true,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ gameId: 1 });
  });

  it('coerces finalScoreOnly to boolean', async () => {
    mockedService.updateGame.mockResolvedValue({ gameId: 1 });

    const req = {
      params: { id: '1' },
      body: { finalScoreOnly: 1 },
    } as unknown as Request;
    const res = mockResponse();

    await gameController.updateGame(req, res);

    expect(mockedService.updateGame).toHaveBeenCalledWith(1, {
      finalScoreOnly: true,
    });
  });
});

describe('updateRuleset', () => {
  it('returns 200 with gameId', async () => {
    mockedService.updateRuleset.mockResolvedValue({ gameId: 1 });

    const req = {
      params: { id: '1' },
      body: { initialValue: 300 },
    } as unknown as Request;
    const res = mockResponse();

    await gameController.updateRuleset(req, res);

    expect(mockedService.updateRuleset).toHaveBeenCalledWith(1, {
      initialValue: 300,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ gameId: 1 });
  });
});

describe('applyRuleset', () => {
  it('returns 200 with gameId', async () => {
    mockedService.applyNamedRuleset.mockResolvedValue({ gameId: 1 });

    const req = {
      params: { id: '1' },
      body: { name: 'IT Ruleset' },
    } as unknown as Request;
    const res = mockResponse();

    await gameController.applyRuleset(req, res);

    expect(mockedService.applyNamedRuleset).toHaveBeenCalledWith(
      1,
      'IT Ruleset',
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ gameId: 1 });
  });
});

describe('setPlayerPenalty', () => {
  it('returns 200 with gameId and playerId', async () => {
    mockedService.setPlayerPenalty.mockResolvedValue({ gameId: 1, playerId: 3 });

    const req = {
      params: { id: '1', playerId: '3' },
      body: { penalty: 40 },
    } as unknown as Request;
    const res = mockResponse();

    await gameController.setPlayerPenalty(req, res);

    expect(mockedService.setPlayerPenalty).toHaveBeenCalledWith(1, 3, 40);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ gameId: 1, playerId: 3 });
  });
});

describe('setSeatFinalScore', () => {
  it('returns 200 with gameId and startingSeat', async () => {
    mockedService.setSeatFinalScore.mockResolvedValue({
      gameId: 1,
      startingSeat: 2,
    });

    const req = {
      params: { id: '1', seat: '2' },
      body: { score: 280 },
    } as unknown as Request;
    const res = mockResponse();

    await gameController.setSeatFinalScore(req, res);

    expect(mockedService.setSeatFinalScore).toHaveBeenCalledWith(1, 2, 280);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ gameId: 1, startingSeat: 2 });
  });
});

describe('recomputeFinalPositions', () => {
  it('returns 200 with gameId', async () => {
    mockedService.recomputeFinalPositions.mockResolvedValue({ gameId: 1 });

    const req = { params: { id: '1' }, body: {} } as unknown as Request;
    const res = mockResponse();

    await gameController.recomputeFinalPositions(req, res);

    expect(mockedService.recomputeFinalPositions).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ gameId: 1 });
  });
});

describe('completeGame', () => {
  it('returns 200 with gameId', async () => {
    mockedService.completeGame.mockResolvedValue({ gameId: 1 });

    const req = { params: { id: '1' }, body: {} } as unknown as Request;
    const res = mockResponse();

    await gameController.completeGame(req, res);

    expect(mockedService.completeGame).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ gameId: 1 });
  });
});

describe('deleteLatestHand', () => {
  it('returns 200 with delete payload', async () => {
    mockedService.deleteLatestHand.mockResolvedValue({
      gameId: 7,
      handId: 12,
      deleted: true,
    });

    const req = { params: { id: '7' } } as unknown as Request;
    const res = mockResponse();

    await gameController.deleteLatestHand(req, res);

    expect(mockedService.deleteLatestHand).toHaveBeenCalledWith(7);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      gameId: 7,
      handId: 12,
      deleted: true,
    });
  });

  it('propagates service rejection', async () => {
    mockedService.deleteLatestHand.mockRejectedValue(
      new NotFoundError('Game not found', 'json'),
    );

    const req = { params: { id: '7' } } as unknown as Request;
    const res = mockResponse();

    await expect(
      gameController.deleteLatestHand(req, res),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('clearSeats', () => {
  it('returns 200 with clear payload', async () => {
    mockedService.clearSeats.mockResolvedValue({ gameId: 7, deleted: 4 });

    const req = { params: { id: '7' } } as unknown as Request;
    const res = mockResponse();

    await gameController.clearSeats(req, res);

    expect(mockedService.clearSeats).toHaveBeenCalledWith(7);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ gameId: 7, deleted: 4 });
  });
});

describe('getPlayersByGameId', () => {
  it('returns players on success', async () => {
    const fakePlayers = [
      {
        telegramId: 1,
        playerId: 1,
        displayName: 'Alice',
        status: 'active' as Status,
        ctryCd: '',
        ctyCd: '',
        statusReason: null,
      },
      {
        telegramId: 2,
        playerId: 2,
        displayName: 'Bob',
        status: 'active' as Status,
        ctryCd: '',
        ctyCd: '',
        statusReason: null,
      },
      {
        telegramId: 3,
        playerId: 3,
        displayName: 'Charlie',
        status: 'active' as Status,
        ctryCd: '',
        ctyCd: '',
        statusReason: null,
      },
      {
        telegramId: 4,
        playerId: 4,
        displayName: 'David',
        status: 'active' as Status,
        ctryCd: '',
        ctyCd: '',
        statusReason: null,
      },
    ];

    mockedService.getPlayers.mockResolvedValue(fakePlayers);

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await gameController.getPlayersByGameId(req, res);

    expect(mockedService.getPlayers).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fakePlayers);
  });

  it('returns empty array when no players found', async () => {
    mockedService.getPlayers.mockResolvedValue([]);

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await gameController.getPlayersByGameId(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('propagates NotFoundError when game not found', async () => {
    mockedService.getPlayers.mockRejectedValue(
      new NotFoundError('Game not found', 'json'),
    );

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await expect(
      gameController.getPlayersByGameId(req, res),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('propagates unexpected errors', async () => {
    mockedService.getPlayers.mockRejectedValue(new Error('Database error'));

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await expect(
      gameController.getPlayersByGameId(req, res),
    ).rejects.toThrow('Database error');
  });
});

describe('getRulesetInfoByGameId', () => {
  it('returns ruleset on success', async () => {
    const fakeRuleset = {
      initialValue: 25000,
      aka: 'Aka-Ari' as const,
      umaP1: 15,
      umaP2: 5,
      umaP3: -5,
      umaP4: -15,
      oka: 0,
      chomboValue: 20,
      chomboOption: 'Payment to all' as const,
      kiriageMangan: false,
      multipleRon: false,
    };

    mockedService.getRuleset.mockResolvedValue(fakeRuleset);

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await gameController.getRulesetInfoByGameId(req, res);

    expect(mockedService.getRuleset).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith(fakeRuleset);
  });

  it('returns 204 when ruleset is missing', async () => {
    mockedService.getRuleset.mockResolvedValue(null);

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await gameController.getRulesetInfoByGameId(req, res);

    expect(res.sendStatus).toHaveBeenCalledWith(204);
    expect(res.json).not.toHaveBeenCalled();
  });

  it('propagates NotFoundError when game not found', async () => {
    mockedService.getRuleset.mockRejectedValue(
      new NotFoundError('Game not found', 'json'),
    );

    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await expect(
      gameController.getRulesetInfoByGameId(req, res),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('optional singular game resources', () => {
  it('returns 204 for missing final score', async () => {
    mockedService.getFinalScore.mockResolvedValue(null);
    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await gameController.getFinalScore(req, res);

    expect(res.sendStatus).toHaveBeenCalledWith(204);
  });

  it('returns 204 for missing last completed hand', async () => {
    mockedService.getLastCompletedHand.mockResolvedValue(null);
    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await gameController.getLastCompletedHand(req, res);

    expect(res.sendStatus).toHaveBeenCalledWith(204);
  });

  it('returns 204 for missing last hand for next', async () => {
    mockedService.getLastHandForNext.mockResolvedValue(null);
    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await gameController.getLastHandForNext(req, res);

    expect(res.sendStatus).toHaveBeenCalledWith(204);
  });

  it('returns 204 for missing venue mode', async () => {
    mockedService.getVenueMode.mockResolvedValue(null);
    const req = { params: { id: '1' } } as unknown as Request;
    const res = mockResponse();

    await gameController.getVenueMode(req, res);

    expect(res.sendStatus).toHaveBeenCalledWith(204);
  });
});
