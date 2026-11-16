import express, { type Router } from 'express';
import gameRouter from '#routes/game-routes.js';
import handRouter from '#routes/hand-routes.js';
import playerRouter from '#routes/player-routes.js';
import referenceRouter from '#routes/reference-routes.js';
import venueRouter from '#routes/venue-routes.js';

const router: Router = express.Router();

router.use('/players', playerRouter);
router.use('/games', gameRouter);
router.use('/hands', handRouter);
router.use('/venues', venueRouter);
router.use('/reference', referenceRouter);

export default router;
