import { query, formatDate } from '../db.js';

export function analyzeSessions(sessions) {
  if (!sessions?.length) {
    return {
      consistencyScore: 0,
      productivityScore: 0,
      mostActiveHour: 0,
      suggestions: ['Commencez à enregistrer vos sessions pour générer un rapport.']
    };
  }

  const durations = sessions.map((s) => s.duration_minutes);
  const avgPerSession = durations.reduce((a, b) => a + b, 0) / durations.length;

  const byDay = {};
  for (const s of sessions) {
    const d = formatDate(s.date);
    byDay[d] = (byDay[d] || 0) + s.duration_minutes;
  }
  const dailyTotals = Object.values(byDay);
  const dailyAverage =
    dailyTotals.reduce((a, b) => a + b, 0) / (dailyTotals.length || 1);

  const variance =
    dailyTotals.reduce((sum, v) => {
      const diff = v - dailyAverage;
      return sum + diff * diff;
    }, 0) / (dailyTotals.length || 1);

  const stdDeviation = Math.sqrt(variance);
  const consistencyScore =
    Math.round(
      Math.max(0, Math.min(10, 10 - Math.min(10, (stdDeviation / (dailyAverage || 1)) * 10))) * 10
    ) / 10;
  const productivityScore = Math.round(Math.min(10, (avgPerSession / 30) * 10) * 10) / 10;

  const hourCounts = {};
  for (const s of sessions) {
    if (s.start_hour != null) {
      hourCounts[s.start_hour] = (hourCounts[s.start_hour] || 0) + 1;
    }
  }
  let mostActiveHour = 0;
  let maxCount = 0;
  for (const [h, c] of Object.entries(hourCounts)) {
    if (c > maxCount) {
      maxCount = c;
      mostActiveHour = Number(h);
    }
  }

  const suggestions = [];
  const after21 = sessions.filter((s) => s.start_hour != null && s.start_hour >= 21).length;
  if (sessions.length && after21 / sessions.length > 0.7) {
    suggestions.push('Vous étudiez majoritairement après 21h : pensez à préserver votre sommeil.');
  }
  if (consistencyScore < 5) {
    suggestions.push('Vos sessions manquent de régularité : fixez un créneau quotidien.');
  }
  if (productivityScore < 6) {
    suggestions.push('Augmentez progressivement la durée de vos sessions pour plus d\'efficacité.');
  }
  if (!suggestions.length) {
    suggestions.push('Excellent rythme ! Continuez à suivre vos progrès.');
  }

  return { consistencyScore, productivityScore, mostActiveHour, suggestions };
}

export async function getSessionsForUser(userId) {
  return query(
    'SELECT * FROM study_sessions WHERE user_id = ? ORDER BY date DESC',
    [userId]
  );
}
