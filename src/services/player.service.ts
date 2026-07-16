import type { CurrentGameDto, PlayerInfo } from '#db/types.js';
import { BadRequestError, NotFoundError } from '#errors/app-error.js';
import { gameRepository } from '#repositories/game.repository.js';
import { playerRepository } from '#repositories/player.repository.js';

export const playerService = {
  list: async (): Promise<PlayerInfo[]> => {
    const players = await playerRepository.findAll();
    if (players.length === 0) {
      throw new NotFoundError('No players found', 'text');
    }
    return players;
  },

  getById: async (id: number): Promise<PlayerInfo> => {
    const player = await playerRepository.findById(id);
    if (player === undefined) {
      throw new NotFoundError('Player not found', 'text');
    }
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

    return currentGame;
  },
};
