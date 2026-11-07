import { handService } from '#services/hand.service.js';
import { type Request, type Response } from 'express';

const handController = {
  async getHandDetails(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const result = await handService.getHandDetails(handId);
    res.json(result);
  },

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

  async hasPlayerOutcome(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const playerId = Number(req.params.playerId);
    const result = await handService.hasPlayerOutcome(handId, playerId);
    res.json(result);
  },

  async getScoreCalcInput(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const result = await handService.getScoreCalcInput(handId);
    res.json(result);
  },

  // TODO(multiple-ron): Temporarily disabled for Akako. Revisit once multiple-ron
  // branch detection is modeled without hand_info.is_multiple_ron / main_hid.
  async getMultipleRonStatus(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const result = await handService.getMultipleRonStatus(handId);
    res.json(result);
  },
};

export default handController;
