import { referenceService } from '#services/reference.service.js';
import { type Request, type Response } from 'express';

const referenceController = {
  async getScoreLookup(_req: Request, res: Response) {
    const rows = await referenceService.getScoreLookup();
    res.json(rows);
  },

  async getLocalText(req: Request, res: Response) {
    const key = String(req.params.key ?? '');
    const result = await referenceService.getLocalText(key);
    res.json(result);
  },
};

export default referenceController;
