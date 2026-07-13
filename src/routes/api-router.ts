import gameRouter from '#routes/game-routes.ts';
import playerRouter from '#routes/player-routes.ts';
import express, { Router } from 'express';

const router: Router = express.Router();

router.use('/players', playerRouter);
router.use('/games', gameRouter);

export default router;
