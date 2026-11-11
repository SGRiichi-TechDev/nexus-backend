import type {
  ApplyScoreChangesDto,
  CreateNextHandDto,
  DrawPaymentItemDto,
  HandDetailsDto,
  HandIdDto,
  HandMutationResponseDto,
  HandWinCreateResponseDto,
  HasOutcomeDto,
  IndividualOutcome,
  MultipleRonStatusDto,
  PlayerInfo,
  RulesetInfoSelect,
  ScoreCalcInputDto,
  Wind,
} from '#db/types.js';
import {
  handOutcomeEnum,
  individualOutcomeEnum,
  windEnum,
} from '#drizzle/schema.js';
import { BadRequestError, NotFoundError } from '#errors/app-error.js';
import { createLogger } from '#logger/logger.js';
import { gameRepository } from '#repositories/game.repository.js';
import { handRepository } from '#repositories/hand.repository.js';

const logger = createLogger('hand.service');

const MAX_SEATED_PLAYERS = 4;

const VALID_WINDS = new Set<Wind>(windEnum.enumValues);
const VALID_HAND_OUTCOMES = new Set(handOutcomeEnum.enumValues);
const VALID_INDIVIDUAL_OUTCOMES = new Set(individualOutcomeEnum.enumValues);

const parsePlayerIds = (value: unknown): number[] => {
  if (!Array.isArray(value)) {
    throw new BadRequestError('playerIds must be an array', 'json');
  }
  const ids: number[] = [];
  for (const item of value) {
    const n = Number(item);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      throw new BadRequestError(
        'playerIds must contain finite integers',
        'json',
      );
    }
    ids.push(n);
  }
  if (ids.length > MAX_SEATED_PLAYERS) {
    throw new BadRequestError(
      `playerIds must contain at most ${MAX_SEATED_PLAYERS} entries`,
      'json',
    );
  }
  return ids;
};

const assertUniquePlayerIds = (ids: number[]): void => {
  if (new Set(ids).size !== ids.length) {
    throw new BadRequestError('playerIds must be unique', 'json');
  }
};

const assertPlayerIdsOnHand = async (
  handId: number,
  playerIds: number[],
): Promise<void> => {
  if (playerIds.length === 0) {
    return;
  }
  const onHand = await handRepository.findPlayerIdsOnHand(handId);
  const onHandSet = new Set(onHand);
  for (const playerId of playerIds) {
    if (!onHandSet.has(playerId)) {
      throw new BadRequestError(
        'playerIds must belong to players seated on the hand',
        'json',
      );
    }
  }
};

const requireFiniteInteger = (value: number, label: string): number => {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new BadRequestError(`${label} must be a finite integer`, 'json');
  }
  return value;
};

const requireFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value)) {
    throw new BadRequestError(`${label} must be a finite number`, 'json');
  }
  return value;
};

export const computeChomboScoreByPlayer = (
  allPlayerIds: number[],
  chomboPlayerIds: number[],
  ruleset: Pick<RulesetInfoSelect, 'chomboValue' | 'chomboOption'>,
): Map<number, number> => {
  const chomboSet = new Set(chomboPlayerIds);
  const n = chomboSet.size;
  const val = ruleset.chomboValue;
  const result = new Map<number, number>();
  const paymentToAll = ruleset.chomboOption === 'Payment to all';

  for (const pid of allPlayerIds) {
    if (paymentToAll) {
      result.set(pid, chomboSet.has(pid) ? (n - 4) * val : n * val);
    } else {
      result.set(pid, chomboSet.has(pid) ? -val : 0);
    }
  }
  return result;
};

const parseDrawPayments = (value: unknown): DrawPaymentItemDto[] => {
  if (!Array.isArray(value)) {
    throw new BadRequestError('payments must be an array', 'json');
  }
  const payments: DrawPaymentItemDto[] = [];
  for (const item of value) {
    if (item === null || typeof item !== 'object') {
      throw new BadRequestError('payments must contain objects', 'json');
    }
    const record = item as Record<string, unknown>;
    const playerId = Number(record.playerId);
    const scoreChange = Number(record.scoreChange);
    const outcome = String(record.outcome ?? '');
    if (!Number.isFinite(playerId) || !Number.isInteger(playerId)) {
      throw new BadRequestError(
        'payments.playerId must be a finite integer',
        'json',
      );
    }
    requireFiniteNumber(scoreChange, 'payments.scoreChange');
    if (
      !VALID_INDIVIDUAL_OUTCOMES.has(
        outcome as (typeof individualOutcomeEnum.enumValues)[number],
      )
    ) {
      throw new BadRequestError('Invalid individual outcome', 'json');
    }
    payments.push({ playerId, outcome, scoreChange });
  }
  if (payments.length > MAX_SEATED_PLAYERS) {
    throw new BadRequestError(
      `payments must contain at most ${MAX_SEATED_PLAYERS} entries`,
      'json',
    );
  }
  return payments;
};

const parseScoreChangeUpdates = (
  value: unknown,
): ApplyScoreChangesDto['updates'] => {
  if (!Array.isArray(value)) {
    throw new BadRequestError('updates must be an array', 'json');
  }
  const updates: ApplyScoreChangesDto['updates'] = [];
  for (const item of value) {
    if (item === null || typeof item !== 'object') {
      throw new BadRequestError('updates must contain objects', 'json');
    }
    const record = item as Record<string, unknown>;
    const handPlayerResultId = Number(record.handPlayerResultId);
    const scoreChange = Number(record.scoreChange);
    const winner = Boolean(record.winner);
    if (
      !Number.isFinite(handPlayerResultId) ||
      !Number.isInteger(handPlayerResultId)
    ) {
      throw new BadRequestError(
        'updates.handPlayerResultId must be a finite integer',
        'json',
      );
    }
    requireFiniteNumber(scoreChange, 'updates.scoreChange');
    updates.push({ handPlayerResultId, scoreChange, winner });
  }
  if (updates.length > MAX_SEATED_PLAYERS) {
    throw new BadRequestError(
      `updates must contain at most ${MAX_SEATED_PLAYERS} entries`,
      'json',
    );
  }
  return updates;
};

const assertHandExists = async (handId: number): Promise<void> => {
  const exists = await handRepository.existsById(handId);
  if (!exists) {
    throw new NotFoundError('Hand not found', 'json');
  }
};

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

  replaceRiichi: async (
    handId: number,
    playerIds: unknown,
  ): Promise<HandMutationResponseDto> => {
    const ids = parsePlayerIds(playerIds);
    await assertHandExists(handId);
    const result = await handRepository.replaceRiichi(handId, ids);
    logger.debug({ handId, playerIds: ids }, 'Replaced riichi flags');
    return result;
  },

  applyRiichi: async (
    handId: number,
    playerIds: unknown,
  ): Promise<HandMutationResponseDto> => {
    const ids = parsePlayerIds(playerIds);
    assertUniquePlayerIds(ids);
    await assertHandExists(handId);
    await assertPlayerIdsOnHand(handId, ids);
    const result = await handRepository.applyRiichiResult(handId, ids);
    logger.debug({ handId, playerIds: ids }, 'Applied riichi result');
    return result;
  },

  resetRiichi: async (handId: number): Promise<HandMutationResponseDto> => {
    await assertHandExists(handId);
    const result = await handRepository.resetRiichi(handId);
    logger.debug({ handId }, 'Reset riichi');
    return result;
  },

  setHandOutcome: async (
    handId: number,
    outcome: string,
  ): Promise<HandMutationResponseDto> => {
    if (!VALID_HAND_OUTCOMES.has(outcome as (typeof handOutcomeEnum.enumValues)[number])) {
      throw new BadRequestError('Invalid hand outcome', 'json');
    }
    await assertHandExists(handId);
    const result = await handRepository.setHandOutcome(
      handId,
      outcome as (typeof handOutcomeEnum.enumValues)[number],
    );
    logger.debug({ handId, outcome }, 'Set hand outcome');
    return result;
  },

  setPlayerOutcome: async (
    handId: number,
    playerId: number,
    outcome: string,
  ): Promise<HandMutationResponseDto> => {
    if (
      !VALID_INDIVIDUAL_OUTCOMES.has(
        outcome as (typeof individualOutcomeEnum.enumValues)[number],
      )
    ) {
      throw new BadRequestError('Invalid individual outcome', 'json');
    }
    await assertHandExists(handId);
    const onHand = await handRepository.existsPlayerOnHand(handId, playerId);
    if (!onHand) {
      throw new NotFoundError('Hand player result not found', 'json');
    }
    const result = await handRepository.setPlayerOutcome(
      handId,
      playerId,
      outcome as IndividualOutcome,
    );
    logger.debug({ handId, playerId, outcome }, 'Set player outcome');
    return result;
  },

  setDealIn: async (
    handId: number,
    playerId: number,
  ): Promise<HandMutationResponseDto> => {
    await assertHandExists(handId);
    const onHand = await handRepository.existsPlayerOnHand(handId, playerId);
    if (!onHand) {
      throw new NotFoundError('Hand player result not found', 'json');
    }
    const result = await handRepository.setDealIn(handId, playerId);
    logger.debug({ handId, playerId }, 'Set deal-in');
    return result;
  },

  setHan: async (handId: number, han: number): Promise<HandMutationResponseDto> => {
    requireFiniteInteger(han, 'han');
    await assertHandExists(handId);
    const result = await handRepository.upsertHan(handId, han);
    logger.debug({ handId, han }, 'Upserted han');
    return result;
  },

  setFu: async (handId: number, fu: number): Promise<HandMutationResponseDto> => {
    requireFiniteInteger(fu, 'fu');
    await assertHandExists(handId);
    const result = await handRepository.upsertFu(handId, fu);
    logger.debug({ handId, fu }, 'Upserted fu');
    return result;
  },

  replaceTenpai: async (
    handId: number,
    playerIds: unknown,
  ): Promise<HandMutationResponseDto> => {
    const ids = parsePlayerIds(playerIds);
    await assertHandExists(handId);
    const result = await handRepository.replaceTenpai(handId, ids);
    logger.debug({ handId, playerIds: ids }, 'Replaced tenpai flags');
    return result;
  },

  setDrawPayments: async (
    handId: number,
    paymentsUnknown: unknown,
  ): Promise<HandMutationResponseDto> => {
    const payments = parseDrawPayments(paymentsUnknown);
    await assertHandExists(handId);
    const result = await handRepository.setDrawPayments(
      handId,
      payments.map((p) => ({
        playerId: p.playerId,
        outcome: p.outcome as IndividualOutcome,
        scoreChange: p.scoreChange,
      })),
    );
    logger.debug(
      { handId, paymentCount: payments.length },
      'Set draw payments',
    );
    return result;
  },

  replaceChombo: async (
    handId: number,
    playerIds: unknown,
  ): Promise<HandMutationResponseDto> => {
    const ids = parsePlayerIds(playerIds);
    await assertHandExists(handId);
    const result = await handRepository.replaceChombo(handId, ids);
    logger.debug({ handId, playerIds: ids }, 'Replaced chombo flags');
    return result;
  },

  applyChombo: async (
    handId: number,
    playerIds: unknown,
  ): Promise<HandMutationResponseDto> => {
    const chomboPlayerIds = parsePlayerIds(playerIds);
    assertUniquePlayerIds(chomboPlayerIds);
    await assertHandExists(handId);
    await assertPlayerIdsOnHand(handId, chomboPlayerIds);
    const gameId = await handRepository.findGameIdByHandId(handId);
    if (gameId === undefined) {
      throw new NotFoundError('Hand not found', 'json');
    }
    const ruleset = await gameRepository.findRulesetByGameId(gameId);
    if (!ruleset) {
      throw new BadRequestError('Game has no ruleset', 'json');
    }
    const allPlayerIds = await handRepository.findPlayerIdsOnHand(handId);
    const scoreByPlayerId = computeChomboScoreByPlayer(
      allPlayerIds,
      chomboPlayerIds,
      ruleset,
    );
    const result = await handRepository.applyChomboScores(
      handId,
      scoreByPlayerId,
    );
    logger.debug({ handId, chomboPlayerIds }, 'Applied chombo scores');
    return result;
  },

  applyScoreChanges: async (
    handId: number,
    updatesUnknown: unknown,
    winnerHandValueUnknown: unknown,
  ): Promise<HandMutationResponseDto> => {
    const updates = parseScoreChangeUpdates(updatesUnknown);
    await assertHandExists(handId);

    if (updates.length === 0) {
      logger.debug({ handId }, 'applyScoreChanges no-op (empty updates)');
      return { handId };
    }

    let winnerHandValue: number | null = null;
    if (winnerHandValueUnknown !== null && winnerHandValueUnknown !== undefined) {
      winnerHandValue = requireFiniteNumber(
        Number(winnerHandValueUnknown),
        'winnerHandValue',
      );
    }

    const result = await handRepository.applyScoreChanges(
      handId,
      updates,
      winnerHandValue,
    );
    logger.debug(
      { handId, updateCount: updates.length, winnerHandValue },
      'Applied score changes',
    );
    return result;
  },

  confirmHand: async (handId: number): Promise<HandMutationResponseDto> => {
    await assertHandExists(handId);
    const result = await handRepository.confirmHand(handId);
    logger.debug({ handId }, 'Confirmed hand');
    return result;
  },

  createHandWin: async (
    handId: number,
    winnerPlayerId: number,
  ): Promise<HandWinCreateResponseDto> => {
    requireFiniteInteger(winnerPlayerId, 'winnerPlayerId');
    await assertHandExists(handId);
    const onHand = await handRepository.existsPlayerOnHand(
      handId,
      winnerPlayerId,
    );
    if (!onHand) {
      throw new NotFoundError('Hand player result not found', 'json');
    }
    const result = await handRepository.insertHandWin(handId, winnerPlayerId);
    logger.debug({ handId, winnerPlayerId }, 'Inserted hand win');
    return result;
  },
};
