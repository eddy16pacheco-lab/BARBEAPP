import { DAY_NAMES, fromISODate } from './dates.js';

/** ¿La promoción aplica a esta reserva? */
export function promoApplies(promo, { dateISO, isFirst }) {
  if (!promo || !promo.active) return { ok: false, reason: 'Este código no está activo.' };
  if (promo.validUntil && dateISO > promo.validUntil) return { ok: false, reason: 'Este código ya venció.' };
  if (promo.firstOnly && !isFirst) return { ok: false, reason: 'Solo es válido en tu primera cita.' };
  if (promo.days?.length && !promo.days.includes(fromISODate(dateISO).getDay())) {
    return { ok: false, reason: `Solo es válido los ${promo.days.map((d) => DAY_NAMES[d]).join(' y ')}.` };
  }
  return { ok: true };
}

export function findPromoByCode(promos, code) {
  const c = (code || '').trim().toUpperCase();
  return c ? promos.find((p) => p.code.toUpperCase() === c) : null;
}

export const isFirstAppointment = (userId, appointments) =>
  !!userId && !appointments.some((a) => a.userId === userId && a.status !== 'cancelled');

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Precio final. Los descuentos NO se acumulan: se aplica el mejor entre
 * (a) promociones automáticas (p. ej. primera cita) y (b) el código ingresado.
 */
export function computePricing({ service, dateISO, isFirst, promos, code }) {
  const subtotal = service.price;
  const ctx = { dateISO, isFirst };
  const candidates = promos.filter((p) => p.auto && promoApplies(p, ctx).ok);
  let codeError = null;
  if (code && code.trim()) {
    const p = findPromoByCode(promos, code);
    if (!p) codeError = 'No reconocemos ese código.';
    else {
      const r = promoApplies(p, ctx);
      if (r.ok) candidates.push(p);
      else codeError = r.reason;
    }
  }
  const best = [...candidates].sort((a, b) => b.value - a.value)[0] || null;
  const discount = best ? round2((subtotal * best.value) / 100) : 0;
  return {
    subtotal,
    discount,
    total: round2(subtotal - discount),
    pct: best ? best.value : 0,
    applied: best ? { id: best.id, title: best.title, code: best.code, auto: !!best.auto } : null,
    codeError,
  };
}

export const usd = (n) => `$${Number(n).toFixed(Number.isInteger(+n) ? 0 : 2)}`;
export const bs = (n, rate) =>
  `Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n * rate)}`;
