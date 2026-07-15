import handController from '#controller/hand-controller.js';
import express, { Router } from 'express';

const router: Router = express.Router();

router.get('/:id/players-in-riichi', handController.getPlayersInRiichi);
router.get('/:id/players-in-tenpai', handController.getPlayersInTenpai);
router.get('/:id/players-that-chombo', handController.getPlayersThatChombo);

export default router;
