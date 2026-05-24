import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

function mapAd(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    linkUrl: row.link_url,
    imageUrl: row.image_url,
    audience: row.audience,
    active: !!row.active
  };
}

router.get('/active', async (_req, res) => {
  try {
    const rows = await query(
      `SELECT * FROM advertisements WHERE active = 1 AND audience = 'STUDENT' ORDER BY id`
    );
    res.json(rows.map(mapAd));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load ads' });
  }
});

export default router;
