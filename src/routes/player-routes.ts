import playerController from '#controller/player-controller.ts';
import express, { type Router } from 'express';

const router: Router = express.Router();

// Basic GET route
router.get('/players', playerController.getAllPlayers);
router.get('/players/:id', playerController.getPlayerById);

export default router;
