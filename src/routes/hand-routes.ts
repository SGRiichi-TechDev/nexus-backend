import handController from '#controller/hand-controller.js';
import express, { Router } from 'express';

const router: Router = express.Router();

router.post('/:id/next', handController.createNextHand);
router.post('/:id/confirm', handController.confirmHand);
router.post('/:id/wins', handController.createHandWin);
router.put('/:id/riichi', handController.replaceRiichi);
router.post('/:id/riichi/apply', handController.applyRiichi);
router.post('/:id/riichi/reset', handController.resetRiichi);
router.patch('/:id/outcome', handController.setHandOutcome);
router.patch('/:id/players/:playerId', handController.setPlayerOutcome);
router.post(
  '/:id/players/:playerId/deal-in',
  handController.setDealIn,
);
router.patch('/:id/han', handController.setHan);
router.patch('/:id/fu', handController.setFu);
router.put('/:id/tenpai', handController.replaceTenpai);
router.put('/:id/draw-payments', handController.setDrawPayments);
router.put('/:id/chombo', handController.replaceChombo);
router.post('/:id/chombo/apply', handController.applyChombo);
router.post('/:id/score-changes', handController.applyScoreChanges);
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
