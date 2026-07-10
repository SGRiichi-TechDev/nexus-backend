import express, { type Router, type Request, type Response } from 'express';
import playerController from '../controller/player-controller.ts';

const router: Router = express.Router();

// Basic GET route
router.get('/players', playerController.getAllPlayers);
router.get('/players/:id', playerController.getPlayerById);

export default router;
