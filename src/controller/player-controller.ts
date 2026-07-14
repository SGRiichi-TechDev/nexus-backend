import { db } from '#db/index.js';
import { playerInfo } from '#drizzle/schema.js';
import { type InferSelectModel } from 'drizzle-orm';
import { type Request, type Response } from 'express';

type PlayerInfo = InferSelectModel<typeof playerInfo>;

const playerController = {
  getAllPlayers: async (req: Request, res: Response) => {
    try {
      const result: PlayerInfo[] = await db.query.playerInfo.findMany();
      if (result.length === 0) {
        res.status(404).send('No players found');
      } else {
        res.json(result);
      }
    } catch (err) {
      console.error('Error executing query', (err as Error).stack);
      res.status(500).send('Internal Server Error');
    }
  },

  getPlayerById: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const result: PlayerInfo | undefined =
        await db.query.playerInfo.findFirst({
          where: { playerId: Number(id) },
        });
      if (result === undefined) {
        res.status(404).send('Player not found');
      } else {
        res.json(result);
      }
    } catch (err) {
      console.error('Error executing query', (err as Error).stack);
      res.status(500).send('Internal Server Error');
    }
  },
};

export default playerController;
