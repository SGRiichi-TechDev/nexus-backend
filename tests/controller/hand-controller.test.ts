import handController from '#controller/hand-controller.js';
import { handService } from '#services/hand.service.js';
import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#services/hand.service.js', () => ({
  handService: {
    createNextHand: vi.fn(),
    getHandDetails: vi.fn(),
    replaceRiichi: vi.fn(),
    applyRiichi: vi.fn(),
    resetRiichi: vi.fn(),
    setHandOutcome: vi.fn(),
    setPlayerOutcome: vi.fn(),
    setDealIn: vi.fn(),
    setHan: vi.fn(),
    setFu: vi.fn(),
    replaceTenpai: vi.fn(),
    setDrawPayments: vi.fn(),
    replaceChombo: vi.fn(),
    applyChombo: vi.fn(),
    applyScoreChanges: vi.fn(),
    confirmHand: vi.fn(),
    createHandWin: vi.fn(),
  },
}));

const mockedService = vi.mocked(handService);

const mockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createNextHand', () => {
  it('returns 201 with handId', async () => {
    mockedService.createNextHand.mockResolvedValue({ handId: 88 });

    const req = {
      params: { id: '12' },
      body: { wind: 'E', roundNum: 1, honba: 1 },
    } as unknown as Request;
    const res = mockResponse();

    await handController.createNextHand(req, res);

    expect(mockedService.createNextHand).toHaveBeenCalledWith(12, {
      wind: 'E',
      roundNum: 1,
      honba: 1,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ handId: 88 });
  });
});

describe('handController mid-game mutations', () => {
  it('replaceRiichi returns 200 with handId', async () => {
    mockedService.replaceRiichi.mockResolvedValue({ handId: 4 });

    const req = {
      params: { id: '4' },
      body: { playerIds: [1, 2] },
    } as unknown as Request;
    const res = mockResponse();

    await handController.replaceRiichi(req, res);

    expect(mockedService.replaceRiichi).toHaveBeenCalledWith(4, [1, 2]);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ handId: 4 });
  });

  it('applyRiichi returns 200 with handId', async () => {
    mockedService.applyRiichi.mockResolvedValue({ handId: 5 });

    const req = {
      params: { id: '5' },
      body: { playerIds: [3] },
    } as unknown as Request;
    const res = mockResponse();

    await handController.applyRiichi(req, res);

    expect(mockedService.applyRiichi).toHaveBeenCalledWith(5, [3]);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ handId: 5 });
  });

  it('resetRiichi returns 200 with handId', async () => {
    mockedService.resetRiichi.mockResolvedValue({ handId: 6 });

    const req = { params: { id: '6' }, body: {} } as unknown as Request;
    const res = mockResponse();

    await handController.resetRiichi(req, res);

    expect(mockedService.resetRiichi).toHaveBeenCalledWith(6);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ handId: 6 });
  });

  it('setHandOutcome returns 200 with handId', async () => {
    mockedService.setHandOutcome.mockResolvedValue({ handId: 7 });

    const req = {
      params: { id: '7' },
      body: { outcome: 'Ron' },
    } as unknown as Request;
    const res = mockResponse();

    await handController.setHandOutcome(req, res);

    expect(mockedService.setHandOutcome).toHaveBeenCalledWith(7, 'Ron');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ handId: 7 });
  });

  it('setPlayerOutcome returns 200 with handId and playerId', async () => {
    mockedService.setPlayerOutcome.mockResolvedValue({
      handId: 8,
      playerId: 11,
    });

    const req = {
      params: { id: '8', playerId: '11' },
      body: { outcome: 'Tsumo' },
    } as unknown as Request;
    const res = mockResponse();

    await handController.setPlayerOutcome(req, res);

    expect(mockedService.setPlayerOutcome).toHaveBeenCalledWith(
      8,
      11,
      'Tsumo',
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ handId: 8, playerId: 11 });
  });

  it('setDealIn returns 200 with handId and playerId', async () => {
    mockedService.setDealIn.mockResolvedValue({ handId: 9, playerId: 22 });

    const req = {
      params: { id: '9', playerId: '22' },
      body: {},
    } as unknown as Request;
    const res = mockResponse();

    await handController.setDealIn(req, res);

    expect(mockedService.setDealIn).toHaveBeenCalledWith(9, 22);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ handId: 9, playerId: 22 });
  });

  it('setHan returns 200 with handId', async () => {
    mockedService.setHan.mockResolvedValue({ handId: 10 });

    const req = {
      params: { id: '10' },
      body: { han: 3 },
    } as unknown as Request;
    const res = mockResponse();

    await handController.setHan(req, res);

    expect(mockedService.setHan).toHaveBeenCalledWith(10, 3);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ handId: 10 });
  });

  it('setFu returns 200 with handId', async () => {
    mockedService.setFu.mockResolvedValue({ handId: 12 });

    const req = {
      params: { id: '12' },
      body: { fu: 30 },
    } as unknown as Request;
    const res = mockResponse();

    await handController.setFu(req, res);

    expect(mockedService.setFu).toHaveBeenCalledWith(12, 30);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ handId: 12 });
  });

  it('replaceTenpai returns 200', async () => {
    mockedService.replaceTenpai.mockResolvedValue({ handId: 13 });

    const req = {
      params: { id: '13' },
      body: { playerIds: [1] },
    } as unknown as Request;
    const res = mockResponse();

    await handController.replaceTenpai(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ handId: 13 });
  });

  it('setDrawPayments returns 200', async () => {
    mockedService.setDrawPayments.mockResolvedValue({ handId: 14 });

    const req = {
      params: { id: '14' },
      body: { payments: [] },
    } as unknown as Request;
    const res = mockResponse();

    await handController.setDrawPayments(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('applyChombo returns 200', async () => {
    mockedService.applyChombo.mockResolvedValue({ handId: 15 });

    const req = {
      params: { id: '15' },
      body: { playerIds: [2] },
    } as unknown as Request;
    const res = mockResponse();

    await handController.applyChombo(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('applyScoreChanges returns 200', async () => {
    mockedService.applyScoreChanges.mockResolvedValue({ handId: 16 });

    const req = {
      params: { id: '16' },
      body: { updates: [], winnerHandValue: null },
    } as unknown as Request;
    const res = mockResponse();

    await handController.applyScoreChanges(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('confirmHand returns 200', async () => {
    mockedService.confirmHand.mockResolvedValue({ handId: 17 });

    const req = { params: { id: '17' }, body: {} } as unknown as Request;
    const res = mockResponse();

    await handController.confirmHand(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('createHandWin returns 201', async () => {
    mockedService.createHandWin.mockResolvedValue({
      handId: 18,
      winnerPlayerId: 3,
    });

    const req = {
      params: { id: '18' },
      body: { winnerPlayerId: 3 },
    } as unknown as Request;
    const res = mockResponse();

    await handController.createHandWin(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ handId: 18, winnerPlayerId: 3 });
  });
});
