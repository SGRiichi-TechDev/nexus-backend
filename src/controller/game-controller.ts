import { gameService } from '#services/game.service.js';
import { type Request, type Response } from 'express';

const gameController = {
  async getPlayersByGameId(req: Request, res: Response) {
    const gameId = Number(req.params.id);
    const players = await gameService.getPlayers(gameId);
    res.status(200).json(players);
  },

  async getRulesetInfoByGameId(req: Request, res: Response) {
    const gameId = Number(req.params.id);
    const ruleset = await gameService.getRuleset(gameId);
    res.json(ruleset);
  },
};

export default gameController;
