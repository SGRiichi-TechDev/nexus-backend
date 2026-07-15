import gameController from '#controller/game-controller.js';
import express, { type Router } from 'express';

const router: Router = express.Router();

router.get('/:id/players', gameController.getPlayersByGameId);
router.get('/:id/ruleset', gameController.getRulesetInfoByGameId);

export default router;
