import playerRouter from '#routes/player-routes.ts';
import express, { Router } from 'express';

const router: Router = express.Router();

router.use('/players', playerRouter);

export default router;
