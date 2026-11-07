import { referenceService } from '#services/reference.service.js';
import { scoreLookupRepository } from '#repositories/score-lookup.repository.js';
import { venueService } from '#services/venue.service.js';
import { venueRepository } from '#repositories/venue.repository.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#repositories/score-lookup.repository.js', () => ({
  scoreLookupRepository: {
    findAll: vi.fn(),
  },
}));

vi.mock('#repositories/venue.repository.js', () => ({
  venueRepository: {
    findAllActive: vi.fn(),
    findVenueIdByName: vi.fn(),
  },
}));

const mockedScoreLookupRepo = vi.mocked(scoreLookupRepository);
const mockedVenueRepo = vi.mocked(venueRepository);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('referenceService.getScoreLookup', () => {
  it('returns all score lookup rows', async () => {
    const rows = [{ id: 1, value: 1000 } as never];
    mockedScoreLookupRepo.findAll.mockResolvedValue(rows);

    await expect(referenceService.getScoreLookup()).resolves.toEqual(rows);
  });
});

describe('venueService', () => {
  it('listActive returns venues', async () => {
    mockedVenueRepo.findAllActive.mockResolvedValue([{ name: 'I-Sports' }]);

    await expect(venueService.listActive()).resolves.toEqual([
      { name: 'I-Sports' },
    ]);
  });
});
