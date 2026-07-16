import { toHttpError } from '#errors/app-error.js';
import { gameService } from '#services/game.service.js';
import {
  type NextFunction,
  type Request,
  type Response,
} from 'express';

const gameController = {
  async getPlayersByGameId(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const gameId = Number(req.params.id);
      const players = await gameService.getPlayers(gameId);
      res.status(200).json(players);
    } catch (error) {
      next(
        toHttpError(error, {
          message: 'Internal server error',
          format: 'json',
        }),
      );
    }
  },

  async getRulesetInfoByGameId(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const gameId = Number(req.params.id);
      const ruleset = await gameService.getRuleset(gameId);
      res.json(ruleset);
    } catch (error) {
      next(
        toHttpError(error, {
          message: 'Internal server error',
          format: 'json',
        }),
      );
    }
  },
};

export default gameController;
