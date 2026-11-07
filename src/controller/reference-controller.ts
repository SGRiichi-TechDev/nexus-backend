import { referenceService } from '#services/reference.service.js';
import { type Request, type Response } from 'express';

const referenceController = {
  async getScoreLookup(_req: Request, res: Response) {
    const rows = await referenceService.getScoreLookup();
    res.json(rows);
  },
};

export default referenceController;
