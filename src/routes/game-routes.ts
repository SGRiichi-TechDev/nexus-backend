import express, { type Router } from 'express';
import gameController from '#controller/game-controller.ts';

const router: Router = express.Router();

router.get('/:id/players', gameController.getPlayersByGameId);

export default router;
