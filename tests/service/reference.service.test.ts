import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestError, NotFoundError } from '#errors/app-error.js';
import { localTextRepository } from '#repositories/local-text.repository.js';
import { scoreLookupRepository } from '#repositories/score-lookup.repository.js';
import { venueRepository } from '#repositories/venue.repository.js';
import { referenceService } from '#services/reference.service.js';
import { venueService } from '#services/venue.service.js';

vi.mock('#repositories/local-text.repository.js', () => ({
  localTextRepository: {
    findByKey: vi.fn(),
  },
}));

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

const mockedLocalTextRepo = vi.mocked(localTextRepository);
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

describe('referenceService.getLocalText', () => {
  it('returns row when found and trims key', async () => {
    const row = { key: 'help', value: 'Help copy' };
    mockedLocalTextRepo.findByKey.mockResolvedValue(row);

    await expect(referenceService.getLocalText('  help ')).resolves.toEqual(
      row,
    );
    expect(mockedLocalTextRepo.findByKey).toHaveBeenCalledWith('help');
  });

  it('rejects NotFoundError when row is missing', async () => {
    mockedLocalTextRepo.findByKey.mockResolvedValue(undefined);

    await expect(
      referenceService.getLocalText('missing-key'),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      referenceService.getLocalText('missing-key'),
    ).rejects.toMatchObject({ message: 'Local text not found' });
  });

  it('rejects BadRequestError for blank key without calling repo', async () => {
    await expect(referenceService.getLocalText('')).rejects.toBeInstanceOf(
      BadRequestError,
    );
    await expect(referenceService.getLocalText('   ')).rejects.toBeInstanceOf(
      BadRequestError,
    );
    expect(mockedLocalTextRepo.findByKey).not.toHaveBeenCalled();
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
