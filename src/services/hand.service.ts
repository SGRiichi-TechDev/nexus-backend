import type { PlayerInfo } from '#db/types.js';
import { createLogger } from '#logger/logger.js';
import { handRepository } from '#repositories/hand.repository.js';

const logger = createLogger('hand.service');

export const handService = {
  getPlayersInRiichi: async (handId: number): Promise<PlayerInfo[]> => {
    const players = await handRepository.findPlayersByFlag(handId, 'riichi');
    logger.debug(
      { handId, flag: 'riichi', count: players.length },
      'Resolved players in riichi',
    );
    return players;
  },

  getPlayersInTenpai: async (handId: number): Promise<PlayerInfo[]> => {
    const players = await handRepository.findPlayersByFlag(handId, 'tenpai');
    logger.debug(
      { handId, flag: 'tenpai', count: players.length },
      'Resolved players in tenpai',
    );
    return players;
  },

  getPlayersThatChombo: async (handId: number): Promise<PlayerInfo[]> => {
    const players = await handRepository.findPlayersByFlag(handId, 'chombo');
    logger.debug(
      { handId, flag: 'chombo', count: players.length },
      'Resolved players that chombo',
    );
    return players;
  },
};
