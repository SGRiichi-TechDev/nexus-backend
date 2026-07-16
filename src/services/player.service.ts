import type { CurrentGameDto, PlayerInfo } from '#db/types.js';
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

  getById: async (id: number): Promise<PlayerInfo> => {
    const player = await playerRepository.findById(id);
    if (player === undefined) {
      throw new NotFoundError('Player not found', 'text');
    }
    logger.debug({ playerId: id }, 'Resolved player by id');
    return player;
  },

  getCurrentGame: async (telegramId: number): Promise<CurrentGameDto> => {
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

    logger.debug(
      {
        playerId: player.playerId,
        telegramId,
        gameId: currentGame.gameId,
      },
      'Resolved current game',
    );
    return currentGame;
  },
};
