import { Router } from 'express';
import { query, queryOne, execute, formatDateTime } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('USER'));

function mapNote(row) {
  return {
    id: row.id,
    subjectId: row.subject_id,
    subjectName: row.subject_name || null,
    title: row.title,
    content: row.content,
    grade: row.grade != null ? Number(row.grade) : null,
    createdAt: formatDateTime(row.created_at),
    updatedAt: formatDateTime(row.updated_at)
  };
}

router.get('/', async (req, res) => {
  try {
    const rows = await query(
      `SELECT n.*, s.name AS subject_name FROM student_notes n
       LEFT JOIN subjects s ON s.id = n.subject_id
       WHERE n.user_id = ? ORDER BY n.updated_at DESC`,
      [req.user.id]
    );
    res.json(rows.map(mapNote));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load notes' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, content, subjectId, grade } = req.body || {};
    if (!title?.trim()) return res.status(400).json({ message: 'Title required' });

    let parsedSubjectId = null;
    if (subjectId && !isNaN(Number(subjectId))) {
      parsedSubjectId = Number(subjectId);
    }

    if (parsedSubjectId) {
      const sub = await queryOne('SELECT 1 AS ok FROM subjects WHERE id = ? AND user_id = ?', [
        parsedSubjectId,
        req.user.id
      ]);
      if (!sub) return res.status(404).json({ message: 'Subject not found' });
    }

    let parsedGrade = null;
    if (grade !== undefined && grade !== null && String(grade).trim() !== '') {
      const num = Number(grade);
      if (!isNaN(num)) {
        parsedGrade = num;
      }
    }

    const result = await execute(
      `INSERT INTO student_notes (user_id, subject_id, title, content, grade)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, parsedSubjectId, title.trim(), content || null, parsedGrade]
    );

    const row = await queryOne(
      `SELECT n.*, s.name AS subject_name FROM student_notes n
       LEFT JOIN subjects s ON s.id = n.subject_id WHERE n.id = ?`,
      [result.insertId]
    );
    res.status(201).json(mapNote(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create note' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await queryOne('SELECT * FROM student_notes WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.id
    ]);
    if (!existing) return res.status(404).json({ message: 'Not found' });

    const { title, content, subjectId, grade } = req.body || {};

    let parsedSubjectId = existing.subject_id;
    if (subjectId !== undefined) {
      if (subjectId && !isNaN(Number(subjectId))) {
        parsedSubjectId = Number(subjectId);
      } else {
        parsedSubjectId = null;
      }
    }

    let parsedGrade = existing.grade;
    if (grade !== undefined) {
      if (grade !== null && String(grade).trim() !== '') {
        const num = Number(grade);
        if (!isNaN(num)) {
          parsedGrade = num;
        } else {
          parsedGrade = null;
        }
      } else {
        parsedGrade = null;
      }
    }

    await execute(
      `UPDATE student_notes SET title = ?, content = ?, subject_id = ?, grade = ?
       WHERE id = ?`,
      [
        title?.trim() || existing.title,
        content !== undefined ? content : existing.content,
        parsedSubjectId,
        parsedGrade,
        req.params.id
      ]
    );

    const row = await queryOne(
      `SELECT n.*, s.name AS subject_name FROM student_notes n
       LEFT JOIN subjects s ON s.id = n.subject_id WHERE n.id = ?`,
      [req.params.id]
    );
    res.json(mapNote(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update note' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await execute('DELETE FROM student_notes WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.id
    ]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete note' });
  }
});

export default router;
