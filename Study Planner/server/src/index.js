import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import { loadedEnvPath } from './loadEnv.js';

import { connectDatabase } from './db.js';
import { runSeed } from './seed.js';

import authRoutes from './routes/auth.js';
import subjectsRoutes from './routes/subjects.js';
import sessionsRoutes from './routes/sessions.js';
import statsRoutes from './routes/stats.js';
import innovationRoutes from './routes/innovation.js';
import notesRoutes from './routes/notes.js';
import adsRoutes from './routes/ads.js';
import gameRoutes from './routes/game.js';
import adminRoutes from './routes/admin.js';
import chatRoutes from './routes/chat.js';

const port = Number(process.env.SERVER_PORT) || 8085;
const seedEnabled = process.env.APP_SEED_ENABLED !== 'false';

try {
  await connectDatabase();
  if (loadedEnvPath) {
    console.log(`Loaded .env from ${loadedEnvPath}`);
  } else {
    console.warn('No .env file found — using defaults / system environment variables');
  }
  console.log(
    `MySQL connected → ${process.env.MYSQL_HOST || '127.0.0.1'}:${process.env.MYSQL_PORT || 3306}/${process.env.MYSQL_DATABASE || 'studyplanner'}`
  );

  if (seedEnabled) {
    await runSeed();
  }
} catch (err) {
  console.error('Startup failed:', err.message);
  if (err.sql) console.error('SQL:', err.sql);
  console.error('Check MYSQL_* in .env (project root) and that MySQL is running.');
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', backend: 'express', database: 'mysql' });
});

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/innovation', innovationRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Study Planner API (Express + MySQL) → http://localhost:${port}`);
  console.log(`Seed: ${seedEnabled ? 'enabled' : 'disabled'}`);
});
