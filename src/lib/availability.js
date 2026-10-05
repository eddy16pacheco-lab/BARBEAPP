import { fromISODate, hhmmToMin, minToHHMM, toDateTime, addDays, startOfDay, toISODate } from './dates.js';

export const SLOT_STEP_MIN = 30;        // granularidad de la agenda
export const BOOKING_LEAD_MIN = 30;     // anticipación mínima para reservar
export const MODIFY_WINDOW_HOURS = 2;   // regla de negocio: modificar/cancelar hasta 2 h antes

/** Estados que ocupan agenda. Una cita cancelada libera el turno. */
const OCCUPYING = new Set(['pending', 'confirmed', 'completed']);
export const occupiesSlot = (a) => OCCUPYING.has(a.status);

/** Horario del barbero para una fecha concreta, o null si no atiende. */
export function scheduleFor(barber, dateISO) {
  const s = barber.schedule?.[fromISODate(dateISO).getDay()];
  if (!s || !s.open) return null;
  if (barber.daysOff?.includes(dateISO)) return null;
  return s;
}

/**
 * Calcula los turnos de un día para un barbero y una duración.
 * Devuelve [{ time:'HH:MM', available:boolean, reason:null|'past'|'break'|'busy' }]
 * Es una función pura: la "disponibilidad en tiempo real" sale de recalcularla
 * cada vez que cambian las citas.
 */
export function getDaySlots({ barber, durationMin, dateISO, appointments, now = new Date(), ignoreAppointmentId = null }) {
  const s = scheduleFor(barber, dateISO);
  if (!s) return [];
  const open = hhmmToMin(s.start);
  const close = hhmmToMin(s.end);
  const brk = s.breakStart && s.breakEnd ? [hhmmToMin(s.breakStart), hhmmToMin(s.breakEnd)] : null;
  const busy = appointments
    .filter((a) => a.barberId === barber.id && a.date === dateISO && occupiesSlot(a) && a.id !== ignoreAppointmentId)
    .map((a) => [hhmmToMin(a.time), hhmmToMin(a.time) + a.duration]);
  const earliest = now.getTime() + BOOKING_LEAD_MIN * 60000;

  const slots = [];
  for (let t = open; t + durationMin <= close; t += SLOT_STEP_MIN) {
    const end = t + durationMin;
    let reason = null;
    if (toDateTime(dateISO, minToHHMM(t)).getTime() < earliest) reason = 'past';
    else if (brk && t < brk[1] && end > brk[0]) reason = 'break';
    else if (busy.some(([bs, be]) => t < be && end > bs)) reason = 'busy';
    slots.push({ time: minToHHMM(t), available: !reason, reason });
  }
  return slots;
}

export const isSlotAvailable = (args, time) => getDaySlots(args).some((s) => s.time === time && s.available);
export const hasAvailability = (args) => getDaySlots(args).some((s) => s.available);

/** Primer turno libre de cada barbero (para el bloque "próximos turnos" del inicio). */
export function nextSlotsByBarber({ barbers, durationMin, appointments, now = new Date(), horizonDays = 14 }) {
  const out = [];
  for (const barber of barbers) {
    let found = null;
    for (let i = 0; i <= horizonDays && !found; i++) {
      const dateISO = toISODate(addDays(startOfDay(now), i));
      const slot = getDaySlots({ barber, durationMin, dateISO, appointments, now }).find((s) => s.available);
      if (slot) found = { barber, dateISO, time: slot.time };
    }
    if (found) out.push(found);
  }
  return out.sort((a, b) => (a.dateISO + a.time).localeCompare(b.dateISO + b.time));
}

export const hoursUntil = (appt, now = new Date()) => (toDateTime(appt.date, appt.time) - now) / 36e5;

/** Regla de las 2 horas: solo citas activas y con tiempo suficiente. */
export function canModify(appt, now = new Date(), windowHours = MODIFY_WINDOW_HOURS) {
  return (appt.status === 'pending' || appt.status === 'confirmed') && hoursUntil(appt, now) >= windowHours;
}

export function modifyBlockReason(appt, now = new Date(), windowHours = MODIFY_WINDOW_HOURS) {
  if (appt.status !== 'pending' && appt.status !== 'confirmed') return 'Esta cita ya no se puede modificar.';
  if (hoursUntil(appt, now) < windowHours) {
    return `Solo puedes modificar o cancelar hasta ${windowHours} horas antes de la cita.`;
  }
  return null;
}
