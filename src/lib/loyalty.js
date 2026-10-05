import { fromISODate } from './dates.js';

export const TIERS = [
  { key: 'bronze', name: 'Bronce', min: 0 },
  { key: 'silver', name: 'Plata', min: 200 },
  { key: 'gold', name: 'Oro', min: 500 },
];
export const REVIEW_POINTS = 10;

export const pointsForAppointment = (appt) => Math.floor(appt.total);

export function getTier(points) {
  let idx = 0;
  TIERS.forEach((t, i) => { if (points >= t.min) idx = i; });
  const tier = TIERS[idx];
  const next = TIERS[idx + 1] || null;
  const progress = next ? Math.min(1, (points - tier.min) / (next.min - tier.min)) : 1;
  return { ...tier, next, progress, missing: next ? next.min - points : 0 };
}

/**
 * Barbero favorito: cada cita completada suma un peso que
 *  - decae con el tiempo (vida media de 120 días), y
 *  - sube/baja según la calificación que el cliente dio (5★ ×1.5 … 1★ ×0.5; sin calificar ×1).
 * Gana el barbero con mayor puntaje; el empate lo rompe la visita más reciente.
 */
export const FAVORITE_HALF_LIFE_DAYS = 120;

export function favoriteBarber({ appointments, reviews, userId, now = new Date() }) {
  const done = appointments.filter((a) => a.userId === userId && a.status === 'completed');
  if (!done.length) return null;
  const ratingByAppt = new Map(reviews.filter((r) => r.userId === userId).map((r) => [r.appointmentId, r.rating]));
  const stats = new Map();
  for (const a of done) {
    const days = Math.max(0, (now - fromISODate(a.date)) / 864e5);
    const recency = Math.pow(0.5, days / FAVORITE_HALF_LIFE_DAYS);
    const rating = ratingByAppt.get(a.id);
    const quality = rating ? 0.5 + (rating - 1) / 4 : 1;
    const s = stats.get(a.barberId) || { barberId: a.barberId, score: 0, visits: 0, last: '' };
    s.score += recency * quality;
    s.visits += 1;
    if (a.date > s.last) s.last = a.date;
    stats.set(a.barberId, s);
  }
  const ranked = [...stats.values()].sort((a, b) => b.score - a.score || b.last.localeCompare(a.last));
  const top = ranked[0];
  return { ...top, totalVisits: done.length, share: top.visits / done.length, ranking: ranked };
}

export const BADGES = [
  { key: 'first', name: 'Primera visita', hint: 'Completa tu primera cita', test: (s) => s.completed >= 1 },
  { key: 'regular', name: 'Cliente fiel', hint: 'Completa 5 citas', test: (s) => s.completed >= 5 },
  { key: 'explorer', name: 'Explorador', hint: 'Visita a 3 barberos distintos', test: (s) => s.barbers >= 3 },
  { key: 'critic', name: 'Voz del cliente', hint: 'Escribe 3 reseñas', test: (s) => s.reviews >= 3 },
  { key: 'gold', name: 'Miembro Oro', hint: 'Llega a 500 puntos', test: (s) => s.points >= 500 },
];

export function computeBadges({ appointments, reviews, userId, points }) {
  const done = appointments.filter((a) => a.userId === userId && a.status === 'completed');
  const s = {
    completed: done.length,
    barbers: new Set(done.map((a) => a.barberId)).size,
    reviews: reviews.filter((r) => r.userId === userId).length,
    points,
  };
  return BADGES.map((b) => ({ key: b.key, name: b.name, hint: b.hint, earned: b.test(s) }));
}

export function userPoints({ appointments, reviews, userId }) {
  const fromVisits = appointments
    .filter((a) => a.userId === userId && a.status === 'completed')
    .reduce((sum, a) => sum + pointsForAppointment(a), 0);
  const fromReviews = reviews.filter((r) => r.userId === userId).length * REVIEW_POINTS;
  return fromVisits + fromReviews;
}
