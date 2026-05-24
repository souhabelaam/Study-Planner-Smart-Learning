import { Router } from 'express';
import { query, queryOne, formatDate } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { analyzeSessions, getSessionsForUser } from '../lib/productivity.js';

const router = Router();
router.use(requireAuth);

async function dailyTotals(userId, days) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  const rows = await query(
    `SELECT date, SUM(duration_minutes) AS total
     FROM study_sessions
     WHERE user_id = ? AND date BETWEEN ? AND ?
     GROUP BY date`,
    [userId, startStr, endStr]
  );

  const map = Object.fromEntries(rows.map((r) => [formatDate(r.date), Number(r.total)]));
  const ordered = {};
  let cur = startStr;
  while (cur <= endStr) {
    ordered[cur] = map[cur] || 0;
    cur = new Date(new Date(cur + 'T12:00:00').getTime() + 86400000).toISOString().slice(0, 10);
  }
  return ordered;
}

async function weeklyTotals(userId, weeks) {
  const sessions = await getSessionsForUser(userId);
  const totals = {};
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (weeks - 1) * 7);

  for (const s of sessions) {
    const d = new Date(formatDate(s.date) + 'T12:00:00');
    if (d < start) continue;
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
    const key = `${d.getFullYear()}-W${week}`;
    totals[key] = (totals[key] || 0) + s.duration_minutes;
  }

  return Object.fromEntries(Object.keys(totals).sort().map((k) => [k, totals[k]]));
}

router.get('/overview', async (req, res) => {
  try {
    const sessions = await getSessionsForUser(req.user.id);
    const report = analyzeSessions(sessions);
    const subjectCount =
      (await queryOne('SELECT COUNT(*) AS c FROM subjects WHERE user_id = ?', [req.user.id]))?.c ?? 0;
    const sessionCount = sessions.length;

    res.json({
      subjectCount: Number(subjectCount),
      sessionCount,
      productivityScore: report.productivityScore,
      consistencyScore: report.consistencyScore,
      mostActiveHour: report.mostActiveHour,
      suggestions: report.suggestions,
      dailyStats: await dailyTotals(req.user.id, 7)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load overview' });
  }
});

router.get('/daily', async (req, res) => {
  try {
    res.json(await dailyTotals(req.user.id, 14));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load daily stats' });
  }
});

router.get('/weekly', async (req, res) => {
  try {
    res.json(await weeklyTotals(req.user.id, 8));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load weekly stats' });
  }
});

router.get('/ai-report', async (req, res) => {
  try {
    const sessions = await getSessionsForUser(req.user.id);
    res.json(analyzeSessions(sessions));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load report' });
  }
});

export default router;
