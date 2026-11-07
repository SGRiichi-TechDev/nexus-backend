import type {
  ActiveParticipationDto,
  PlayerInfo,
  SessionGameDto,
} from '#db/types.js';
import { BadRequestError, NotFoundError } from '#errors/app-error.js';
import { createLogger } from '#logger/logger.js';
import { gameRepository } from '#repositories/game.repository.js';
import { playerRepository } from '#repositories/player.repository.js';

const logger = createLogger('player.service');

export const playerService = {
  list: async (): Promise<PlayerInfo[]> => {
    const players = await playerRepository.findAll();
    if (players.length === 0) {
      throw new NotFoundError('No players found', 'text');
    }
    logger.debug({ count: players.length }, 'Listed players');
    return players;
  },

  getById: async (
    id: number,
    registeredOnly = false,
  ): Promise<PlayerInfo> => {
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

  getCurrentGame: async (telegramId: number): Promise<SessionGameDto> => {
    if (!telegramId) {
      throw new BadRequestError('Telegram ID is required', 'text');
    }

    const player = await playerRepository.findByTelegramId(telegramId);
    if (player === undefined) {
      throw new NotFoundError('Player not found', 'text');
    }

    const currentGame = await gameRepository.findCurrentIncompleteByRecorder(
      player.playerId,
    );
    if (currentGame === undefined) {
      throw new NotFoundError(
        'No current game found for this player',
        'text',
      );
    }

    const players = await gameRepository.findPlayersOrderedBySeat(
      currentGame.gameId,
    );

    // TODO(multiple-ron): Temporarily disabled for Akako. Restore detection from
    // hand state once multiple-ron branch semantics are defined for hand_win.
    const isRecordingMultipleRon = false;

    logger.debug(
      {
        playerId: player.playerId,
        telegramId,
        gameId: currentGame.gameId,
      },
      'Resolved current game',
    );

    return {
      ...currentGame,
      // TODO(multiple-ron): Also force multipleRon false for Akako until re-enabled
      multipleRon: false,
      isRecordingMultipleRon,
      players,
    };
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

    const participation =
      await playerRepository.findActiveParticipation(telegramId);

    logger.debug({ telegramId, participation }, 'Resolved active participation');

    return {
      gameId: participation?.gameId ?? null,
      handId: participation?.handId ?? null,
    };
  },
};
