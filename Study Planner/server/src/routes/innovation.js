import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getStreaks,
  updateDailyGoal,
  getHeatmap,
  getBadges,
  buildWeeklyPlan,
  generateQuiz
} from '../lib/innovation.js';

const router = Router();
router.use(requireAuth);

router.get('/streaks', async (req, res) => {
  try {
    res.json(await getStreaks(req.user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load streaks' });
  }
});

router.put('/goal', async (req, res) => {
  try {
    res.json(await updateDailyGoal(req.user.id, req.body?.dailyGoalMinutes));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update goal' });
  }
});

router.get('/heatmap', async (req, res) => {
  try {
    res.json(await getHeatmap(req.user.id, req.query.weeks));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load heatmap' });
  }
});

router.get('/badges', async (req, res) => {
  try {
    res.json(await getBadges(req.user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load badges' });
  }
});

router.get('/weekly-plan', async (req, res) => {
  try {
    res.json(await buildWeeklyPlan(req.user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load weekly plan' });
  }
});

router.post('/quiz', async (req, res) => {
  try {
    const { subjectId, count } = req.body || {};
    res.json(await generateQuiz(req.user.id, subjectId, count));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

export default router;
