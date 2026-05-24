import { Router } from 'express';
import { query, queryOne, execute, getRoleId } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('ADMIN'));

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

router.get('/overview', async (_req, res) => {
  try {
    const totalUsers = (await queryOne('SELECT COUNT(*) AS c FROM users'))?.c ?? 0;
    const totalStudents =
      (
        await queryOne(
          `SELECT COUNT(DISTINCT ur.user_id) AS c FROM user_roles ur
           JOIN roles r ON r.id = ur.role_id WHERE r.name = 'USER'`
        )
      )?.c ?? 0;
    const totalSessions = (await queryOne('SELECT COUNT(*) AS c FROM study_sessions'))?.c ?? 0;
    const activeAds =
      (await queryOne('SELECT COUNT(*) AS c FROM advertisements WHERE active = 1'))?.c ?? 0;
    const avg = (await queryOne('SELECT AVG(grade) AS a FROM student_notes WHERE grade IS NOT NULL'))
      ?.a;

    res.json({
      totalUsers: Number(totalUsers),
      totalStudents: Number(totalStudents),
      totalSessions: Number(totalSessions),
      activeAds: Number(activeAds),
      averageGrade: avg ? Math.round(Number(avg) * 100) / 100 : 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load overview' });
  }
});

router.get('/users', async (_req, res) => {
  try {
    const users = await query('SELECT id, username, email FROM users ORDER BY username');
    const result = [];
    for (const u of users) {
      const roles = (
        await query(
          `SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ?`,
          [u.id]
        )
      ).map((r) => r.name);
      const sessionCount =
        (await queryOne('SELECT COUNT(*) AS c FROM study_sessions WHERE user_id = ?', [u.id]))?.c ?? 0;
      const noteCount =
        (await queryOne('SELECT COUNT(*) AS c FROM student_notes WHERE user_id = ?', [u.id]))?.c ?? 0;
      result.push({
        id: u.id,
        username: u.username,
        email: u.email,
        roles,
        sessionCount: Number(sessionCount),
        noteCount: Number(noteCount)
      });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load users' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { username, email, roles } = req.body || {};
    if (!username?.trim() || !email?.trim()) {
      return res.status(400).json({ message: 'Username and email are required' });
    }

    // Check uniqueness
    const duplicate = await queryOne(
      'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
      [username.trim(), email.trim(), userId]
    );
    if (duplicate) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    await execute(
      'UPDATE users SET username = ?, email = ? WHERE id = ?',
      [username.trim(), email.trim(), userId]
    );

    if (roles && Array.isArray(roles) && roles.length > 0) {
      if (userId === req.user.id && !roles.includes('ADMIN')) {
        return res.status(400).json({ message: 'Cannot revoke your own ADMIN role' });
      }

      await execute('DELETE FROM user_roles WHERE user_id = ?', [userId]);
      for (const rName of roles) {
        const rId = await getRoleId(rName);
        if (rId) {
          await execute('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, rId]);
        }
      }
    }

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own admin account' });
    }

    const result = await execute('DELETE FROM users WHERE id = ?', [userId]);
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

router.get('/ads', async (_req, res) => {
  try {
    const rows = await query('SELECT * FROM advertisements ORDER BY id DESC');
    res.json(rows.map(mapAd));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load ads' });
  }
});

router.post('/ads', async (req, res) => {
  try {
    const { title, description, linkUrl, imageUrl, audience, active } = req.body || {};
    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ message: 'Title and description required' });
    }
    const result = await execute(
      `INSERT INTO advertisements (title, description, link_url, image_url, audience, active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        description.trim(),
        linkUrl || null,
        imageUrl || null,
        audience || 'STUDENT',
        active === false ? 0 : 1
      ]
    );
    const row = await queryOne('SELECT * FROM advertisements WHERE id = ?', [result.insertId]);
    res.status(201).json(mapAd(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create ad' });
  }
});

router.put('/ads/:id', async (req, res) => {
  try {
    const row = await queryOne('SELECT * FROM advertisements WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Not found' });

    const { title, description, linkUrl, imageUrl, audience, active } = req.body || {};
    await execute(
      `UPDATE advertisements SET title = ?, description = ?, link_url = ?, image_url = ?,
       audience = ?, active = ? WHERE id = ?`,
      [
        title?.trim() || row.title,
        description?.trim() || row.description,
        linkUrl ?? row.link_url,
        imageUrl ?? row.image_url,
        audience || row.audience,
        active === false ? 0 : active === true ? 1 : row.active,
        req.params.id
      ]
    );
    res.json(mapAd(await queryOne('SELECT * FROM advertisements WHERE id = ?', [req.params.id])));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update ad' });
  }
});

router.delete('/ads/:id', async (req, res) => {
  try {
    const result = await execute('DELETE FROM advertisements WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete ad' });
  }
});

export default router;
