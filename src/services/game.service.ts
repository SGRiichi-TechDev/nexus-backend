import type { PlayerInfo, RulesetInfoSelect } from '#db/types.js';
import { NotFoundError } from '#errors/app-error.js';
import { createLogger } from '#logger/logger.js';
import { gameRepository } from '#repositories/game.repository.js';

const logger = createLogger('game.service');

export const gameService = {
  getPlayers: async (gameId: number): Promise<PlayerInfo[]> => {
    const game = await gameRepository.findFirstResultByGameId(gameId);
    if (!game) {
      throw new NotFoundError('Game not found', 'json');
    }
    const players = await gameRepository.findPlayersOrderedBySeat(gameId);
    logger.debug(
      { gameId, count: players.length },
      'Resolved players for game',
    );
    return players;
  },

  getRuleset: async (gameId: number): Promise<RulesetInfoSelect> => {
    const ruleset = await gameRepository.findRulesetByGameId(gameId);
    if (!ruleset) {
      throw new NotFoundError('Ruleset info not found', 'json');
    }
    logger.debug({ gameId }, 'Resolved ruleset for game');
    return ruleset;
  },
};
