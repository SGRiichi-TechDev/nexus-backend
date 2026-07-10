import playerController from '#controller/player-controller.ts';
import express, { type Router } from 'express';

const router: Router = express.Router();

router.get('/', playerController.getAllPlayers);
router.get('/:id', playerController.getPlayerById);

export default router;
