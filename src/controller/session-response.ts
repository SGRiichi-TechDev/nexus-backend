import type { Request, Response } from 'express';
import type { SessionGameDto } from '#db/types.js';

/**
 * Sends a write response. When the caller opts in with `?include=session`,
 * the body also carries the post-write `session` (SessionGameDto, or null once
 * the game is completed/deleted) so clients can refresh their cached session
 * without a follow-up GET /players/current-game. Otherwise the body is unchanged.
 */
export const sendWithSession = async (
  req: Request,
  res: Response,
  status: number,
  body: object,
  loadSession: () => Promise<SessionGameDto | null>,
): Promise<void> => {
  if (req.query?.include !== 'session') {
    res.status(status).json(body);
    return;
  }
  const session = await loadSession();
  res.status(status).json({ ...body, session });
};
