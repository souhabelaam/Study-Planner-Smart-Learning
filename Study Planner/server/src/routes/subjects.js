import { Router } from 'express';
import { query, execute } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, name FROM subjects WHERE user_id = ? ORDER BY name',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load subjects' });
  }
});

router.post('/', async (req, res) => {
  try {
    const name = req.body?.name?.trim();
    if (!name) return res.status(400).json({ message: 'Name required' });
    const result = await execute('INSERT INTO subjects (user_id, name) VALUES (?, ?)', [
      req.user.id,
      name
    ]);
    res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create subject' });
  }
});

router.post('/bulk', async (req, res) => {
  try {
    const names = Array.isArray(req.body)
      ? req.body.map((n) => String(n || '').trim()).filter(Boolean)
      : [];
    const created = [];
    for (const name of names) {
      const result = await execute('INSERT INTO subjects (user_id, name) VALUES (?, ?)', [
        req.user.id,
        name
      ]);
      created.push({ id: result.insertId, name });
    }
    res.json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create subjects' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await execute('DELETE FROM subjects WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.id
    ]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete subject' });
  }
});

export default router;
