import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query, queryOne, execute, getRoleId, getUserRoles } from '../db.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const username = String(req.body?.username ?? '').trim();
    const password = req.body?.password ?? '';
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const user = await queryOne('SELECT * FROM users WHERE username = ?', [username]);
    const storedPassword = user?.password ?? user?.password_hash;
    const passwordOk =
      typeof storedPassword === 'string' &&
      storedPassword.length > 0 &&
      bcrypt.compareSync(password, storedPassword);

    if (!user || !passwordOk) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    let roles = await getUserRoles(user.id);
    if (!roles.length) {
      const roleId = await getRoleId('USER');
      if (roleId) {
        await execute('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [
          user.id,
          roleId
        ]);
        roles = await getUserRoles(user.id);
      }
    }
    const token = signToken({ id: user.id, username: user.username, roles });
    res.json({ token, username: user.username, roles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).send('Champs invalides');
    }

    const exists = await queryOne('SELECT 1 AS ok FROM users WHERE username = ? OR email = ?', [
      username,
      email
    ]);
    if (exists) {
      return res.status(409).send('Username or email already exists.');
    }

    const hash = bcrypt.hashSync(password, 10);
    const cols = (await query('SHOW COLUMNS FROM users')).map((c) => c.Field);
    const passwordCol = cols.includes('password') ? 'password' : 'password_hash';
    const fields = ['username', 'email', passwordCol];
    const values = [username.trim(), email.trim(), hash];
    if (cols.includes('created_at')) {
      fields.push('created_at');
      values.push(new Date());
    }
    const result = await execute(
      `INSERT INTO users (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`,
      values
    );
    const userId = result.insertId;
    const roleId = await getRoleId('USER');
    if (roleId) {
      await execute('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, roleId]);
    }
    await execute('INSERT INTO user_settings (user_id, daily_goal_minutes) VALUES (?, 60)', [userId]);

    res.status(200).send('Utilisateur créé avec succès');
  } catch (err) {
    console.error(err);
    res.status(500).send('Registration failed');
  }
});

export default router;
