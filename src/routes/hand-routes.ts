import handController from '#controller/hand-controller.js';
import express, { Router } from 'express';

const router: Router = express.Router();

router.get('/:id/players-in-riichi', handController.getPlayersInRiichi);

export default router;
