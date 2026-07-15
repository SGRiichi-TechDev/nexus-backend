import { db } from '#db/index.js';
import {
  gameInfo,
  handInfo,
  handWin,
  playerInfo,
  rulesetInfo,
} from '#drizzle/schema.js';
import { type InferSelectModel, and, desc, eq } from 'drizzle-orm';
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

  getCurrentGameForPlayer: async (req: Request, res: Response) => {
    const { telegramId } = req.query;
    const telegramIdNumber: number = Number(telegramId);
    if (!telegramIdNumber) {
      res.status(400).send('Telegram ID is required');
      return;
    }

    try {
      const result: PlayerInfo[] = await db
        .select()
        .from(playerInfo)
        .where(eq(playerInfo.telegramId, telegramIdNumber))
        .limit(1);

      if (result.length === 0) {
        res.status(404).send('Player not found');
        return;
      }

      const playerId = result[0]!.playerId;
      const currentGame = await db
        .select({
          gameId: gameInfo.gameId,
          submissionStage: gameInfo.submissionStage,
          handId: handInfo.handId,
          handOutcome: handInfo.handOutcome,
          isRecorded: gameInfo.isRecorded,
          han: handWin.han,
          finalScoreOnly: gameInfo.finalScoreOnly,
          multipleRon: rulesetInfo.multipleRon,
        })
        .from(gameInfo)
        .leftJoin(handInfo, eq(gameInfo.gameId, handInfo.gameId))
        .leftJoin(handWin, eq(handInfo.handId, handWin.handId))
        .leftJoin(rulesetInfo, eq(gameInfo.rulesetId, rulesetInfo.rulesetId))
        .where(
          and(
            eq(gameInfo.recordedByPid, playerId),
            eq(gameInfo.completed, false),
            eq(gameInfo.deleted, false),
          ),
        )
        .orderBy(desc(handInfo.handId))
        .limit(1);

      if (currentGame.length === 0) {
        res.status(404).send('No current game found for this player');
      } else {
        res.json(currentGame[0]);
      }
    } catch (err) {
      console.error('Error executing query', (err as Error).stack);
      res.status(500).send('Internal Server Error');
      return;
    }
  },
};

export default playerController;
