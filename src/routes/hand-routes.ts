import handController from '#controller/hand-controller.js';
import express, { Router } from 'express';

const router: Router = express.Router();

router.get('/:id', handController.getHandDetails);
router.get('/:id/players-in-riichi', handController.getPlayersInRiichi);
router.get('/:id/players-in-tenpai', handController.getPlayersInTenpai);
router.get('/:id/players-that-chombo', handController.getPlayersThatChombo);
router.get(
  '/:id/players/:playerId/has-outcome',
  handController.hasPlayerOutcome,
);
router.get('/:id/score-input', handController.getScoreCalcInput);
router.get('/:id/multiple-ron-status', handController.getMultipleRonStatus);

export default router;
