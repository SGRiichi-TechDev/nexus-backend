import { handService } from '#services/hand.service.js';
import { type Request, type Response } from 'express';

const handController = {
  async getPlayersInRiichi(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const result = await handService.getPlayersInRiichi(handId);
    res.json(result);
  },

  async getPlayersInTenpai(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const result = await handService.getPlayersInTenpai(handId);
    res.json(result);
  },

  async getPlayersThatChombo(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const result = await handService.getPlayersThatChombo(handId);
    res.json(result);
  },
};

export default handController;
