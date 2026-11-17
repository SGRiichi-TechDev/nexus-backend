import type { Request, Response } from 'express';
import { venueService } from '#services/venue.service.js';

const venueController = {
  async listActive(_req: Request, res: Response) {
    const venues = await venueService.listActive();
    res.json(venues);
  },

  async lookupByName(req: Request, res: Response) {
    const name = String(req.query.name ?? '');
    const venue = await venueService.lookupByName(name);
    res.json(venue);
  },
};

export default venueController;
