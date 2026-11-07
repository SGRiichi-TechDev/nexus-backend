import type { VenueIdDto, VenueNameDto } from '#db/types.js';
import { BadRequestError, NotFoundError } from '#errors/app-error.js';
import { createLogger } from '#logger/logger.js';
import { venueRepository } from '#repositories/venue.repository.js';

const logger = createLogger('venue.service');

export const venueService = {
  listActive: async (): Promise<VenueNameDto[]> => {
    const venues = await venueRepository.findAllActive();
    logger.debug({ count: venues.length }, 'Listed active venues');
    return venues;
  },

  lookupByName: async (name: string): Promise<VenueIdDto> => {
    if (!name?.trim()) {
      throw new BadRequestError('Venue name is required', 'json');
    }
    const venue = await venueRepository.findVenueIdByName(name.trim());
    if (!venue) {
      throw new NotFoundError('Venue not found', 'json');
    }
    logger.debug({ name, venueId: venue.venueId }, 'Resolved venue lookup');
    return venue;
  },
};
