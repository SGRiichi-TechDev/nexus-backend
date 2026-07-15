import { db } from '#db/index.js';
import { handPlayerResult, playerInfo } from '#drizzle/schema.js';
import { and, asc, eq, getColumns } from 'drizzle-orm';
import { type Request, type Response } from 'express';

const handController = {
  async getPlayersInRiichi(req: Request, res: Response) {
    const handId: number = Number(req.params.id);

    try {
      const result = await db
        .select(getColumns(playerInfo))
        .from(handPlayerResult)
        .innerJoin(
          playerInfo,
          eq(handPlayerResult.playerId, playerInfo.playerId),
        )
        .where(
          and(
            eq(handPlayerResult.handId, handId),
            eq(handPlayerResult.riichi, true),
          ),
        )
        .orderBy(asc(handPlayerResult.riichiOrder));

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async getPlayersInTenpai(req: Request, res: Response) {
    const handId: number = Number(req.params.id);

    try {
      const result = await db
        .select(getColumns(playerInfo))
        .from(handPlayerResult)
        .innerJoin(
          playerInfo,
          eq(handPlayerResult.playerId, playerInfo.playerId),
        )
        .where(
          and(
            eq(handPlayerResult.handId, handId),
            eq(handPlayerResult.tenpai, true),
          ),
        );

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async getPlayersThatChombo(req: Request, res: Response) {
    const handId: number = Number(req.params.id);

    try {
      const result = await db
        .select(getColumns(playerInfo))
        .from(handPlayerResult)
        .innerJoin(
          playerInfo,
          eq(handPlayerResult.playerId, playerInfo.playerId),
        )
        .where(
          and(
            eq(handPlayerResult.handId, handId),
            eq(handPlayerResult.chombo, true),
          ),
        );

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

export default handController;
