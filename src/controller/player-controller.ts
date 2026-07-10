import { type Request, type Response } from 'express';
import { pool } from '../db/db.ts';

const playerController = {
  getAllPlayers: async (req: Request, res: Response) => {
    try {
      const result = await pool.query('SELECT * FROM players');
      res.json(result.rows);
    } catch (err) {
      console.error('Error executing query', (err as Error).stack);
      res.status(500).send('Internal Server Error');
    }
  },

  getPlayerById: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const result = await pool.query('SELECT * FROM players WHERE pid = $1', [
        id,
      ]);
      if (result.rows.length === 0) {
        res.status(404).send('Player not found');
      } else {
        res.json(result.rows[0]);
      }
    } catch (err) {
      console.error('Error executing query', (err as Error).stack);
      res.status(500).send('Internal Server Error');
    }
  },
};

export default playerController;
