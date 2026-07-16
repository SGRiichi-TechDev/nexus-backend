import type { PlayerInfo, RulesetInfoSelect } from '#db/types.js';
import { NotFoundError } from '#errors/app-error.js';
import { gameRepository } from '#repositories/game.repository.js';

export const gameService = {
  getPlayers: async (gameId: number): Promise<PlayerInfo[]> => {
    const game = await gameRepository.findFirstResultByGameId(gameId);
    if (!game) {
      throw new NotFoundError('Game not found', 'json');
    }
    return gameRepository.findPlayersOrderedBySeat(gameId);
  },

  getRuleset: async (gameId: number): Promise<RulesetInfoSelect> => {
    const ruleset = await gameRepository.findRulesetByGameId(gameId);
    if (!ruleset) {
      throw new NotFoundError('Ruleset info not found', 'json');
    }
    return ruleset;
  },
};
