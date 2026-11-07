import { db } from '#db/index.js';
import type { VenueIdDto, VenueNameDto } from '#db/types.js';
import { venue } from '#drizzle/schema.js';
import { createLogger } from '#logger/logger.js';
import { and, eq, ilike } from 'drizzle-orm';

const logger = createLogger('venue.repository');

export const venueRepository = {
  findAllActive: async (): Promise<VenueNameDto[]> => {
    const start = performance.now();
    const rows = await db
      .select({ name: venue.name })
      .from(venue)
      .where(eq(venue.status, true));
    logger.debug(
      {
        query: 'findAllActive',
        rowCount: rows.length,
        durationMs: Math.round(performance.now() - start),
      },
      'venue.findAllActive',
    );
    return rows;
  },

  findVenueIdByName: async (name: string): Promise<VenueIdDto | undefined> => {
    const start = performance.now();
    const result = await db
      .select({ venueId: venue.venueId })
      .from(venue)
      .where(and(ilike(venue.name, name), eq(venue.status, true)))
      .limit(1);
    logger.debug(
      {
        query: 'findVenueIdByName',
        name,
        rowCount: result.length,
        durationMs: Math.round(performance.now() - start),
      },
      'venue.findVenueIdByName',
    );
    return result[0];
  },
};
