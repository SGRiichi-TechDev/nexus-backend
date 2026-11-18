import type {
  ActiveParticipationDto,
  PlayerInfo,
  SessionGameDto,
} from '#db/types.js';
import { BadRequestError, NotFoundError } from '#errors/app-error.js';
import { createLogger } from '#logger/logger.js';
import { playerRepository } from '#repositories/player.repository.js';
import { sessionRepository } from '#repositories/session.repository.js';

const logger = createLogger('player.service');

export const playerService = {
  create: async (displayName: string): Promise<PlayerInfo> => {
    const trimmed = displayName?.trim() ?? '';
    if (!trimmed) {
      throw new BadRequestError('Display name is required', 'json');
    }
    const player = await playerRepository.insert({ displayName: trimmed });
    logger.debug({ playerId: player.playerId }, 'Created player');
    return player;
  },

  list: async (): Promise<PlayerInfo[]> => {
    const players = await playerRepository.findAll();
    logger.debug({ count: players.length }, 'Listed players');
    return players;
  },

  getById: async (id: number, registeredOnly = false): Promise<PlayerInfo> => {
    const player = registeredOnly
      ? await playerRepository.findByIdRegistered(id)
      : await playerRepository.findById(id);
    if (player === undefined) {
      throw new NotFoundError('Player not found', 'text');
    }
    logger.debug({ playerId: id, registeredOnly }, 'Resolved player by id');
    return player;
  },

  getByTelegramId: async (telegramId: number): Promise<PlayerInfo> => {
    if (!telegramId) {
      throw new BadRequestError('Telegram ID is required', 'text');
    }
    const player = await playerRepository.findByTelegramId(telegramId);
    if (player === undefined) {
      throw new NotFoundError('Player not found', 'text');
    }
    logger.debug({ telegramId }, 'Resolved player by telegram id');
    return player;
  },

  searchByName: async (name: string): Promise<PlayerInfo> => {
    if (!name?.trim()) {
      throw new BadRequestError('Name is required', 'text');
    }
    const player = await playerRepository.findByName(name.trim());
    if (player === undefined) {
      throw new NotFoundError('Player not found', 'text');
    }
    logger.debug({ name }, 'Resolved player by name');
    return player;
  },

  getCurrentGame: async (
    telegramId: number,
  ): Promise<SessionGameDto | null> => {
    if (!telegramId) {
      throw new BadRequestError('Telegram ID is required', 'text');
    }

    const lookup = await sessionRepository.findByTelegramId(telegramId);
    if (!lookup.found) {
      throw new NotFoundError('Player not found', 'text');
    }
    if (lookup.session === null) {
      logger.debug({ telegramId }, 'No current game for player');
      return null;
    }

    logger.debug(
      { telegramId, gameId: lookup.session.gameId },
      'Resolved current game',
    );
    return lookup.session;
  },

  getActiveParticipation: async (
    telegramId: number,
  ): Promise<ActiveParticipationDto> => {
    if (!telegramId) {
      throw new BadRequestError('Telegram ID is required', 'text');
    }

    const player = await playerRepository.findByTelegramId(telegramId);
    if (player === undefined) {
      throw new NotFoundError('Player not found', 'text');
    }

    const participation = await playerRepository.findActiveParticipation(
      player.playerId,
    );

    logger.debug(
      { telegramId, playerId: player.playerId, participation },
      'Resolved active participation',
    );

    return participation;
  },
};
