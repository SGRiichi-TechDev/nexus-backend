import gameController from '#controller/game-controller.js';
import express, { type Router } from 'express';

const router: Router = express.Router();

router.post('/', gameController.createGame);
router.patch('/:id', gameController.updateGame);

router.get('/:id/players', gameController.getPlayersByGameId);
router.get('/:id/ruleset', gameController.getRulesetInfoByGameId);
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
