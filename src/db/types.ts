import {
  akaEnum,
  chomboOptionEnum,
  gameInfo,
  gameResult,
  handInfo,
  handWin,
  individualOutcomeEnum,
  playerInfo,
  rulesetInfo,
  scoreLookup,
  windEnum,
} from '#drizzle/schema.js';
import type { InferSelectModel } from 'drizzle-orm';

export type PlayerInfo = InferSelectModel<typeof playerInfo>;
export type GameResult = InferSelectModel<typeof gameResult>;

export type IndividualOutcome =
  (typeof individualOutcomeEnum.enumValues)[number];
export type Wind = (typeof windEnum.enumValues)[number];

/** Columns selected for ruleset-by-game queries (typed against schema). */
export type RulesetInfoSelect = Pick<
  InferSelectModel<typeof rulesetInfo>,
  | 'initialValue'
  | 'aka'
  | 'umaP1'
  | 'umaP2'
  | 'umaP3'
  | 'umaP4'
  | 'oka'
  | 'chomboValue'
  | 'chomboOption'
  | 'kiriageMangan'
  | 'multipleRon'
>;

/** Base projection returned by findCurrentIncompleteByRecorder */
export type CurrentGameDto = {
  gameId: InferSelectModel<typeof gameInfo>['gameId'];
  status: InferSelectModel<typeof gameInfo>['status'];
  handId: InferSelectModel<typeof handInfo>['handId'] | null;
  handOutcome: InferSelectModel<typeof handInfo>['handOutcome'] | null;
  isRecorded: InferSelectModel<typeof gameInfo>['isRecorded'];
  han: InferSelectModel<typeof handWin>['han'] | null;
  finalScoreOnly: InferSelectModel<typeof gameInfo>['finalScoreOnly'];
  multipleRon: InferSelectModel<typeof rulesetInfo>['multipleRon'] | null;
};

/** Full session state for bot session restore (querySessionInfo) */
export type SessionGameDto = CurrentGameDto & {
  isRecordingMultipleRon: boolean;
  players: PlayerInfo[];
};

export type ActiveParticipationDto = {
  gameId: number | null;
  handId: number | null;
};

export type HasOutcomeDto = {
  hasOutcome: boolean;
};

export type HandWinSummary = {
  handWinId: number;
  winnerPlayerId: number;
  han: number | null;
  fu: number | null;
  handValue: number;
  winType: string;
};

export type HandPlayerResultDto = {
  displayName: string;
  outcome: IndividualOutcome | null;
  riichi: boolean;
  riichiOrder: number | null;
  endScore: number | null;
  scoreChange: number;
  dealer: boolean;
  tenpai: boolean;
};

export type HandDetailsDto = {
  handNum: number;
  wind: Wind;
  roundNum: number;
  honba: number;
  handOutcome: InferSelectModel<typeof handInfo>['handOutcome'];
  riichiDeposits: number;
  han: number | null;
  fu: number | null;
  handValue: number | null;
  wins: HandWinSummary[];
  individualResult: HandPlayerResultDto[];
};

export type FinalScorePlayerDto = {
  name: string;
  score: number;
  position: number;
};

export type FinalScoreDto = {
  gameId: number;
  initialValue: number;
  umaP1: number;
  umaP2: number;
  umaP3: number;
  umaP4: number;
  individual: FinalScorePlayerDto[];
};

export type PenaltyDto = {
  name: string;
  penalty: number;
};

export type HandIdDto = {
  handId: number;
};

export type LastHandForNextDto = {
  handId: number;
  wind: Wind;
  roundNum: number;
  honba: number;
  handOutcome: InferSelectModel<typeof handInfo>['handOutcome'];
  dealerOutcome: IndividualOutcome | null;
  tenpai: boolean;
};

export type VenueModeDto = {
  venue: string;
  mode: string;
};

export type VenueNameDto = {
  name: string;
};

export type VenueIdDto = {
  venueId: number;
};

export type ModeNameDto = {
  name: string;
};

export type ModeIdDto = {
  modeId: number;
};

export type AvailableRulesetsDto = {
  names: string[];
};

export type MultipleRonStatusDto = {
  seat: number;
  playerId: number;
  outcome: IndividualOutcome | null;
};

export type ScoreLookupRow = InferSelectModel<typeof scoreLookup>;

export type HandResultForScoreCalc = {
  handPlayerResultId: number;
  playerId: number;
  dealer: boolean;
  outcome: IndividualOutcome | null;
  endScore: number | null;
  scoreChange: number;
};

export type ScoreCalcInputDto = {
  handId: number;
  gameId: number;
  han: number | null;
  fu: number | null;
  honba: number;
  riichiDeposits: number;
  isRecordingMultipleRon: boolean;
  kiriageMangan: boolean;
  handResults: HandResultForScoreCalc[];
};

export type HandCountDto = {
  count: number;
};

export type CreateGameDto = {
  telegramId: number;
};

export type CreateGameResponseDto = {
  gameId: number;
};

export type UpdateGamePatch = {
  venueId?: number;
  modeId?: number;
  isRecorded?: boolean;
  deleted?: boolean;
  finalScoreOnly?: boolean;
};

export type UpdateGameResponseDto = {
  gameId: number;
};

export type UpdateRulesetPatch = {
  initialValue?: number;
  aka?: (typeof akaEnum.enumValues)[number];
  chomboValue?: number;
  chomboOption?: (typeof chomboOptionEnum.enumValues)[number];
  kiriageMangan?: boolean;
  multipleRon?: boolean;
};

export type ApplyRulesetDto = {
  name: string;
};

export type RulesetMutationResponseDto = UpdateGameResponseDto;

export type SetPenaltyDto = {
  penalty: number;
};

export type SetPlayerPenaltyResponseDto = {
  gameId: number;
  playerId: number;
};

export type SetSeatFinalScoreDto = {
  score: number;
};

export type SetSeatFinalScoreResponseDto = {
  gameId: number;
  startingSeat: number;
};

export type CreatePlayerDto = {
  displayName: string;
};

export type SeatPlayerDto = {
  startingSeat: number;
  playerId: number;
};

export type SeatPlayerResponseDto = {
  gameId: number;
  startingSeat: number;
  playerId: number;
};

export type CreateNextHandDto = {
  wind: Wind;
  roundNum: number;
  honba: number;
};

export type PlayerIdListDto = {
  playerIds: number[];
};

export type HandOutcomeDto = {
  outcome: string;
};

export type PlayerOutcomeDto = {
  outcome: string;
};

export type HanDto = {
  han: number;
};

export type FuDto = {
  fu: number;
};

export type HandMutationResponseDto = {
  handId: number;
  playerId?: number;
};

export type DrawPaymentItemDto = {
  playerId: number;
  outcome: string;
  scoreChange: number;
};

export type DrawPaymentsDto = {
  payments: DrawPaymentItemDto[];
};

export type ScoreChangeUpdateDto = {
  handPlayerResultId: number;
  scoreChange: number;
  winner: boolean;
};

export type ApplyScoreChangesDto = {
  updates: ScoreChangeUpdateDto[];
  winnerHandValue: number | null;
};

export type CreateHandWinDto = {
  winnerPlayerId: number;
};

export type HandWinCreateResponseDto = {
  handId: number;
  winnerPlayerId: number;
};
