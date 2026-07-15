import gameRouter from '#routes/game-routes.js';
import handRouter from '#routes/hand-routes.js';
import playerRouter from '#routes/player-routes.js';
import express, { Router } from 'express';

const router: Router = express.Router();

router.use('/players', playerRouter);
router.use('/games', gameRouter);
router.use('/hands', handRouter);

export default router;
