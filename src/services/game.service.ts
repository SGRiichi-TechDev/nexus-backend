import type {
  AvailableRulesetsDto,
  CreateGameResponseDto,
  FinalScoreDto,
  HandCountDto,
  HandIdDto,
  LastHandForNextDto,
  ModeIdDto,
  ModeNameDto,
  PenaltyDto,
  PlayerInfo,
  RulesetInfoSelect,
  SeatPlayerResponseDto,
  UpdateGamePatch,
  UpdateGameResponseDto,
  VenueModeDto,
} from '#db/types.js';
import { BadRequestError, NotFoundError } from '#errors/app-error.js';
import { createLogger } from '#logger/logger.js';
import { gameRepository } from '#repositories/game.repository.js';
import { handRepository } from '#repositories/hand.repository.js';
import { modeRepository } from '#repositories/mode.repository.js';
import { playerRepository } from '#repositories/player.repository.js';
import { rulesetRepository } from '#repositories/ruleset.repository.js';

const logger = createLogger('game.service');

const assertGameExists = async (gameId: number): Promise<void> => {
  const exists = await gameRepository.existsById(gameId);
  if (!exists) {
    throw new NotFoundError('Game not found', 'json');
  }
};

export const gameService = {
  addGamePlayer: async (
    gameId: number,
    startingSeat: number,
    playerId: number,
  ): Promise<SeatPlayerResponseDto> => {
    if (
      !Number.isFinite(startingSeat) ||
      !Number.isInteger(startingSeat) ||
      startingSeat < 1 ||
      startingSeat > 4
    ) {
      throw new BadRequestError(
        'Starting seat must be an integer between 1 and 4',
        'json',
      );
    }
    await assertGameExists(gameId);
    const player = await playerRepository.findById(playerId);
    if (player === undefined) {
      throw new NotFoundError('Player not found', 'json');
    }
    const ruleset = await gameRepository.findRulesetByGameId(gameId);
    const finalScore = ruleset?.initialValue ?? 250;
    await gameRepository.insertGameResult({
      gameId,
      startingSeat,
      playerId,
      finalScore,
    });
    logger.debug(
      { gameId, startingSeat, playerId, finalScore },
      'Seated player on game',
    );
    return { gameId, startingSeat, playerId };
  },

  createFirstHand: async (gameId: number): Promise<HandIdDto> => {
    await assertGameExists(gameId);
    const seated = await gameRepository.findFirstResultByGameId(gameId);
    if (seated === undefined) {
      throw new BadRequestError('Game has no seated players', 'json');
    }
    const result = await handRepository.insertFirstHand(gameId);
    logger.debug({ gameId, handId: result.handId }, 'Created first hand');
    return result;
  },

  createDraftGame: async (
    telegramId: number,
  ): Promise<CreateGameResponseDto> => {
    if (!telegramId) {
      throw new BadRequestError('Telegram ID is required', 'json');
    }
    const player = await playerRepository.findByTelegramId(telegramId);
    if (player === undefined) {
      throw new NotFoundError('Player not found', 'json');
    }
    const gameId = await gameRepository.allocateNextGameId();
    const result = await gameRepository.insertDraftGame({
      gameId,
      recordedByPid: player.playerId,
    });
    logger.debug({ gameId, telegramId }, 'Created draft game');
    return result;
  },

  updateGame: async (
    gameId: number,
    patch: UpdateGamePatch,
  ): Promise<UpdateGameResponseDto> => {
    const hasField =
      patch.venueId !== undefined ||
      patch.modeId !== undefined ||
      patch.isRecorded !== undefined ||
      patch.deleted !== undefined;
    if (!hasField) {
      throw new BadRequestError('At least one field is required', 'json');
    }
    await assertGameExists(gameId);
    await gameRepository.updateGameFields(gameId, patch);
    logger.debug({ gameId, patch }, 'Updated game');
    return { gameId };
  },

  getPlayers: async (gameId: number): Promise<PlayerInfo[]> => {
    await assertGameExists(gameId);
    const players = await gameRepository.findPlayersOrderedBySeat(gameId);
    logger.debug(
      { gameId, count: players.length },
      'Resolved players for game',
    );
    return players;
  },

  getRuleset: async (gameId: number): Promise<RulesetInfoSelect | null> => {
    await assertGameExists(gameId);
    const ruleset = await gameRepository.findRulesetByGameId(gameId);
    if (!ruleset) {
      logger.debug({ gameId }, 'No ruleset for game');
      return null;
    }
    logger.debug({ gameId }, 'Resolved ruleset for game');
    return ruleset;
  },

  getFinalScore: async (gameId: number): Promise<FinalScoreDto | null> => {
    await assertGameExists(gameId);
    const finalScore = await gameRepository.findFinalScoreByGameId(gameId);
    if (!finalScore) {
      logger.debug({ gameId }, 'No final score for game');
      return null;
    }
    logger.debug({ gameId }, 'Resolved final score');
    return finalScore;
  },

  getPenalties: async (gameId: number): Promise<PenaltyDto[]> => {
    await assertGameExists(gameId);
    const penalties = await gameRepository.findPenaltiesByGameId(gameId);
    logger.debug({ gameId, count: penalties.length }, 'Resolved penalties');
    return penalties;
  },

  getHandCount: async (gameId: number): Promise<HandCountDto> => {
    await assertGameExists(gameId);
    const count = await gameRepository.countCompletedHands(gameId);
    logger.debug({ gameId, count }, 'Resolved hand count');
    return { count };
  },

  getLastCompletedHand: async (gameId: number): Promise<HandIdDto | null> => {
    await assertGameExists(gameId);
    const hand = await gameRepository.findLastCompletedHandId(gameId);
    if (!hand) {
      logger.debug({ gameId }, 'No completed hand for game');
      return null;
    }
    logger.debug({ gameId, handId: hand.handId }, 'Resolved last completed hand');
    return hand;
  },

  getLastHandForNext: async (
    gameId: number,
  ): Promise<LastHandForNextDto | null> => {
    await assertGameExists(gameId);
    const hand = await gameRepository.findLastHandForNextInsert(gameId);
    logger.debug({ gameId, found: !!hand }, 'Resolved last hand for next');
    return hand ?? null;
  },

  getPlayerTelegramIds: async (gameId: number): Promise<number[]> => {
    await assertGameExists(gameId);
    const ids = await gameRepository.findTelegramIdsByGameId(gameId);
    logger.debug({ gameId, count: ids.length }, 'Resolved player telegram ids');
    return ids;
  },

  getVenueMode: async (gameId: number): Promise<VenueModeDto | null> => {
    await assertGameExists(gameId);
    const venueMode = await gameRepository.findVenueAndModeByGameId(gameId);
    if (!venueMode) {
      logger.debug({ gameId }, 'No venue/mode for game');
      return null;
    }
    logger.debug({ gameId }, 'Resolved venue and mode');
    return venueMode;
  },

  getModes: async (gameId: number): Promise<ModeNameDto[]> => {
    await assertGameExists(gameId);
    const venueId = await gameRepository.findVenueIdByGameId(gameId);
    if (venueId === undefined) {
      logger.debug({ gameId }, 'No venue for game; returning empty modes');
      return [];
    }
    const modes = await modeRepository.findActiveByVenueId(venueId);
    logger.debug({ gameId, count: modes.length }, 'Resolved modes');
    return modes;
  },

  lookupMode: async (gameId: number, name: string): Promise<ModeIdDto> => {
    if (!name?.trim()) {
      throw new BadRequestError('Mode name is required', 'json');
    }
    await assertGameExists(gameId);
    const mode = await modeRepository.findModeIdByGameAndName(
      gameId,
      name.trim(),
    );
    if (!mode) {
      throw new NotFoundError('Mode not found', 'json');
    }
    logger.debug({ gameId, modeId: mode.modeId }, 'Resolved mode lookup');
    return mode;
  },

  getAvailableRulesets: async (
    gameId: number,
  ): Promise<AvailableRulesetsDto> => {
    await assertGameExists(gameId);
    const names = await rulesetRepository.findAvailableNames();
    logger.debug({ gameId, count: names.length }, 'Resolved available rulesets');
    return { names };
  },
};
