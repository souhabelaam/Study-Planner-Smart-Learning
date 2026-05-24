import { Router } from 'express';
import { query, queryOne, execute, formatDate } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function mapSession(row) {
  return {
    id: row.id,
    subjectId: row.subject_id,
    subjectName: row.subject_name || 'Unknown subject',
    durationMinutes: row.duration_minutes,
    date: formatDate(row.date),
    startHour: row.start_hour,
    startMinute: row.start_minute
  };
}

router.get('/', async (req, res) => {
  try {
    const rows = await query(
      `SELECT s.*, sub.name AS subject_name
       FROM study_sessions s
       LEFT JOIN subjects sub ON sub.id = s.subject_id
       WHERE s.user_id = ?
       ORDER BY s.date DESC, s.id DESC`,
      [req.user.id]
    );
    res.json(rows.map(mapSession));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load sessions' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { subjectId, durationMinutes, date, startHour, startMinute } = req.body || {};
    const subject = await queryOne('SELECT * FROM subjects WHERE id = ? AND user_id = ?', [
      subjectId,
      req.user.id
    ]);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    const result = await execute(
      `INSERT INTO study_sessions (user_id, subject_id, duration_minutes, date, start_hour, start_minute)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        subjectId,
        Number(durationMinutes) || 0,
        date || new Date().toISOString().slice(0, 10),
        startHour ?? null,
        startMinute ?? null
      ]
    );

    const row = await queryOne(
      `SELECT s.*, sub.name AS subject_name FROM study_sessions s
       LEFT JOIN subjects sub ON sub.id = s.subject_id WHERE s.id = ?`,
      [result.insertId]
    );
    res.status(201).json(mapSession(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create session' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await execute('DELETE FROM study_sessions WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.id
    ]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete session' });
  }
});

export default router;
