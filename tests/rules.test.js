import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSeed } from '../src/api/seed.js';
import { getDaySlots, canModify, isSlotAvailable, scheduleFor, hoursUntil, nextSlotsByBarber } from '../src/lib/availability.js';
import { computePricing, isFirstAppointment, promoApplies } from '../src/lib/pricing.js';
import { favoriteBarber, getTier, userPoints, computeBadges } from '../src/lib/loyalty.js';
import { validatePayment } from '../src/lib/paymentRules.js';
import { isVEMobile, proofIssue } from '../src/lib/validators.js';
import { adminMetrics } from '../src/lib/metrics.js';
import { hhmmToMin, toDateTime, toISODate, addDays } from '../src/lib/dates.js';

const NOW = new Date(2026, 9, 7, 10, 0); // miércoles 7 oct 2026, 10:00
const db = buildSeed(NOW);
const barber = (id) => db.barbers.find((b) => b.id === id);

test('seed: ninguna cita activa se solapa con otra del mismo barbero', () => {
  const act = db.appointments.filter((a) => a.status !== 'cancelled');
  for (const b of db.barbers) {
    const list = act.filter((a) => a.barberId === b.id).sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time));
    for (let i = 1; i < list.length; i++) {
      if (list[i].date !== list[i - 1].date) continue;
      assert.ok(hhmmToMin(list[i].time) >= hhmmToMin(list[i - 1].time) + list[i - 1].duration, `solape ${b.id} ${list[i].date} ${list[i].time}`);
    }
  }
});

test('seed: todas las citas respetan el horario del barbero y su descanso', () => {
  for (const a of db.appointments) {
    const s = scheduleFor(barber(a.barberId), a.date);
    assert.ok(s, `barbero cerrado ${a.barberId} ${a.date}`);
    const start = hhmmToMin(a.time), end = start + a.duration;
    assert.ok(start >= hhmmToMin(s.start) && end <= hhmmToMin(s.end));
    if (s.breakStart) assert.ok(!(start < hhmmToMin(s.breakEnd) && end > hhmmToMin(s.breakStart)), 'cita en el descanso');
  }
});

test('disponibilidad: cita existente bloquea turnos solapados y cancelar los libera', () => {
  const b = barber('b1');
  const date = '2026-10-14'; // miércoles futuro
  const appt = { id: 'x1', barberId: 'b1', date, time: '10:00', duration: 45, status: 'confirmed' };
  const args = { barber: b, durationMin: 30, dateISO: date, appointments: [appt], now: NOW };
  assert.equal(isSlotAvailable(args, '10:00'), false);
  assert.equal(isSlotAvailable(args, '10:30'), false); // aún dentro de los 45 min
  assert.equal(isSlotAvailable(args, '11:00'), true);
  assert.equal(isSlotAvailable(args, '09:30'), true); // 09:30-10:00 termina justo cuando empieza la cita
});

test('disponibilidad: un turno que termina justo cuando empieza otra cita es válido', () => {
  const b = barber('b1');
  const date = '2026-10-14';
  const appt = { id: 'x1', barberId: 'b1', date, time: '10:00', duration: 30, status: 'pending' };
  assert.equal(isSlotAvailable({ barber: b, durationMin: 30, dateISO: date, appointments: [appt], now: NOW }, '09:30'), true);
  assert.equal(isSlotAvailable({ barber: b, durationMin: 60, dateISO: date, appointments: [appt], now: NOW }, '09:30'), false);
  const cancelled = { ...appt, status: 'cancelled' };
  assert.equal(isSlotAvailable({ barber: b, durationMin: 30, dateISO: date, appointments: [cancelled], now: NOW }, '10:00'), true);
});

test('disponibilidad: respeta descanso, cierre, días libres y turnos pasados', () => {
  const b = barber('b1');
  const date = '2026-10-14';
  const slots = getDaySlots({ barber: b, durationMin: 60, dateISO: date, appointments: [], now: NOW });
  assert.equal(slots.find((s) => s.time === '12:00').reason, 'break'); // 12:00-13:00 pisa el descanso 12:30
  assert.equal(slots.at(-1).time, '18:00'); // 18:00 + 60 = 19:00 (cierre)
  assert.deepEqual(getDaySlots({ barber: b, durationMin: 30, dateISO: '2026-10-11', appointments: [], now: NOW }), []); // domingo cerrado
  assert.deepEqual(getDaySlots({ barber: { ...b, daysOff: [date] }, durationMin: 30, dateISO: date, appointments: [], now: NOW }), []);
  const today = getDaySlots({ barber: b, durationMin: 30, dateISO: '2026-10-07', appointments: [], now: NOW });
  assert.equal(today.find((s) => s.time === '10:00').reason, 'past');
  assert.equal(today.find((s) => s.time === '10:30').available, true); // exactamente 30 min de anticipación
});

test('reprogramar: ignoreAppointmentId permite elegir el mismo horario', () => {
  const b = barber('b1');
  const appt = { id: 'x1', barberId: 'b1', date: '2026-10-14', time: '10:00', duration: 30, status: 'confirmed' };
  const base = { barber: b, durationMin: 30, dateISO: '2026-10-14', appointments: [appt], now: NOW };
  assert.equal(isSlotAvailable(base, '10:00'), false);
  assert.equal(isSlotAvailable({ ...base, ignoreAppointmentId: 'x1' }, '10:00'), true);
});

test('regla de 2 horas', () => {
  const mk = (h, status = 'confirmed') => {
    const d = new Date(NOW.getTime() + h * 36e5);
    return { date: toISODate(d), time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`, status };
  };
  assert.equal(canModify(mk(2.5), NOW), true);
  assert.equal(canModify(mk(2), NOW), true); // justo 2 h: permitido
  assert.equal(canModify(mk(1.5), NOW), false);
  assert.equal(canModify(mk(-1), NOW), false);
  assert.equal(canModify(mk(48, 'cancelled'), NOW), false);
  assert.equal(canModify(mk(48, 'completed'), NOW), false);
  assert.equal(canModify(mk(48, 'pending'), NOW), true);
  assert.ok(Math.abs(hoursUntil(mk(5), NOW) - 5) < 0.01);
});

test('próximos turnos: uno por barbero, ordenados', () => {
  const r = nextSlotsByBarber({ barbers: db.barbers, durationMin: 30, appointments: db.appointments, now: NOW });
  assert.ok(r.length >= 3);
  for (let i = 1; i < r.length; i++) assert.ok((r[i - 1].dateISO + r[i - 1].time) <= (r[i].dateISO + r[i].time));
});

test('precios: primera cita 20% automático; los descuentos no se acumulan', () => {
  const s = db.services.find((x) => x.id === 's2'); // $25
  const base = { service: s, dateISO: '2026-10-14', promos: db.promos }; // miércoles
  const first = computePricing({ ...base, isFirst: true });
  assert.equal(first.discount, 5); assert.equal(first.total, 20); assert.equal(first.applied.code, 'BIENVENIDO20');
  const notFirst = computePricing({ ...base, isFirst: false });
  assert.equal(notFirst.total, 25); assert.equal(notFirst.applied, null);
  // primera cita + código de 10%: gana el mejor (20%), sin sumar
  assert.equal(computePricing({ ...base, isFirst: true, code: 'amigos10' }).total, 20);
  // código válido sin primera cita
  assert.equal(computePricing({ ...base, isFirst: false, code: 'AMIGOS10' }).total, 22.5);
  // MARTES15 solo martes
  const wed = computePricing({ ...base, isFirst: false, code: 'MARTES15' });
  assert.equal(wed.total, 25); assert.match(wed.codeError, /martes/);
  assert.equal(computePricing({ ...base, dateISO: '2026-10-13', isFirst: false, code: 'MARTES15' }).total, 21.25);
  assert.match(computePricing({ ...base, isFirst: false, code: 'NOEXISTE' }).codeError, /reconocemos/);
  assert.equal(promoApplies({ ...db.promos[2], validUntil: '2026-01-01' }, { dateISO: '2026-10-14', isFirst: false }).ok, false);
});

test('primera cita: las canceladas no cuentan', () => {
  assert.equal(isFirstAppointment('u', []), true);
  assert.equal(isFirstAppointment('u', [{ userId: 'u', status: 'cancelled' }]), true);
  assert.equal(isFirstAppointment('u', [{ userId: 'u', status: 'pending' }]), false);
  assert.equal(isFirstAppointment(null, []), false);
});

test('fidelización: niveles, puntos y barbero favorito del cliente demo', () => {
  assert.equal(getTier(0).name, 'Bronce'); assert.equal(getTier(199).name, 'Bronce');
  assert.equal(getTier(200).name, 'Plata'); assert.equal(getTier(499).name, 'Plata');
  assert.equal(getTier(500).name, 'Oro'); assert.equal(getTier(500).next, null);
  assert.equal(getTier(350).progress, 0.5);
  const pts = userPoints({ appointments: db.appointments, reviews: db.reviews, userId: 'u_demo' });
  assert.ok(pts >= 200 && pts < 500, `puntos demo ${pts}`);
  const fav = favoriteBarber({ appointments: db.appointments, reviews: db.reviews, userId: 'u_demo', now: NOW });
  assert.equal(fav.barberId, 'b1');
  assert.equal(fav.visits, 5); // Carlos: 5 de las 9 visitas del cliente demo
  assert.equal(favoriteBarber({ appointments: [], reviews: [], userId: 'zz', now: NOW }), null);
  const badges = computeBadges({ appointments: db.appointments, reviews: db.reviews, userId: 'u_demo', points: pts });
  assert.ok(badges.find((b) => b.key === 'regular').earned && badges.find((b) => b.key === 'explorer').earned && !badges.find((b) => b.key === 'gold').earned);
});

test('barbero favorito: la recencia y la calificación pesan', () => {
  const mk = (id, barberId, daysAgo) => ({ id, userId: 'u', barberId, status: 'completed', date: toISODate(addDays(NOW, -daysAgo)), total: 10 });
  // 2 visitas antiguas a A vs 1 reciente a B: gana B por recencia
  let fav = favoriteBarber({ appointments: [mk('1', 'A', 400), mk('2', 'A', 420), mk('3', 'B', 5)], reviews: [], userId: 'u', now: NOW });
  assert.equal(fav.barberId, 'B');
  // misma frecuencia y fecha: gana quien recibió mejor calificación
  fav = favoriteBarber({ appointments: [mk('1', 'A', 10), mk('2', 'B', 10)], reviews: [{ userId: 'u', appointmentId: '2', rating: 5 }, { userId: 'u', appointmentId: '1', rating: 2 }], userId: 'u', now: NOW });
  assert.equal(fav.barberId, 'B');
});

test('pago móvil: validación de campos', () => {
  const ok = { method: 'pago_movil', data: { bank: '0134', phone: '0414-1234567', idDoc: '12345678', reference: '123456', paymentDate: '2026-10-07' }, proof: { name: 'a.jpg' } };
  assert.deepEqual(validatePayment(ok, '2026-10-07'), {});
  assert.ok(validatePayment({ ...ok, data: { ...ok.data, phone: '123' } }, '2026-10-07').phone);
  assert.ok(validatePayment({ ...ok, data: { ...ok.data, reference: 'abc' } }, '2026-10-07').reference);
  assert.ok(validatePayment({ ...ok, data: { ...ok.data, paymentDate: '2026-10-08' } }, '2026-10-07').paymentDate);
  assert.ok(validatePayment({ ...ok, proof: null }, '2026-10-07').proof);
  assert.deepEqual(validatePayment({ method: 'efectivo', data: {}, proof: null }), {});
  assert.ok(validatePayment({ method: 'zelle', data: { senderEmail: 'x', reference: '1234', paymentDate: '2026-10-07' }, proof: {} }, '2026-10-07').senderEmail);
  assert.ok(validatePayment({ method: 'bitcoin', data: {} }).method);
});

test('validadores: teléfono venezolano y comprobante', () => {
  assert.ok(isVEMobile('0414-1234567') && isVEMobile('+58 412 1234567') && isVEMobile('04261234567'));
  assert.ok(!isVEMobile('0212-1234567') && !isVEMobile('041412345'));
  assert.equal(proofIssue({ type: 'image/png', size: 100 }), null);
  assert.equal(proofIssue({ type: 'application/pdf', size: 100 }), null);
  assert.ok(proofIssue({ type: 'image/gif', size: 100 }));
  assert.ok(proofIssue({ type: 'image/png', size: 6 * 1024 * 1024 }));
  assert.ok(proofIssue(null));
});

test('métricas del admin', () => {
  const m = adminMetrics(db, NOW);
  assert.equal(m.series.length, 14);
  assert.equal(m.series.at(-1).date, '2026-10-07');
  assert.ok(m.revenueMonth >= m.revenueToday);
  assert.ok(m.newClients30 >= 4);
  assert.ok(m.topServices.length > 0 && m.topBarbers[0].revenue >= m.topBarbers.at(-1).revenue);
  assert.ok(m.pendingPayments > 0);
});
