import {
  gameInfo,
  gameResult,
  handInfo,
  handWin,
  playerInfo,
  rulesetInfo,
} from '#drizzle/schema.js';
import type { InferSelectModel } from 'drizzle-orm';

export type PlayerInfo = InferSelectModel<typeof playerInfo>;
export type GameResult = InferSelectModel<typeof gameResult>;

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

/** Projection returned by findCurrentIncompleteByRecorder */
export type CurrentGameDto = {
  gameId: InferSelectModel<typeof gameInfo>['gameId'];
  submissionStage: InferSelectModel<typeof gameInfo>['submissionStage'];
  handId: InferSelectModel<typeof handInfo>['handId'] | null;
  handOutcome: InferSelectModel<typeof handInfo>['handOutcome'] | null;
  isRecorded: InferSelectModel<typeof gameInfo>['isRecorded'];
  han: InferSelectModel<typeof handWin>['han'] | null;
  finalScoreOnly: InferSelectModel<typeof gameInfo>['finalScoreOnly'];
  multipleRon: InferSelectModel<typeof rulesetInfo>['multipleRon'] | null;
};
