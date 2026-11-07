import type { UpdateGamePatch } from '#db/types.js';
import { gameService } from '#services/game.service.js';
import { type Request, type Response } from 'express';

const gameController = {
  async createGame(req: Request, res: Response) {
    const telegramId = Number(req.body?.telegramId);
    const result = await gameService.createDraftGame(telegramId);
    res.status(201).json(result);
  },

  async updateGame(req: Request, res: Response) {
    const gameId = Number(req.params.id);
    const body = req.body ?? {};
    const patch: UpdateGamePatch = {};
    if (body.venueId !== undefined) {
      patch.venueId = Number(body.venueId);
    }
    if (body.modeId !== undefined) {
      patch.modeId = Number(body.modeId);
    }
    if (body.isRecorded !== undefined) {
      patch.isRecorded = Boolean(body.isRecorded);
    }
    if (body.deleted !== undefined) {
      patch.deleted = Boolean(body.deleted);
    }
    const result = await gameService.updateGame(gameId, patch);
    res.status(200).json(result);
  },

  async getPlayersByGameId(req: Request, res: Response) {
    const gameId = Number(req.params.id);
    const players = await gameService.getPlayers(gameId);
    res.status(200).json(players);
  },

  async getRulesetInfoByGameId(req: Request, res: Response) {
    const gameId = Number(req.params.id);
    const ruleset = await gameService.getRuleset(gameId);
    if (ruleset === null) {
      res.sendStatus(204);
      return;
    }
    res.json(ruleset);
  },

  async getFinalScore(req: Request, res: Response) {
    const gameId = Number(req.params.id);
    const finalScore = await gameService.getFinalScore(gameId);
    if (finalScore === null) {
      res.sendStatus(204);
      return;
    }
    res.json(finalScore);
  },

  async getPenalties(req: Request, res: Response) {
    const gameId = Number(req.params.id);
    const penalties = await gameService.getPenalties(gameId);
    res.json(penalties);
  },

  async getHandCount(req: Request, res: Response) {
    const gameId = Number(req.params.id);
    const result = await gameService.getHandCount(gameId);
    res.json(result);
  },

  async getLastCompletedHand(req: Request, res: Response) {
    const gameId = Number(req.params.id);
    const hand = await gameService.getLastCompletedHand(gameId);
    if (hand === null) {
      res.sendStatus(204);
      return;
    }
    res.json(hand);
  },

  async getLastHandForNext(req: Request, res: Response) {
    const gameId = Number(req.params.id);
    const hand = await gameService.getLastHandForNext(gameId);
    if (hand === null) {
      res.sendStatus(204);
      return;
    }
    res.json(hand);
  },

  async getPlayerTelegramIds(req: Request, res: Response) {
    const gameId = Number(req.params.id);
    const ids = await gameService.getPlayerTelegramIds(gameId);
    res.json(ids);
  },

  async getVenueMode(req: Request, res: Response) {
    const gameId = Number(req.params.id);
    const venueMode = await gameService.getVenueMode(gameId);
    if (venueMode === null) {
      res.sendStatus(204);
      return;
    }
    res.json(venueMode);
  },

  async getModes(req: Request, res: Response) {
    const gameId = Number(req.params.id);
    const modes = await gameService.getModes(gameId);
    res.json(modes);
  },

  async lookupMode(req: Request, res: Response) {
    const gameId = Number(req.params.id);
    const name = String(req.query.name ?? '');
    const mode = await gameService.lookupMode(gameId, name);
    res.json(mode);
  },

  async getAvailableRulesets(req: Request, res: Response) {
    const gameId = Number(req.params.id);
    const rulesets = await gameService.getAvailableRulesets(gameId);
    res.json(rulesets);
  },
};

export default gameController;
