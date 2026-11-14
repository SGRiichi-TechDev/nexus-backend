import gameController from '#controller/game-controller.js';
import express, { type Router } from 'express';

const router: Router = express.Router();

router.post('/', gameController.createGame);
router.patch('/:id', gameController.updateGame);

router.post('/:id/players', gameController.addGamePlayer);
router.put('/:id/players/:playerId/penalty', gameController.setPlayerPenalty);
router.post('/:id/hands', gameController.createFirstHand);
router.get('/:id/players', gameController.getPlayersByGameId);
router.put('/:id/seats/:seat/final-score', gameController.setSeatFinalScore);
router.post('/:id/positions/recompute', gameController.recomputeFinalPositions);
router.post('/:id/complete', gameController.completeGame);
router.get('/:id/ruleset', gameController.getRulesetInfoByGameId);
router.patch('/:id/ruleset', gameController.updateRuleset);
router.put('/:id/ruleset', gameController.applyRuleset);
router.get('/:id/final-score', gameController.getFinalScore);
router.get('/:id/penalties', gameController.getPenalties);
router.get('/:id/hands/count', gameController.getHandCount);
router.get('/:id/hands/last-completed', gameController.getLastCompletedHand);
router.get('/:id/hands/last-for-next', gameController.getLastHandForNext);
router.get('/:id/player-telegram-ids', gameController.getPlayerTelegramIds);
router.get('/:id/venue-mode', gameController.getVenueMode);
router.get('/:id/modes/lookup', gameController.lookupMode);
router.get('/:id/modes', gameController.getModes);
router.get('/:id/available-rulesets', gameController.getAvailableRulesets);

export default router;
