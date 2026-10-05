// Utilidades de fecha en hora LOCAL (las citas son "hora de pared" de la barbería).
const pad = (n) => String(n).padStart(2, '0');

export const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromISODate = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const toDateTime = (dateISO, hhmm) => {
  const [y, m, d] = dateISO.split('-').map(Number);
  const [h, mi] = hhmm.split(':').map(Number);
  return new Date(y, m - 1, d, h, mi, 0, 0);
};
export const hhmmToMin = (s) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};
export const minToHHMM = (n) => `${pad(Math.floor(n / 60))}:${pad(n % 60)}`;
export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const isSameDay = (a, b) => toISODate(a) === toISODate(b);

export const fmtTime = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'p. m.' : 'a. m.'}`;
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const fmtDate = (iso, opts = { weekday: 'long', day: 'numeric', month: 'long' }) =>
  cap(new Intl.DateTimeFormat('es', opts).format(fromISODate(iso)));
export const fmtDateShort = (iso) => fmtDate(iso, { day: 'numeric', month: 'short' });
export const fmtMonth = (d) => cap(new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(d));

/** "Hoy", "Mañana" o el día de la semana, según la cercanía. */
export function relativeDay(iso, now = new Date()) {
  const diff = Math.round((fromISODate(iso) - startOfDay(now)) / 864e5);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  return fmtDate(iso, { weekday: 'long', day: 'numeric', month: 'short' });
}
