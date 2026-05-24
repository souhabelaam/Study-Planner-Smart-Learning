import { query, queryOne, execute, formatDate } from '../db.js';
import { analyzeSessions } from './productivity.js';

function parseGeminiJson(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '');
  }
  return JSON.parse(cleaned.trim());
}

async function askGeminiDirect(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ]
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      console.warn(`Gemini API returned status ${res.status}`);
      return null;
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || null;
  } catch (err) {
    console.error('Failed to contact Gemini:', err);
    return null;
  }
}

const DAY_NAMES = [
  'dimanche',
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi'
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function aggregateByDay(sessions, start, end) {
  const totals = {};
  for (const s of sessions) {
    const d = formatDate(s.date);
    if (d >= start && d <= end) {
      totals[d] = (totals[d] || 0) + s.duration_minutes;
    }
  }
  const ordered = {};
  let cur = start;
  while (cur <= end) {
    ordered[cur] = totals[cur] || 0;
    cur = addDays(cur, 1);
  }
  return ordered;
}

function currentStreak(daily) {
  let streak = 0;
  let day = todayStr();
  if ((daily[day] || 0) <= 0) day = addDays(day, -1);
  while ((daily[day] || 0) > 0) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

function longestStreak(daily) {
  let longest = 0;
  let current = 0;
  const days = Object.keys(daily).sort();
  for (const day of days) {
    if ((daily[day] || 0) > 0) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

export async function getStreaks(userId) {
  const settings =
    (await queryOne('SELECT daily_goal_minutes FROM user_settings WHERE user_id = ?', [userId])) ||
    { daily_goal_minutes: 60 };
  const goal = settings.daily_goal_minutes;
  const sessions = await query('SELECT * FROM study_sessions WHERE user_id = ?', [userId]);
  const start = addDays(todayStr(), -365);
  const daily = aggregateByDay(sessions, start, todayStr());
  const todayMinutes = daily[todayStr()] || 0;
  const current = currentStreak(daily);
  const longest = longestStreak(daily);
  const progress = goal <= 0 ? 0 : Math.min(100, (todayMinutes * 100) / goal);

  return {
    currentStreak: current,
    longestStreak: longest,
    todayMinutes,
    dailyGoalMinutes: goal,
    goalProgressPercent: Math.round(progress * 10) / 10
  };
}

export async function updateDailyGoal(userId, dailyGoalMinutes) {
  const safe = Math.min(Math.max(Number(dailyGoalMinutes) || 60, 15), 480);
  await execute(
    `INSERT INTO user_settings (user_id, daily_goal_minutes) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE daily_goal_minutes = VALUES(daily_goal_minutes)`,
    [userId, safe]
  );
  return getStreaks(userId);
}

export async function getHeatmap(userId, weeks) {
  const safeWeeks = Math.min(Math.max(Number(weeks) || 12, 4), 52);
  const end = todayStr();
  const start = addDays(end, -(safeWeeks * 7 - 1));
  const sessions = await query('SELECT * FROM study_sessions WHERE user_id = ?', [userId]);
  return aggregateByDay(sessions, start, end);
}

export async function getBadges(userId) {
  const sessions = await query('SELECT * FROM study_sessions WHERE user_id = ?', [userId]);
  const subjectCount =
    (await queryOne('SELECT COUNT(*) AS c FROM subjects WHERE user_id = ?', [userId]))?.c ?? 0;
  const sessionCount = sessions.length;
  const daily = {};
  for (const s of sessions) {
    const d = formatDate(s.date);
    daily[d] = (daily[d] || 0) + s.duration_minutes;
  }
  const streak = currentStreak(daily);
  const totalMinutes = sessions.reduce((a, s) => a + s.duration_minutes, 0);
  const maxSession = sessions.reduce((m, s) => Math.max(m, s.duration_minutes), 0);
  const nightSessions = sessions.filter((s) => s.start_hour != null && s.start_hour >= 21).length;
  const report = analyzeSessions(sessions);

  const badge = (id, title, description, icon, unlocked, progress, target) => ({
    id,
    title,
    description,
    icon,
    unlocked,
    progress,
    target
  });

  return [
    badge('first_step', 'Premier pas', 'Enregistrez votre première session.', '🎯', sessionCount >= 1, Math.min(sessionCount, 1), 1),
    badge('week_warrior', 'Guerrier de la semaine', 'Maintenez une série de 7 jours.', '🔥', streak >= 7, Math.min(streak, 7), 7),
    badge('marathon', 'Marathonien', 'Complétez une session de 2 h ou plus.', '🏃', maxSession >= 120, Math.min(maxSession, 120), 120),
    badge('polyvalent', 'Polyvalent', 'Étudiez au moins 5 matières.', '📚', subjectCount >= 5, Math.min(subjectCount, 5), 5),
    badge('night_owl', 'Oiseau de nuit', '10 sessions après 21 h.', '🌙', nightSessions >= 10, Math.min(nightSessions, 10), 10),
    badge('consistent', 'Régularité d\'or', 'Score de constance ≥ 8/10.', '⭐', report.consistencyScore >= 8, Math.min(Math.floor(report.consistencyScore), 8), 8),
    badge('centurion', 'Centurion', 'Accumulez 100 h d\'étude.', '💎', totalMinutes >= 6000, Math.min(totalMinutes, 6000), 6000)
  ];
}

export async function buildWeeklyPlan(userId) {
  const subjects = await query('SELECT * FROM subjects WHERE user_id = ?', [userId]);
  const sessions = await query(
    `SELECT s.*, sub.name AS subject_name FROM study_sessions s
     LEFT JOIN subjects sub ON sub.id = s.subject_id WHERE s.user_id = ?`,
    [userId]
  );
  const streak = await getStreaks(userId);

  const prioritySubjects = [...subjects].map((s) => s.name);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !subjects.length) {
    return buildFallbackWeeklyPlan(subjects, sessions, streak);
  }

  const cursor = todayStr();
  const next7Days = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(cursor, i);
    const dow = new Date(day + 'T12:00:00').getDay();
    next7Days.push({ date: day, dayName: DAY_NAMES[dow] });
  }

  const prompt = `Tu es un tuteur intelligent d'apprentissage. Génère un plan d'étude hebdomadaire sur 7 jours.
Voici les matières de l'étudiant: ${JSON.stringify(prioritySubjects)}
Voici les sessions d'étude récentes: ${JSON.stringify(sessions.slice(-15))}
Voici l'objectif d'étude quotidien de l'étudiant en minutes: ${streak.dailyGoalMinutes} min.
Les dates et jours de la semaine pour les 7 prochains jours sont:
${next7Days.map(d => `- ${d.dayName} ${d.date}`).join('\n')}

Génère un conseil personnalisé (tip) et le nombre de minutes recommandées (recommendedMinutes) pour chaque jour.
Les matières prioritaires pour l'étudiant doivent être réparties de façon intelligente (les matières avec le moins d'heures révisées récemment doivent être prioritaires).
Réponds uniquement sous forme d'un objet JSON valide, sans balises markdown (pas de \`\`\`json ou de \`\`\`), respectant scrupuleusement la structure suivante:
{
  "summary": "Résumé en français expliquant l'orientation générale du plan (ex: priorité aux mathématiques cette semaine).",
  "days": [
    {
      "dayLabel": "Nom du jour (ex: lundi)",
      "date": "Format YYYY-MM-DD",
      "focusSubjects": ["Nom de la matière focus"],
      "recommendedMinutes": 45,
      "tip": "Conseil spécifique pour ce jour là (ex: révision des notions du chapitre 3)."
    }
  ]
}`;

  const responseText = await askGeminiDirect(prompt);
  if (responseText) {
    try {
      const parsed = parseGeminiJson(responseText);
      if (parsed && parsed.summary && Array.isArray(parsed.days)) {
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse Gemini weekly plan response, falling back:', e);
    }
  }

  return buildFallbackWeeklyPlan(subjects, sessions, streak);
}

function buildFallbackWeeklyPlan(subjects, sessions, streak) {
  const minutesBySubject = {};
  for (const s of sessions) {
    if (s.subject_id) {
      minutesBySubject[s.subject_id] = (minutesBySubject[s.subject_id] || 0) + s.duration_minutes;
    }
  }

  let prioritySubjects = [...subjects]
    .sort((a, b) => (minutesBySubject[a.id] || 0) - (minutesBySubject[b.id] || 0))
    .map((s) => s.name)
    .slice(0, 3);

  if (!prioritySubjects.length) prioritySubjects = ['Nouvelle matière'];

  const days = [];
  const baseMinutes = Math.max(30, Math.floor(streak.dailyGoalMinutes / 2));
  const cursor = todayStr();

  for (let i = 0; i < 7; i++) {
    const day = addDays(cursor, i);
    const dow = new Date(day + 'T12:00:00').getDay();
    const weekend = dow === 0 || dow === 6;
    const minutes = weekend ? Math.max(20, baseMinutes - 15) : baseMinutes + (i % 3) * 10;
    const focus = prioritySubjects[i % prioritySubjects.length];
    const tip = weekend
      ? 'Session courte : révision active et quiz.'
      : `Bloc focus ${minutes} min sur ${focus}.`;

    days.push({
      dayLabel: DAY_NAMES[dow],
      date: day,
      focusSubjects: [focus],
      recommendedMinutes: minutes,
      tip
    });
  }

  const summary = subjects.length
    ? `Plan adaptatif : priorité aux matières les moins étudiées (${prioritySubjects.join(', ')}).`
    : 'Ajoutez des matières pour personnaliser votre plan hebdomadaire IA.';

  return { summary, days };
}

export async function generateQuiz(userId, subjectId, count) {
  const subject = await queryOne('SELECT * FROM subjects WHERE id = ? AND user_id = ?', [
    subjectId,
    userId
  ]);
  if (!subject) {
    const err = new Error('Subject not found');
    err.status = 404;
    throw err;
  }

  const safeCount = Math.min(Math.max(Number(count) || 3, 3), 10);
  const name = subject.name;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return buildFallbackQuiz(name, safeCount);
  }

  const prompt = `Génère un quiz d'évaluation de ${safeCount} questions à choix multiples pour tester les connaissances sur la matière: "${name}".
Les questions doivent être variées, intéressantes et en français.
Réponds uniquement sous forme d'un objet JSON valide, sans balises markdown (pas de \`\`\`json ou de \`\`\`), respectant la structure suivante:
{
  "subjectName": "${name}",
  "questions": [
    {
      "question": "Texte de la question 1",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Pourquoi l'option A est correcte."
    }
  ],
  "aiPowered": true
}`;

  const responseText = await askGeminiDirect(prompt);
  if (responseText) {
    try {
      const parsed = parseGeminiJson(responseText);
      if (parsed && Array.isArray(parsed.questions)) {
        return {
          subjectName: name,
          questions: parsed.questions,
          aiPowered: true
        };
      }
    } catch (e) {
      console.error('Failed to parse Gemini quiz response, falling back:', e);
    }
  }

  return buildFallbackQuiz(name, safeCount);
}

function buildFallbackQuiz(name, safeCount) {
  const all = [
    {
      question: `Quelle stratégie est la plus efficace pour mémoriser ${name} ?`,
      options: ['Relire passivement', 'Répétition espacée active', 'Écouter en fond', 'Ignorer les révisions'],
      correctIndex: 1,
      explanation: 'La répétition espacée renforce la mémoire à long terme.'
    },
    {
      question: `Avant une session de ${name}, que faut-il faire en priorité ?`,
      options: ['Définir un objectif clair', 'Multitâche', 'Étudier sans pause', 'Zapper le planning'],
      correctIndex: 0,
      explanation: 'Un objectif précis améliore la concentration.'
    },
    {
      question: `Après 25 min de focus sur ${name}, quelle pause est recommandée ?`,
      options: ['5 minutes actives', '2 heures', 'Aucune pause', 'Réseaux sociaux 30 min'],
      correctIndex: 0,
      explanation: 'La technique Pomodoro utilise des pauses courtes et régulières.'
    },
    {
      question: `Comment évaluer votre compréhension en ${name} ?`,
      options: ['Auto-explication (Feynman)', 'Copier le cours', 'Éviter les questions', 'Étudier une seule fois'],
      correctIndex: 0,
      explanation: 'Expliquer le concept avec vos mots révèle les lacunes.'
    },
    {
      question: `Quel créneau optimise l'apprentissage de ${name} ?`,
      options: ['Votre heure la plus productive', 'Tard dans la nuit systématiquement', 'Uniquement le week-end', 'Au hasard'],
      correctIndex: 0,
      explanation: 'Planifiez aux heures où vous êtes le plus alerte.'
    }
  ];

  return {
    subjectName: name,
    questions: all.slice(0, Math.min(safeCount, all.length)),
    aiPowered: false
  };
}
