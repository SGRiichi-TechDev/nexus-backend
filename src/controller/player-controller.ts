import { type Request, type Response } from 'express';
import { pool } from '../db/db.ts';

const playerController = {
  getAllPlayers: (req: Request, res: Response) => {
    pool.query('SELECT * FROM players', (err, result) => {
      if (err) {
        console.error('Error executing query', err.stack);
        res.status(500).send('Internal Server Error');
      } else {
        res.json(result.rows);
      }
    });
  },

  getPlayerById: (req: Request, res: Response) => {
    const { id } = req.params;
    pool.query('SELECT * FROM players WHERE pid = $1', [id], (err, result) => {
      if (err) {
        console.error('Error executing query', err.stack);
        res.status(500).send('Internal Server Error');
      } else {
        if (result.rows.length === 0) {
          res.status(404).send('Player not found');
        } else {
          res.json(result.rows[0]);
        }
      }
    });
  },
};

export default playerController;
