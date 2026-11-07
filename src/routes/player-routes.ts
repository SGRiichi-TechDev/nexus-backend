import playerController from '#controller/player-controller.js';
import express, { type Router } from 'express';

const router: Router = express.Router();

router.get('/', playerController.getAllPlayers);
router.get('/current-game', playerController.getCurrentGameForPlayer);
router.get('/by-telegram/:telegramId', playerController.getPlayerByTelegramId);
router.get('/search', playerController.searchPlayerByName);
router.get('/active-participation', playerController.getActiveParticipation);
router.get('/:id', playerController.getPlayerById);

export default router;
