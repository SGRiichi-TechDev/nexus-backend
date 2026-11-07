import handController from '#controller/hand-controller.js';
import { handService } from '#services/hand.service.js';
import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#services/hand.service.js', () => ({
  handService: {
    createNextHand: vi.fn(),
    getHandDetails: vi.fn(),
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
