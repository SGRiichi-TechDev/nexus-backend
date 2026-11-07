import { playerService } from '#services/player.service.js';
import { type Request, type Response } from 'express';

const playerController = {
  getAllPlayers: async (req: Request, res: Response) => {
    const result = await playerService.list();
    res.json(result);
  },

  getPlayerById: async (req: Request, res: Response) => {
    const registeredOnly = req.query.registeredOnly === 'true';
    const player = await playerService.getById(
      Number(req.params.id),
      registeredOnly,
    );
    res.json(player);
  },

  getPlayerByTelegramId: async (req: Request, res: Response) => {
    const player = await playerService.getByTelegramId(
      Number(req.params.telegramId),
    );
    res.json(player);
  },

  searchPlayerByName: async (req: Request, res: Response) => {
    const name = String(req.query.name ?? '');
    const player = await playerService.searchByName(name);
    res.json(player);
  },

  getCurrentGameForPlayer: async (req: Request, res: Response) => {
    const telegramId = Number(req.query.telegramId);
    const currentGame = await playerService.getCurrentGame(telegramId);
    if (currentGame === null) {
      res.sendStatus(204);
      return;
    }
    res.json(currentGame);
  },

  getActiveParticipation: async (req: Request, res: Response) => {
    const telegramId = Number(req.query.telegramId);
    const participation =
      await playerService.getActiveParticipation(telegramId);
    res.json(participation);
  },
};

export default playerController;
