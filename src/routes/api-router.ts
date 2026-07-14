import gameRouter from '#routes/game-routes.js';
import playerRouter from '#routes/player-routes.js';
import express, { Router } from 'express';

const router: Router = express.Router();

router.use('/players', playerRouter);
router.use('/games', gameRouter);

export default router;
