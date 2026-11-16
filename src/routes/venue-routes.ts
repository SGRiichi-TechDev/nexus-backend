import express, { type Router } from 'express';
import venueController from '#controller/venue-controller.js';

const router: Router = express.Router();

router.get('/', venueController.listActive);
router.get('/lookup', venueController.lookupByName);

export default router;
