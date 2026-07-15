import { db } from '#db/index.js';
import {
  gameInfo,
  gameResult,
  playerInfo,
  rulesetInfo,
} from '#drizzle/schema.js';
import { asc, eq, getColumns, type InferSelectModel } from 'drizzle-orm';
import { type Request, type Response } from 'express';

type PlayerInfo = InferSelectModel<typeof playerInfo>;
type GameResult = InferSelectModel<typeof gameResult>;
type RulesetInfo = {
  initialValue: number;
  aka: string;
  umaP1: number;
  umaP2: number;
  umaP3: number;
  umaP4: number;
  oka: number;
  chomboValue: number;
  chomboOption: string;
  kiriageMangan: boolean;
  multipleRon: boolean;
};

const gameController = {
  async getPlayersByGameId(req: Request, res: Response) {
    const gameId: number = Number(req.params.id);

    try {
      const game: GameResult | undefined = await db
        .select()
        .from(gameResult)
        .where(eq(gameResult.gameId, gameId))
        .limit(1)
        .then((results) => results[0]);

      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const players: PlayerInfo[] = await db
        .select(getColumns(playerInfo))
        .from(playerInfo)
        .innerJoin(gameResult, eq(playerInfo.playerId, gameResult.playerId))
        .where(eq(gameResult.gameId, gameId))
        .orderBy(asc(gameResult.startingSeat));

      res.status(200).json(players);
    } catch (error) {
      console.error('Error fetching players by game ID:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getRulesetInfoByGameId(req: Request, res: Response) {
    const gameId: number = Number(req.params.id);

    try {
      const rulesetInfoResult: RulesetInfo | undefined = await db
        .select({
          initialValue: rulesetInfo.initialValue,
          aka: rulesetInfo.aka,
          umaP1: rulesetInfo.umaP1,
          umaP2: rulesetInfo.umaP2,
          umaP3: rulesetInfo.umaP3,
          umaP4: rulesetInfo.umaP4,
          oka: rulesetInfo.oka,
          chomboValue: rulesetInfo.chomboValue,
          chomboOption: rulesetInfo.chomboOption,
          kiriageMangan: rulesetInfo.kiriageMangan,
          multipleRon: rulesetInfo.multipleRon,
        })
        .from(rulesetInfo)
        .innerJoin(gameInfo, eq(rulesetInfo.rulesetId, gameInfo.rulesetId))
        .where(eq(gameInfo.gameId, gameId))
        .then((results) => results[0]);

      if (!rulesetInfoResult) {
        return res.status(404).json({ error: 'Ruleset info not found' });
      }

      res.json(rulesetInfoResult);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

export default gameController;
