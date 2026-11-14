import referenceController from '#controller/reference-controller.js';
import { NotFoundError } from '#errors/app-error.js';
import { referenceService } from '#services/reference.service.js';
import { type Request, type Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#services/reference.service.js', () => ({
  referenceService: {
    getScoreLookup: vi.fn(),
    getLocalText: vi.fn(),
  },
}));

const mockedService = vi.mocked(referenceService);

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

describe('getLocalText', () => {
  it('calls service with param key and returns dto via res.json', async () => {
    const dto = { key: 'help', value: 'Help copy' };
    mockedService.getLocalText.mockResolvedValue(dto);

    const req = { params: { key: 'help' } } as unknown as Request;
    const res = mockResponse();

    await referenceController.getLocalText(req, res);

    expect(mockedService.getLocalText).toHaveBeenCalledWith('help');
    expect(res.json).toHaveBeenCalledWith(dto);
  });

  it('propagates service rejection', async () => {
    const error = new NotFoundError('Local text not found', 'json');
    mockedService.getLocalText.mockRejectedValue(error);

    const req = { params: { key: 'help' } } as unknown as Request;
    const res = mockResponse();

    await expect(
      referenceController.getLocalText(req, res),
    ).rejects.toBe(error);
  });
});