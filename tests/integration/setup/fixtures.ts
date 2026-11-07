/** Deterministic fixture IDs from supabase/seed.integration.sql (9xxx range). */

export const FIXTURES = {
  venueId: 9001,
  modeId: 9001,
  rulesetId: 9001,
  positionalUmaId: 9001,
  gameId: 9001,
  /** Draft game with no venue/ruleset/seats/hands (recorder: Eve). */
  emptyGameId: 9002,
  handId: 90010,
  recorderTelegramId: 900001,
  emptyGameRecorderTelegramId: 900005,
  unusedTelegramId: 999999,
  players: [
    { playerId: 9001, displayName: 'IT Alice', telegramId: 900001 },
    { playerId: 9002, displayName: 'IT Bob', telegramId: 900002 },
    { playerId: 9003, displayName: 'IT Carol', telegramId: 900003 },
    { playerId: 9004, displayName: 'IT Dave', telegramId: 900004 },
    { playerId: 9005, displayName: 'IT Eve', telegramId: 900005 },
  ],
  ruleset: {
    initialValue: 25000,
    aka: 'Aka-Ari' as const,
    umaP1: 15,
    umaP2: 5,
    umaP3: -5,
    umaP4: -15,
    oka: 0,
    chomboValue: 20,
    chomboOption: 'Payment to all' as const,
    kiriageMangan: false,
    multipleRon: false,
  },
  finalScores: [
    { name: 'IT Alice', score: 35000, position: 1 },
    { name: 'IT Bob', score: 28000, position: 2 },
    { name: 'IT Carol', score: 22000, position: 3 },
    { name: 'IT Dave', score: 15000, position: 4 },
  ],
} as const;
