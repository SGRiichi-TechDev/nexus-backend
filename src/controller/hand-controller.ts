import { toHttpError } from '#errors/app-error.js';
import { handService } from '#services/hand.service.js';
import {
  type NextFunction,
  type Request,
  type Response,
} from 'express';

const handController = {
  async getPlayersInRiichi(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const handId = Number(req.params.id);
      const result = await handService.getPlayersInRiichi(handId);
      res.json(result);
    } catch (error) {
      next(
        toHttpError(error, {
          message: 'Internal Server Error',
          format: 'json',
        }),
      );
    }
  },

  async getPlayersInTenpai(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const handId = Number(req.params.id);
      const result = await handService.getPlayersInTenpai(handId);
      res.json(result);
    } catch (error) {
      next(
        toHttpError(error, {
          message: 'Internal Server Error',
          format: 'json',
        }),
      );
    }
  },

  async getPlayersThatChombo(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const handId = Number(req.params.id);
      const result = await handService.getPlayersThatChombo(handId);
      res.json(result);
    } catch (error) {
      next(
        toHttpError(error, {
          message: 'Internal Server Error',
          format: 'json',
        }),
      );
    }
  },
};

export default handController;
