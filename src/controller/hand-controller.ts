import type { Wind } from '#db/types.js';
import { handService } from '#services/hand.service.js';
import { type Request, type Response } from 'express';

const handController = {
  async createNextHand(req: Request, res: Response) {
    const previousHandId = Number(req.params.id);
    const roundNum = Number(req.body?.roundNum);
    const honba = Number(req.body?.honba);
    const result = await handService.createNextHand(previousHandId, {
      wind: String(req.body?.wind ?? '') as Wind,
      roundNum,
      honba,
    });
    res.status(201).json(result);
  },

  async getHandDetails(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const result = await handService.getHandDetails(handId);
    res.json(result);
  },

  async getPlayersInRiichi(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const result = await handService.getPlayersInRiichi(handId);
    res.json(result);
  },

  async getPlayersInTenpai(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const result = await handService.getPlayersInTenpai(handId);
    res.json(result);
  },

  async getPlayersThatChombo(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const result = await handService.getPlayersThatChombo(handId);
    res.json(result);
  },

  async hasPlayerOutcome(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const playerId = Number(req.params.playerId);
    const result = await handService.hasPlayerOutcome(handId, playerId);
    res.json(result);
  },

  async getScoreCalcInput(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const result = await handService.getScoreCalcInput(handId);
    res.json(result);
  },

  // TODO(multiple-ron): Temporarily disabled for Akako. Revisit once multiple-ron
  // branch detection is modeled without hand_info.is_multiple_ron / main_hid.
  async getMultipleRonStatus(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const result = await handService.getMultipleRonStatus(handId);
    res.json(result);
  },

  async replaceRiichi(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const result = await handService.replaceRiichi(
      handId,
      req.body?.playerIds,
    );
    res.status(200).json(result);
  },

  async applyRiichi(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const result = await handService.applyRiichi(handId, req.body?.playerIds);
    res.status(200).json(result);
  },

  async resetRiichi(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const result = await handService.resetRiichi(handId);
    res.status(200).json(result);
  },

  async setHandOutcome(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const result = await handService.setHandOutcome(
      handId,
      String(req.body?.outcome ?? ''),
    );
    res.status(200).json(result);
  },

  async setPlayerOutcome(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const playerId = Number(req.params.playerId);
    const result = await handService.setPlayerOutcome(
      handId,
      playerId,
      String(req.body?.outcome ?? ''),
    );
    res.status(200).json(result);
  },

  async setDealIn(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const playerId = Number(req.params.playerId);
    const result = await handService.setDealIn(handId, playerId);
    res.status(200).json(result);
  },

  async setHan(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const han = Number(req.body?.han);
    const result = await handService.setHan(handId, han);
    res.status(200).json(result);
  },

  async setFu(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const fu = Number(req.body?.fu);
    const result = await handService.setFu(handId, fu);
    res.status(200).json(result);
  },

  async replaceTenpai(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const result = await handService.replaceTenpai(
      handId,
      req.body?.playerIds,
    );
    res.status(200).json(result);
  },

  async setDrawPayments(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const result = await handService.setDrawPayments(
      handId,
      req.body?.payments,
    );
    res.status(200).json(result);
  },

  async replaceChombo(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const result = await handService.replaceChombo(
      handId,
      req.body?.playerIds,
    );
    res.status(200).json(result);
  },

  async applyChombo(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const result = await handService.applyChombo(
      handId,
      req.body?.playerIds,
    );
    res.status(200).json(result);
  },

  async applyScoreChanges(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const rawWinnerHandValue = req.body?.winnerHandValue;
    const winnerHandValue =
      rawWinnerHandValue !== null && rawWinnerHandValue !== undefined
        ? Number(rawWinnerHandValue)
        : null;
    const result = await handService.applyScoreChanges(
      handId,
      req.body?.updates,
      winnerHandValue,
    );
    res.status(200).json(result);
  },

  async confirmHand(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const result = await handService.confirmHand(handId);
    res.status(200).json(result);
  },

  async createHandWin(req: Request, res: Response) {
    const handId = Number(req.params.id);
    const winnerPlayerId = Number(req.body?.winnerPlayerId);
    const result = await handService.createHandWin(handId, winnerPlayerId);
    res.status(201).json(result);
  },
};

export default handController;
