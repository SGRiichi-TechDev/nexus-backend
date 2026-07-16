import { playerService } from '#services/player.service.js';
import { type Request, type Response } from 'express';

const playerController = {
  getAllPlayers: async (req: Request, res: Response) => {
    const result = await playerService.list();
    res.json(result);
  },

  getPlayerById: async (req: Request, res: Response) => {
    const player = await playerService.getById(Number(req.params.id));
    res.json(player);
  },

  getCurrentGameForPlayer: async (req: Request, res: Response) => {
    const telegramId = Number(req.query.telegramId);
    const currentGame = await playerService.getCurrentGame(telegramId);
    res.json(currentGame);
  },
};

export default playerController;
