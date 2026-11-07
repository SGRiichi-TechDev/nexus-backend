import type {
  CreateNextHandDto,
  HandDetailsDto,
  HandIdDto,
  HasOutcomeDto,
  MultipleRonStatusDto,
  PlayerInfo,
  ScoreCalcInputDto,
  Wind,
} from '#db/types.js';
import { windEnum } from '#drizzle/schema.js';
import { BadRequestError, NotFoundError } from '#errors/app-error.js';
import { createLogger } from '#logger/logger.js';
import { handRepository } from '#repositories/hand.repository.js';

const logger = createLogger('hand.service');

const VALID_WINDS = new Set<Wind>(windEnum.enumValues);

export const handService = {
  createNextHand: async (
    previousHandId: number,
    input: CreateNextHandDto,
  ): Promise<HandIdDto> => {
    const { wind, roundNum, honba } = input;
    if (!VALID_WINDS.has(wind)) {
      throw new BadRequestError('Invalid wind', 'json');
    }
    if (
      !Number.isFinite(roundNum) ||
      !Number.isInteger(roundNum) ||
      !Number.isFinite(honba) ||
      !Number.isInteger(honba)
    ) {
      throw new BadRequestError(
        'roundNum and honba must be finite integers',
        'json',
      );
    }
    const exists = await handRepository.existsById(previousHandId);
    if (!exists) {
      throw new NotFoundError('Hand not found', 'json');
    }
    const result = await handRepository.insertNextHand(
      previousHandId,
      wind,
      roundNum,
      honba,
    );
    logger.debug(
      { previousHandId, handId: result.handId, wind, roundNum, honba },
      'Created next hand',
    );
    return result;
  },

  getHandDetails: async (handId: number): Promise<HandDetailsDto> => {
    const details = await handRepository.findHandDetails(handId);
    if (!details) {
      throw new NotFoundError('Hand not found', 'json');
    }
    logger.debug({ handId }, 'Resolved hand details');
    return details;
  },

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

  hasPlayerOutcome: async (
    handId: number,
    playerId: number,
  ): Promise<HasOutcomeDto> => {
    const exists = await handRepository.existsById(handId);
    if (!exists) {
      throw new NotFoundError('Hand not found', 'json');
    }
    const hasOutcome = await handRepository.hasPlayerOutcome(
      handId,
      playerId,
    );
    logger.debug({ handId, playerId, hasOutcome }, 'Resolved has outcome');
    return { hasOutcome };
  },

  getScoreCalcInput: async (handId: number): Promise<ScoreCalcInputDto> => {
    const input = await handRepository.findScoreCalcInput(handId);
    if (!input) {
      throw new NotFoundError('Hand not found', 'json');
    }
    logger.debug({ handId }, 'Resolved score calc input');
    return input;
  },

  getMultipleRonStatus: async (
    handId: number,
  ): Promise<MultipleRonStatusDto[]> => {
    const exists = await handRepository.existsById(handId);
    if (!exists) {
      throw new NotFoundError('Hand not found', 'json');
    }
    const status = await handRepository.findMultipleRonStatus(handId);
    logger.debug(
      { handId, count: status.length },
      'Resolved multiple ron status',
    );
    return status;
  },
};
