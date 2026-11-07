import referenceController from '#controller/reference-controller.js';
import express, { type Router } from 'express';

const router: Router = express.Router();

router.get('/score-lookup', referenceController.getScoreLookup);

export default router;
