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
  RulesetMutationResponseDto,
  SeatPlayerResponseDto,
  SetPlayerPenaltyResponseDto,
  SetSeatFinalScoreResponseDto,
  UpdateGamePatch,
  UpdateGameResponseDto,
  UpdateRulesetPatch,
  VenueModeDto,
} from '#db/types.js';
import { akaEnum, chomboOptionEnum } from '#drizzle/schema.js';
import { BadRequestError, NotFoundError } from '#errors/app-error.js';
import { createLogger } from '#logger/logger.js';
import { gameRepository } from '#repositories/game.repository.js';
import { handRepository } from '#repositories/hand.repository.js';
import { modeRepository } from '#repositories/mode.repository.js';
import { playerRepository } from '#repositories/player.repository.js';
import { rulesetRepository } from '#repositories/ruleset.repository.js';

const logger = createLogger('game.service');

const INT4_MAX = 2147483647;

const VALID_AKA = new Set(akaEnum.enumValues);
const VALID_CHOMBO_OPTION = new Set(chomboOptionEnum.enumValues);

const parseNonNegativeInt = (value: unknown, fieldName: string): number => {
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0 || n > INT4_MAX) {
    throw new BadRequestError(
      `${fieldName} must be a non-negative integer`,
      'json',
    );
  }
  return n;
};

const parseSignedInt = (value: unknown, fieldName: string): number => {
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || Math.abs(n) > INT4_MAX) {
    throw new BadRequestError(`${fieldName} must be an integer`, 'json');
  }
  return n;
};

const parseRulesetPatch = (body: unknown): UpdateRulesetPatch => {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestError(
      'At least one ruleset field is required',
      'json',
    );
  }
  const raw = body as Record<string, unknown>;
  const patch: UpdateRulesetPatch = {};

  if (raw.initialValue !== undefined) {
    patch.initialValue = parseNonNegativeInt(raw.initialValue, 'initialValue');
  }
  if (raw.chomboValue !== undefined) {
    patch.chomboValue = parseNonNegativeInt(raw.chomboValue, 'chomboValue');
  }
  if (raw.aka !== undefined) {
    const aka = String(raw.aka);
    if (!VALID_AKA.has(aka as (typeof akaEnum.enumValues)[number])) {
      throw new BadRequestError(
        'aka must be one of Aka-Ari, Aka-Nashi',
        'json',
      );
    }
    patch.aka = aka as (typeof akaEnum.enumValues)[number];
  }
  if (raw.chomboOption !== undefined) {
    const option = String(raw.chomboOption);
    if (
      !VALID_CHOMBO_OPTION.has(
        option as (typeof chomboOptionEnum.enumValues)[number],
      )
    ) {
      throw new BadRequestError(
        'chomboOption must be one of Flat deduction, Payment to all',
        'json',
      );
    }
    patch.chomboOption = option as (typeof chomboOptionEnum.enumValues)[number];
  }
  if (raw.kiriageMangan !== undefined) {
    if (typeof raw.kiriageMangan !== 'boolean') {
      throw new BadRequestError('kiriageMangan must be a boolean', 'json');
    }
    patch.kiriageMangan = raw.kiriageMangan;
  }
  if (raw.multipleRon !== undefined) {
    if (typeof raw.multipleRon !== 'boolean') {
      throw new BadRequestError('multipleRon must be a boolean', 'json');
    }
    patch.multipleRon = raw.multipleRon;
  }

  if (Object.keys(patch).length === 0) {
    throw new BadRequestError(
      'At least one ruleset field is required',
      'json',
    );
  }
  return patch;
};

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
      patch.deleted !== undefined ||
      patch.finalScoreOnly !== undefined;
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

  updateRuleset: async (
    gameId: number,
    body: unknown,
  ): Promise<RulesetMutationResponseDto> => {
    const patch = parseRulesetPatch(body);
    await assertGameExists(gameId);
    await rulesetRepository.updateCustomRulesetForGame(gameId, patch);
    logger.debug({ gameId, patch }, 'Updated game ruleset');
    return { gameId };
  },

  applyNamedRuleset: async (
    gameId: number,
    name: unknown,
  ): Promise<RulesetMutationResponseDto> => {
    const trimmed = typeof name === 'string' ? name.trim() : '';
    if (!trimmed) {
      throw new BadRequestError('Ruleset name is required', 'json');
    }
    if (trimmed === 'Custom') {
      throw new BadRequestError('Ruleset name cannot be Custom', 'json');
    }
    await assertGameExists(gameId);
    const rulesetId = await rulesetRepository.findAvailableIdByName(trimmed);
    if (rulesetId === undefined) {
      throw new NotFoundError('Ruleset not found', 'json');
    }
    await gameRepository.updateGameFields(gameId, { rulesetId });
    logger.debug({ gameId, rulesetId, name: trimmed }, 'Applied named ruleset');
    return { gameId };
  },

  setPlayerPenalty: async (
    gameId: number,
    playerId: number,
    penalty: unknown,
  ): Promise<SetPlayerPenaltyResponseDto> => {
    const value = parseNonNegativeInt(penalty, 'penalty');
    await assertGameExists(gameId);
    const updated = await gameRepository.setPlayerPenalty(
      gameId,
      playerId,
      value,
    );
    if (!updated) {
      throw new NotFoundError('Player not seated in game', 'json');
    }
    logger.debug({ gameId, playerId, penalty: value }, 'Set player penalty');
    return { gameId, playerId };
  },

  setSeatFinalScore: async (
    gameId: number,
    seat: number,
    score: unknown,
  ): Promise<SetSeatFinalScoreResponseDto> => {
    if (
      !Number.isFinite(seat) ||
      !Number.isInteger(seat) ||
      seat < 1 ||
      seat > 4
    ) {
      throw new BadRequestError(
        'Starting seat must be an integer between 1 and 4',
        'json',
      );
    }
    const value = parseSignedInt(score, 'score');
    await assertGameExists(gameId);
    const updated = await gameRepository.setSeatFinalScore(gameId, seat, value);
    if (!updated) {
      throw new NotFoundError('Seat not found', 'json');
    }
    logger.debug({ gameId, startingSeat: seat, score: value }, 'Set seat score');
    return { gameId, startingSeat: seat };
  },

  recomputeFinalPositions: async (
    gameId: number,
  ): Promise<UpdateGameResponseDto> => {
    await assertGameExists(gameId);
    const rowsUpdated = await gameRepository.recomputeFinalPositions(gameId);
    if (rowsUpdated === 0) {
      throw new BadRequestError('Game has no seated players', 'json');
    }
    logger.debug({ gameId, rowsUpdated }, 'Recomputed final positions');
    return { gameId };
  },

  completeGame: async (gameId: number): Promise<UpdateGameResponseDto> => {
    await assertGameExists(gameId);
    const outcome = await gameRepository.completeGame(gameId);
    if (outcome === 'noop') {
      logger.debug({ gameId }, 'Game already completed');
    } else {
      logger.debug({ gameId }, 'Completed game');
    }
    return { gameId };
  },
};
