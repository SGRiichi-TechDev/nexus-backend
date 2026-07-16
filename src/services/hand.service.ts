import type { PlayerInfo } from '#db/types.js';
import { handRepository } from '#repositories/hand.repository.js';

export const handService = {
  getPlayersInRiichi: (handId: number): Promise<PlayerInfo[]> =>
    handRepository.findPlayersByFlag(handId, 'riichi'),

  getPlayersInTenpai: (handId: number): Promise<PlayerInfo[]> =>
    handRepository.findPlayersByFlag(handId, 'tenpai'),

  getPlayersThatChombo: (handId: number): Promise<PlayerInfo[]> =>
    handRepository.findPlayersByFlag(handId, 'chombo'),
};
