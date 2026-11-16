import express, { type Router } from 'express';
import referenceController from '#controller/reference-controller.js';

const router: Router = express.Router();

router.get('/score-lookup', referenceController.getScoreLookup);
router.get('/local-text/:key', referenceController.getLocalText);

export default router;
