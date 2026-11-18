import type { SessionGameDto } from '#db/types.js';
import { sessionRepository } from '#repositories/session.repository.js';

export const sessionService = {
  /** Session for a game, or null once the game is completed or deleted. */
  getByGameId: (gameId: number): Promise<SessionGameDto | null> =>
    sessionRepository.findByGameId(gameId),

  /** Session for the game owning a hand, or null once completed or deleted. */
  getByHandId: (handId: number): Promise<SessionGameDto | null> =>
    sessionRepository.findByHandId(handId),
};
