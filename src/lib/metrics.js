import { addDays, startOfDay, toISODate, fromISODate } from './dates.js';

const round2 = (n) => Math.round(n * 100) / 100;
export const avg = (arr) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0);

export function barberRating(db, barberId) {
  const rs = db.reviews.filter((r) => r.barberId === barberId);
  return { avg: round2(avg(rs.map((r) => r.rating))), count: rs.length };
}

/**
 * Métricas del panel de administración.
 * Ingreso = cita confirmada o completada cuyo pago está aprobado (se imputa a la fecha de la cita).
 */
export function adminMetrics(db, now = new Date()) {
  const todayISO = toISODate(now);
  const payById = new Map(db.payments.map((p) => [p.id, p]));
  const earns = (a) => (a.status === 'confirmed' || a.status === 'completed') && payById.get(a.paymentId)?.status === 'approved';
  const sumOn = (pred) => round2(db.appointments.filter((a) => earns(a) && pred(a)).reduce((s, a) => s + a.total, 0));

  const series = [];
  for (let i = 13; i >= 0; i--) {
    const d = toISODate(addDays(startOfDay(now), -i));
    series.push({ date: d, value: sumOn((a) => a.date === d) });
  }
  const since30 = toISODate(addDays(startOfDay(now), -30));
  const last30 = db.appointments.filter((a) => earns(a) && a.date >= since30 && a.date <= todayISO);

  const byService = new Map(), byBarber = new Map();
  for (const a of last30) {
    const s = byService.get(a.serviceId) || { id: a.serviceId, count: 0, revenue: 0 };
    s.count++; s.revenue = round2(s.revenue + a.total); byService.set(a.serviceId, s);
    const b = byBarber.get(a.barberId) || { id: a.barberId, count: 0, revenue: 0 };
    b.count++; b.revenue = round2(b.revenue + a.total); byBarber.set(a.barberId, b);
  }
  const today = db.appointments.filter((a) => a.date === todayISO);

  return {
    revenueToday: sumOn((a) => a.date === todayISO),
    revenueMonth: sumOn((a) => a.date.startsWith(todayISO.slice(0, 7)) && a.date <= todayISO),
    appointmentsToday: today.filter((a) => a.status !== 'cancelled').length,
    todayDone: today.filter((a) => a.status === 'completed').length,
    todayPending: today.filter((a) => a.status === 'pending').length,
    newClients30: db.users.filter((u) => u.role === 'client' && u.createdAt.slice(0, 10) >= since30).length,
    pendingPayments: db.payments.filter((p) => p.status === 'pending' && p.method !== 'efectivo').length,
    pendingCash: db.payments.filter((p) => p.status === 'pending' && p.method === 'efectivo').length,
    series,
    topServices: [...byService.values()].sort((a, b) => b.revenue - a.revenue),
    topBarbers: [...byBarber.values()].sort((a, b) => b.revenue - a.revenue),
    since30,
  };
}

export const daysSince = (iso, now = new Date()) => Math.round((now - fromISODate(iso.slice(0, 10))) / 864e5);
