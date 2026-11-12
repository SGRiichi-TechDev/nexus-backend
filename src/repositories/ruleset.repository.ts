import { db } from '#db/index.js';
import type { UpdateRulesetPatch } from '#db/types.js';
import { gameInfo, rulesetInfo } from '#drizzle/schema.js';
import { createLogger } from '#logger/logger.js';
import {
  and,
  asc,
  eq,
  gte,
  isNull,
  lte,
  ne,
  or,
} from 'drizzle-orm';

const logger = createLogger('ruleset.repository');

const availableWindow = (now: Date) =>
  and(
    or(
      isNull(rulesetInfo.effectiveStart),
      lte(rulesetInfo.effectiveStart, now),
    ),
    or(isNull(rulesetInfo.effectiveEnd), gte(rulesetInfo.effectiveEnd, now)),
  );

const notCustomRuleset = ne(rulesetInfo.name, 'Custom');

export const CUSTOM_RULESET_DEFAULTS = {
  name: 'Custom',
  initialValue: 250,
  aka: 'Aka-Ari',
  umaP1: 15,
  umaP2: 5,
  umaP3: -5,
  umaP4: -15,
  oka: 0,
  chomboValue: 40,
  chomboOption: 'Payment to all',
  kiriageMangan: true,
  multipleRon: false,
} as const;

export const rulesetRepository = {
  findAvailableNames: async (): Promise<string[]> => {
    const start = performance.now();
    const now = new Date();
    const rows = await db
      .select({ name: rulesetInfo.name })
      .from(rulesetInfo)
      .where(and(notCustomRuleset, availableWindow(now)))
      .orderBy(asc(rulesetInfo.name));
    logger.debug(
      {
        query: 'findAvailableNames',
        rowCount: rows.length,
        durationMs: Math.round(performance.now() - start),
      },
      'ruleset.findAvailableNames',
    );
    return rows.map((row) => row.name);
  },

  findAvailableIdByName: async (name: string): Promise<number | undefined> => {
    const start = performance.now();
    const now = new Date();
    const rows = await db
      .select({ rulesetId: rulesetInfo.rulesetId })
      .from(rulesetInfo)
      .where(
        and(
          eq(rulesetInfo.name, name),
          notCustomRuleset,
          availableWindow(now),
        ),
      )
      .orderBy(asc(rulesetInfo.rulesetId))
      .limit(1);
    logger.debug(
      {
        query: 'findAvailableIdByName',
        name,
        found: rows.length > 0,
        durationMs: Math.round(performance.now() - start),
      },
      'ruleset.findAvailableIdByName',
    );
    return rows[0]?.rulesetId;
  },

  updateCustomRulesetForGame: async (
    gameId: number,
    patch: UpdateRulesetPatch,
  ): Promise<void> => {
    const start = performance.now();
    await db.transaction(async (tx) => {
      const lockedGame = await tx
        .select({ rulesetId: gameInfo.rulesetId })
        .from(gameInfo)
        .where(eq(gameInfo.gameId, gameId))
        .for('update')
        .limit(1);
      const currentRulesetId = lockedGame[0]?.rulesetId ?? null;

      let targetRulesetId: number;

      if (currentRulesetId === null) {
        const [inserted] = await tx
          .insert(rulesetInfo)
          .values({ ...CUSTOM_RULESET_DEFAULTS })
          .returning({ rulesetId: rulesetInfo.rulesetId });
        if (inserted === undefined) {
          throw new Error('Failed to insert default Custom ruleset');
        }
        targetRulesetId = inserted.rulesetId;
        await tx
          .update(gameInfo)
          .set({ rulesetId: targetRulesetId })
          .where(eq(gameInfo.gameId, gameId));
      } else {
        const existing = await tx
          .select({
            rulesetId: rulesetInfo.rulesetId,
            name: rulesetInfo.name,
            initialValue: rulesetInfo.initialValue,
            aka: rulesetInfo.aka,
            umaP1: rulesetInfo.umaP1,
            umaP2: rulesetInfo.umaP2,
            umaP3: rulesetInfo.umaP3,
            umaP4: rulesetInfo.umaP4,
            oka: rulesetInfo.oka,
            kiriageMangan: rulesetInfo.kiriageMangan,
            multipleRon: rulesetInfo.multipleRon,
            chomboValue: rulesetInfo.chomboValue,
            chomboOption: rulesetInfo.chomboOption,
            moreDetails: rulesetInfo.moreDetails,
            umaCal: rulesetInfo.umaCal,
            positionalUmaId: rulesetInfo.positionalUmaId,
          })
          .from(rulesetInfo)
          .where(eq(rulesetInfo.rulesetId, currentRulesetId))
          .limit(1);
        const row = existing[0];
        if (!row) {
          const [inserted] = await tx
            .insert(rulesetInfo)
            .values({ ...CUSTOM_RULESET_DEFAULTS })
            .returning({ rulesetId: rulesetInfo.rulesetId });
          if (inserted === undefined) {
            throw new Error('Failed to insert default Custom ruleset');
          }
          targetRulesetId = inserted.rulesetId;
          await tx
            .update(gameInfo)
            .set({ rulesetId: targetRulesetId })
            .where(eq(gameInfo.gameId, gameId));
        } else if (row.name !== 'Custom') {
          const [cloned] = await tx
            .insert(rulesetInfo)
            .values({
              name: 'Custom',
              initialValue: row.initialValue,
              aka: row.aka,
              umaP1: row.umaP1,
              umaP2: row.umaP2,
              umaP3: row.umaP3,
              umaP4: row.umaP4,
              oka: row.oka,
              kiriageMangan: row.kiriageMangan,
              multipleRon: row.multipleRon,
              chomboValue: row.chomboValue,
              chomboOption: row.chomboOption,
              moreDetails: row.moreDetails,
              umaCal: row.umaCal,
              positionalUmaId: row.positionalUmaId,
            })
            .returning({ rulesetId: rulesetInfo.rulesetId });
          if (cloned === undefined) {
            throw new Error('Failed to clone ruleset as Custom');
          }
          targetRulesetId = cloned.rulesetId;
          await tx
            .update(gameInfo)
            .set({ rulesetId: targetRulesetId })
            .where(eq(gameInfo.gameId, gameId));
        } else {
          targetRulesetId = row.rulesetId;
        }
      }

      if (Object.keys(patch).length > 0) {
        await tx
          .update(rulesetInfo)
          .set(patch)
          .where(eq(rulesetInfo.rulesetId, targetRulesetId));
      }
    });
    logger.debug(
      {
        query: 'updateCustomRulesetForGame',
        gameId,
        patch,
        durationMs: Math.round(performance.now() - start),
      },
      'ruleset.updateCustomRulesetForGame',
    );
  },
};
