import { Router } from 'express';
import { query, queryOne, execute, formatDateTime } from '../db.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';

const router = Router();

function mapScore(row) {
  return {
    id: row.id,
    username: row.username,
    score: row.score,
    moves: row.moves,
    durationSeconds: row.duration_seconds,
    playedAt: formatDateTime(row.played_at)
  };
}

router.get('/leaderboard', optionalAuth, async (_req, res) => {
  try {
    const rows = await query(
      `SELECT g.*, u.username FROM game_scores g
       JOIN users u ON u.id = g.user_id
       ORDER BY g.score DESC, g.played_at ASC LIMIT 10`
    );
    res.json(rows.map(mapScore));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load leaderboard' });
  }
});

router.get('/my-best', requireAuth, requireRole('USER'), async (req, res) => {
  try {
    const row = await queryOne(
      `SELECT g.*, u.username FROM game_scores g
       JOIN users u ON u.id = g.user_id
       WHERE g.user_id = ?
       ORDER BY g.score DESC LIMIT 1`,
      [req.user.id]
    );
    if (!row) return res.status(204).send();
    res.json(mapScore(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load best score' });
  }
});

router.post('/score', requireAuth, requireRole('USER'), async (req, res) => {
  try {
    const { score, moves, durationSeconds } = req.body || {};
    const result = await execute(
      `INSERT INTO game_scores (user_id, score, moves, duration_seconds) VALUES (?, ?, ?, ?)`,
      [req.user.id, Number(score) || 0, Number(moves) || 0, Number(durationSeconds) || 0]
    );

    const row = await queryOne(
      `SELECT g.*, u.username FROM game_scores g
       JOIN users u ON u.id = g.user_id WHERE g.id = ?`,
      [result.insertId]
    );
    res.status(201).json(mapScore(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save score' });
  }
});

export default router;
