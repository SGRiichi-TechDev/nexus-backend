import { db } from '#db/index.ts';
import { gameResult, playerInfo } from '#drizzle/schema.ts';
import { asc, eq, getColumns, type InferSelectModel } from 'drizzle-orm';
import { type Request, type Response } from 'express';

type PlayerInfo = InferSelectModel<typeof playerInfo>;
type GameResult = InferSelectModel<typeof gameResult>;

const gameController = {
  async getPlayersByGameId(req: Request, res: Response) {
    const gameId: number = Number(req.params.id);

    try {
      const game: GameResult | null = await db.query.gameResult.findFirst({
        where: eq(gameResult.gameId, gameId),
      });

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
};

export default gameController;
