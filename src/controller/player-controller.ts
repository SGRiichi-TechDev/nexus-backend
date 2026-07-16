import { toHttpError } from '#errors/app-error.js';
import { playerService } from '#services/player.service.js';
import {
  type NextFunction,
  type Request,
  type Response,
} from 'express';

const playerController = {
  getAllPlayers: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const result = await playerService.list();
      res.json(result);
    } catch (error) {
      next(
        toHttpError(error, {
          message: 'Internal Server Error',
          format: 'text',
        }),
      );
    }
  },

  getPlayerById: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const player = await playerService.getById(Number(req.params.id));
      res.json(player);
    } catch (error) {
      next(
        toHttpError(error, {
          message: 'Internal Server Error',
          format: 'text',
        }),
      );
    }
  },

  getCurrentGameForPlayer: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const telegramId = Number(req.query.telegramId);
      const currentGame = await playerService.getCurrentGame(telegramId);
      res.json(currentGame);
    } catch (error) {
      next(
        toHttpError(error, {
          message: 'Internal Server Error',
          format: 'text',
        }),
      );
    }
  },
};

export default playerController;
