import venueController from '#controller/venue-controller.js';
import express, { type Router } from 'express';

const router: Router = express.Router();

router.get('/', venueController.listActive);
router.get('/lookup', venueController.lookupByName);

export default router;
