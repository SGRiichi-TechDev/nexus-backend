import { venueService } from '#services/venue.service.js';
import { type Request, type Response } from 'express';

const venueController = {
  async listActive(req: Request, res: Response) {
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
