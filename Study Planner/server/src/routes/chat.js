import { Router } from 'express';
import { query, execute } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { analyzeSessions, getSessionsForUser } from '../lib/productivity.js';

const router = Router();
router.use(requireAuth);

const rateLimits = new Map();

function sanitize(input) {
  const cleaned = String(input || '')
    .replace(/[<>"']/g, '')
    .trim();
  return cleaned.length > 2000 ? cleaned.slice(0, 2000) : cleaned;
}

function extractGeminiText(data) {
  // gemini-2.5-flash returns thinking parts before the real text.
  // Find the first part that has text and is NOT a pure thinking block.
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.text && !part.thought) {
      const trimmed = part.text.trim();
      if (trimmed) return trimmed;
    }
  }
  // Fallback: return any non-empty text part
  for (const part of parts) {
    if (part.text?.trim()) return part.text.trim();
  }
  return null;
}

async function askGemini(message, context, history) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const parts = [
    { text: `Context: ${context}` },
    ...history.slice(-10).map((m) => ({
      text: `${m.role === 'USER' ? 'User' : 'Assistant'}: ${m.content}`
    })),
    { text: `User: ${message}` }
  ];

  const body = { contents: [{ role: 'user', parts }] };
  const maxTokens = Number(process.env.GEMINI_MAX_TOKENS);
  if (maxTokens > 0) {
    body.generationConfig = { maxOutputTokens: maxTokens };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) return { error: res.status };
    const data = await res.json();
    const text = extractGeminiText(data);
    return text ? { reply: text } : null;
  } catch {
    return { error: 'TIMEOUT' };
  }
}

router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const now = Date.now();
    const bucket = rateLimits.get(userId) || [];
    const recent = bucket.filter((t) => now - t < 60000);
    if (recent.length >= 15) {
      return res.status(429).json({ message: 'Too many chat requests. Please retry in a minute.' });
    }
    recent.push(now);
    rateLimits.set(userId, recent);

    const raw = sanitize(req.body?.message);
    if (!raw) return res.status(400).json({ message: 'Message cannot be blank.' });

    await execute('INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)', [
      userId,
      'USER',
      raw
    ]);

    const history = (
      await query(
        `SELECT role, content FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
        [userId]
      )
    ).reverse();

    const sessions = await getSessionsForUser(userId);
    const report = analyzeSessions(sessions);
    const context = `AI report: productivityScore=${report.productivityScore}, consistencyScore=${report.consistencyScore}, mostActiveHour=${report.mostActiveHour}, suggestions=${JSON.stringify(report.suggestions)}`;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        reply:
          'Gemini is not configured yet. Set GEMINI_API_KEY in the .env file at the project root, then restart the server.'
      });
    }

    const gemini = await askGemini(raw, context, history);
    if (gemini?.reply) {
      await execute('INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)', [
        userId,
        'ASSISTANT',
        gemini.reply
      ]);
      return res.json({ reply: gemini.reply });
    }

    if (gemini?.error === 429) {
      return res.json({ reply: 'Gemini rate limit/quota reached. Please wait a bit and try again.' });
    }
    if (gemini?.error === 401 || gemini?.error === 403) {
      return res.json({
        reply: 'Gemini API key is invalid or missing permissions. Re-check GEMINI_API_KEY in your .env and restart.'
      });
    }
    return res.json({ reply: 'Gemini is temporarily unavailable. Please try again in a moment.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Chat failed' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, role, content, created_at AS createdAt FROM chat_messages
       WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json(rows.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load history' });
  }
});

export default router;
