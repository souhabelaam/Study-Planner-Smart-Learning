import './loadEnv.js';
import bcrypt from 'bcryptjs';
import { connectDatabase, initSchema, queryOne, execute, query, getRoleId } from './db.js';

const DEFAULT_USERS = [
  {
    username: process.env.SEED_ADMIN_USERNAME || 'admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@studyplanner.local',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin123!',
    role: 'ADMIN'
  },
  {
    username: process.env.SEED_DEMO_USERNAME || 'demo',
    email: process.env.SEED_DEMO_EMAIL || 'demo@studyplanner.local',
    password: process.env.SEED_DEMO_PASSWORD || 'Demo123!',
    role: 'USER'
  }
];

const DEFAULT_ADS = [
  {
    title: 'Smart Lab Premium',
    description: 'Débloquez des analyses IA avancées et des quiz illimités.',
    link_url: '/lab',
    audience: 'STUDENT',
    active: 1
  },
  {
    title: 'Partenaire révision',
    description: '−20% sur les manuels partenaires — code STUDY20.',
    link_url: 'https://example.com',
    audience: 'STUDENT',
    active: 1
  }
];

async function insertUser(username, email, passwordHash) {
  const cols = (await query('SHOW COLUMNS FROM users')).map((c) => c.Field);
  const passwordCol = cols.includes('password') ? 'password' : cols.includes('password_hash') ? 'password_hash' : 'password';
  const fields = ['username', 'email', passwordCol];
  const values = [username, email, passwordHash];
  if (cols.includes('created_at')) {
    fields.push('created_at');
    values.push(new Date());
  }
  const placeholders = fields.map(() => '?').join(', ');
  return execute(
    `INSERT INTO users (${fields.join(', ')}) VALUES (${placeholders})`,
    values
  );
}

async function syncPassword(userId, passwordHash) {
  const cols = (await query('SHOW COLUMNS FROM users')).map((c) => c.Field);
  const passwordCol = cols.includes('password') ? 'password' : 'password_hash';
  await execute(`UPDATE users SET ${passwordCol} = ? WHERE id = ?`, [passwordHash, userId]);
}

async function ensureUserRole(userId, roleName) {
  const roleId = await getRoleId(roleName);
  if (!roleId) return;
  const link = await queryOne(
    'SELECT 1 AS ok FROM user_roles WHERE user_id = ? AND role_id = ?',
    [userId, roleId]
  );
  if (!link) {
    await execute('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, roleId]);
  }
}

export async function runSeed() {
  await initSchema();

  for (const u of DEFAULT_USERS) {
    const hash = bcrypt.hashSync(u.password, 10);
    const existing = await queryOne('SELECT id FROM users WHERE username = ?', [u.username]);

    if (existing) {
      await syncPassword(existing.id, hash);
      await ensureUserRole(existing.id, u.role);
      await execute(
        'INSERT INTO user_settings (user_id, daily_goal_minutes) VALUES (?, 60) ON DUPLICATE KEY UPDATE user_id = user_id',
        [existing.id]
      );
      console.log(`[seed] Synced user: ${u.username} (${u.role})`);
      continue;
    }

    const result = await insertUser(u.username, u.email, hash);
    const userId = result.insertId;
    await ensureUserRole(userId, u.role);
    await execute(
      'INSERT INTO user_settings (user_id, daily_goal_minutes) VALUES (?, 60) ON DUPLICATE KEY UPDATE user_id = user_id',
      [userId]
    );
    console.log(`[seed] Created user: ${u.username} (${u.role})`);
  }

  const adCount = (await queryOne('SELECT COUNT(*) AS c FROM advertisements'))?.c ?? 0;
  if (Number(adCount) === 0) {
    const adCols = (await query('SHOW COLUMNS FROM advertisements')).map((c) => c.Field);
    const withCreated = adCols.includes('created_at');
    for (const ad of DEFAULT_ADS) {
      if (withCreated) {
        await execute(
          `INSERT INTO advertisements (title, description, link_url, audience, active, created_at)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [ad.title, ad.description, ad.link_url, ad.audience, ad.active]
        );
      } else {
        await execute(
          `INSERT INTO advertisements (title, description, link_url, audience, active)
           VALUES (?, ?, ?, ?, ?)`,
          [ad.title, ad.description, ad.link_url, ad.audience, ad.active]
        );
      }
    }
    console.log('[seed] Inserted default advertisements');
  }
}

if (process.argv[1]?.endsWith('seed.js')) {
  await connectDatabase();
  await runSeed();
  console.log('[seed] Done.');
  process.exit(0);
}
