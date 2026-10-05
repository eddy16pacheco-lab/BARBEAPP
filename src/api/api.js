// "Backend" simulado. Cada función valida las reglas de negocio igual que lo haría un servidor real
// (disponibilidad, regla de 2 horas, roles, descuentos), por lo que la UI no puede saltárselas.
// Para pasar a un backend real basta con reimplementar estas funciones con fetch() a una API REST.
import { getDB, mutate, ApiError } from './db.js';
import { demoHash } from '../lib/security.js';
import { isEmail, isVEMobile, passwordIssue } from '../lib/validators.js';
import { isSlotAvailable, canModify, modifyBlockReason } from '../lib/availability.js';
import { computePricing, isFirstAppointment } from '../lib/pricing.js';
import { validatePayment, methodLabel } from '../lib/paymentRules.js';
import { fmtDate, fmtTime, toISODate } from '../lib/dates.js';

const SESSION_KEY = 'barbapp.session';
const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms));
const fail = (msg) => { throw new ApiError(msg); };
const uid = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const find = (arr, id, msg = 'No encontramos el registro.') => arr.find((x) => x.id === id) || fail(msg);
const requireAdmin = (db, actorId) => { const u = db.users.find((x) => x.id === actorId); if (u?.role !== 'admin') fail('No tienes permiso para esta acción.'); return u; };
const notify = (db, userId, type, title, body, extra = {}) =>
  db.notifications.push({ id: uid('n'), userId, type, title, body, createdAt: new Date().toISOString(), read: false, ...extra });

export const publicUser = (u) => (u ? { id: u.id, role: u.role, name: u.name, email: u.email, phone: u.phone, idDoc: u.idDoc, createdAt: u.createdAt } : null);

// ── Sesión y cuenta ─────────────────────────────────────────────────────────
export const getSessionUserId = () => window.localStorage.getItem(SESSION_KEY);
export const logout = () => window.localStorage.removeItem(SESSION_KEY);

export async function login({ email, password }) {
  await delay();
  const u = getDB().users.find((x) => x.email.toLowerCase() === (email || '').trim().toLowerCase());
  if (!u || u.passwordHash !== demoHash(password || '')) fail('Correo o contraseña incorrectos.');
  window.localStorage.setItem(SESSION_KEY, u.id);
  return publicUser(u);
}

export async function register({ name, email, phone, password }) {
  await delay();
  if (!name || name.trim().length < 3) fail('Escribe tu nombre completo.');
  if (!isEmail(email)) fail('Ingresa un correo válido.');
  if (!isVEMobile(phone)) fail('Ingresa un teléfono válido (ej. 0414-1234567).');
  const pw = passwordIssue(password); if (pw) fail(pw);
  const user = mutate((db) => {
    if (db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) fail('Ya existe una cuenta con ese correo.');
    const u = { id: uid('u'), role: 'client', name: name.trim(), email: email.trim(), phone: phone.trim(), idDoc: '', passwordHash: demoHash(password), createdAt: new Date().toISOString() };
    db.users.push(u);
    notify(db, u.id, 'info', 'Bienvenido a BarbApp', 'Tu primera cita tiene 20% de descuento. Se aplica automáticamente.');
    return u;
  });
  window.localStorage.setItem(SESSION_KEY, user.id);
  return publicUser(user);
}

/** Siempre responde igual exista o no el correo (evita enumerar usuarios). En el demo devuelve el enlace para simular el email. */
export async function requestPasswordReset(email) {
  await delay();
  if (!isEmail(email)) fail('Ingresa un correo válido.');
  return mutate((db) => {
    const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u) return { demoToken: null };
    const token = uid('rst');
    db.resetTokens = db.resetTokens.filter((t) => t.userId !== u.id);
    db.resetTokens.push({ token, userId: u.id, expiresAt: Date.now() + 30 * 60000 });
    return { demoToken: token };
  });
}

export async function resetPassword({ token, password }) {
  await delay();
  const pw = passwordIssue(password); if (pw) fail(pw);
  mutate((db) => {
    const t = db.resetTokens.find((x) => x.token === token);
    if (!t || t.expiresAt < Date.now()) fail('El enlace venció o no es válido. Pide uno nuevo.');
    find(db.users, t.userId).passwordHash = demoHash(password);
    db.resetTokens = db.resetTokens.filter((x) => x.token !== token);
  });
}

export async function updateProfile(userId, { name, phone, idDoc, email }) {
  await delay();
  if (!name || name.trim().length < 3) fail('Escribe tu nombre completo.');
  if (!isEmail(email)) fail('Ingresa un correo válido.');
  if (!isVEMobile(phone)) fail('Ingresa un teléfono válido (ej. 0414-1234567).');
  return publicUser(mutate((db) => {
    const u = find(db.users, userId);
    if (db.users.some((x) => x.id !== userId && x.email.toLowerCase() === email.trim().toLowerCase())) fail('Ese correo ya está en uso.');
    Object.assign(u, { name: name.trim(), phone: phone.trim(), idDoc: (idDoc || '').trim(), email: email.trim() });
    return u;
  }));
}

export async function changePassword(userId, { current, next }) {
  await delay();
  const pw = passwordIssue(next); if (pw) fail(pw);
  mutate((db) => {
    const u = find(db.users, userId);
    if (u.passwordHash !== demoHash(current || '')) fail('La contraseña actual no coincide.');
    u.passwordHash = demoHash(next);
  });
}

// ── Reservas ────────────────────────────────────────────────────────────────
export async function createBooking({ userId, serviceId, barberId, date, time, promoCode, payment }) {
  await delay(350);
  return mutate((db) => {
    find(db.users, userId);
    const service = find(db.services, serviceId); if (!service.active) fail('Ese servicio no está disponible.');
    const barber = find(db.barbers, barberId); if (!barber.active || !barber.serviceIds.includes(serviceId)) fail('Ese barbero no ofrece el servicio elegido.');
    if (!isSlotAvailable({ barber, durationMin: service.duration, dateISO: date, appointments: db.appointments, now: new Date() }, time)) {
      fail('Ese turno ya no está disponible. Elige otro horario.');
    }
    const errors = validatePayment(payment);
    if (Object.keys(errors).length) fail('Revisa los datos del pago: ' + Object.values(errors)[0]);

    const pricing = computePricing({ service, dateISO: date, isFirst: isFirstAppointment(userId, db.appointments), promos: db.promos, code: promoCode });
    const aId = uid('a'), pId = uid('pay');
    const appointment = {
      id: aId, userId, serviceId, barberId, date, time, duration: service.duration,
      price: pricing.subtotal, discount: pricing.discount, total: pricing.total, promoCode: pricing.applied?.code || null,
      status: 'pending', paymentId: pId, createdAt: new Date().toISOString(),
    };
    const pay = {
      id: pId, appointmentId: aId, userId, method: payment.method, amount: pricing.total, status: 'pending',
      data: payment.data, proof: payment.proof || null, createdAt: new Date().toISOString(), reviewedAt: null, reviewNote: '',
    };
    db.appointments.push(appointment);
    db.payments.push(pay);
    notify(db, userId, 'booking', 'Reserva recibida', `${service.name} con ${barber.name}, ${fmtDate(date)} a las ${fmtTime(time)}. Pago pendiente de validación.`, { appointmentId: aId });
    return { appointment, payment: pay, pricing };
  });
}

export async function cancelAppointment({ actorId, appointmentId }) {
  await delay();
  return mutate((db) => {
    const actor = find(db.users, actorId);
    const a = find(db.appointments, appointmentId);
    const isAdmin = actor.role === 'admin';
    if (!isAdmin && a.userId !== actorId) fail('No puedes cancelar esta cita.');
    if (a.status !== 'pending' && a.status !== 'confirmed') fail('Esta cita ya no se puede cancelar.');
    if (!isAdmin && !canModify(a)) fail(modifyBlockReason(a));
    a.status = 'cancelled';
    const p = db.payments.find((x) => x.id === a.paymentId);
    if (p) p.status = p.status === 'approved' && p.method !== 'efectivo' ? 'refund_pending' : 'cancelled';
    const msg = p?.status === 'refund_pending' ? ' Coordinaremos el reembolso contigo.' : '';
    notify(db, a.userId, 'cancelled', 'Cita cancelada', `Tu cita del ${fmtDate(a.date)} a las ${fmtTime(a.time)} fue cancelada.${msg}`, { appointmentId: a.id });
    return a;
  });
}

export async function rescheduleAppointment({ actorId, appointmentId, barberId, date, time }) {
  await delay();
  return mutate((db) => {
    const actor = find(db.users, actorId);
    const a = find(db.appointments, appointmentId);
    const isAdmin = actor.role === 'admin';
    if (!isAdmin && a.userId !== actorId) fail('No puedes modificar esta cita.');
    if (!isAdmin && !canModify(a)) fail(modifyBlockReason(a));
    if (a.status !== 'pending' && a.status !== 'confirmed') fail('Esta cita ya no se puede modificar.');
    const barber = find(db.barbers, barberId || a.barberId);
    if (!barber.active || !barber.serviceIds.includes(a.serviceId)) fail('Ese barbero no ofrece el servicio.');
    if (!isSlotAvailable({ barber, durationMin: a.duration, dateISO: date, appointments: db.appointments, now: new Date(), ignoreAppointmentId: a.id }, time)) {
      fail('Ese turno ya no está disponible. Elige otro horario.');
    }
    Object.assign(a, { barberId: barber.id, date, time });
    notify(db, a.userId, 'rescheduled', 'Cita reprogramada', `Nuevo horario: ${fmtDate(date)} a las ${fmtTime(time)} con ${barber.name}.`, { appointmentId: a.id });
    return a;
  });
}

export async function submitReview({ userId, appointmentId, rating, comment }) {
  await delay();
  return mutate((db) => {
    const a = find(db.appointments, appointmentId);
    if (a.userId !== userId) fail('No puedes calificar esta cita.');
    if (a.status !== 'completed') fail('Solo puedes calificar citas completadas.');
    if (db.reviews.some((r) => r.appointmentId === appointmentId)) fail('Ya calificaste esta cita.');
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) fail('Elige de 1 a 5 estrellas.');
    const text = (comment || '').trim().slice(0, 500);
    const r = { id: uid('r'), appointmentId, userId, barberId: a.barberId, rating, comment: text, createdAt: new Date().toISOString() };
    db.reviews.push(r);
    return r;
  });
}

export async function resubmitPayment({ userId, paymentId, payment }) {
  await delay(350);
  return mutate((db) => {
    const p = find(db.payments, paymentId);
    if (p.userId !== userId) fail('No puedes modificar este pago.');
    if (p.status !== 'rejected') fail('Este pago no admite cambios.');
    const errors = validatePayment(payment);
    if (Object.keys(errors).length) fail('Revisa los datos del pago: ' + Object.values(errors)[0]);
    Object.assign(p, { method: payment.method, data: payment.data, proof: payment.proof || null, status: 'pending', reviewedAt: null, reviewNote: '' });
    return p;
  });
}

export async function markNotificationsRead(userId) {
  mutate((db) => { db.notifications.forEach((n) => { if (n.userId === userId) n.read = true; }); });
}

// ── Administración ──────────────────────────────────────────────────────────
export async function reviewPayment({ actorId, paymentId, decision, note }) {
  await delay();
  return mutate((db) => {
    requireAdmin(db, actorId);
    const p = find(db.payments, paymentId);
    const a = find(db.appointments, p.appointmentId);
    if (p.status !== 'pending') fail('Este pago ya fue revisado.');
    if (decision === 'approve') {
      p.status = 'approved';
      if (a.status === 'pending') a.status = 'confirmed';
      notify(db, a.userId, 'payment_approved', 'Pago aprobado', `Tu cita del ${fmtDate(a.date)} a las ${fmtTime(a.time)} quedó confirmada.`, { appointmentId: a.id });
    } else if (decision === 'reject') {
      if (!note || note.trim().length < 3) fail('Indica el motivo del rechazo para que el cliente pueda corregirlo.');
      p.status = 'rejected';
      p.reviewNote = note.trim();
      notify(db, a.userId, 'payment_rejected', 'Pago rechazado', `${note.trim()} Puedes enviar un nuevo comprobante desde tus citas.`, { appointmentId: a.id });
    } else fail('Decisión no válida.');
    p.reviewedAt = new Date().toISOString();
    return p;
  });
}

const TRANSITIONS = { pending: ['confirmed', 'cancelled'], confirmed: ['completed', 'cancelled'], completed: [], cancelled: [] };

export async function setAppointmentStatus({ actorId, appointmentId, status }) {
  await delay();
  return mutate((db) => {
    requireAdmin(db, actorId);
    const a = find(db.appointments, appointmentId);
    if (!TRANSITIONS[a.status]?.includes(status)) fail('Ese cambio de estado no es válido.');
    const p = db.payments.find((x) => x.id === a.paymentId);
    if (status === 'cancelled') {
      if (p) p.status = p.status === 'approved' && p.method !== 'efectivo' ? 'refund_pending' : 'cancelled';
      notify(db, a.userId, 'cancelled', 'Cita cancelada', `Tu cita del ${fmtDate(a.date)} a las ${fmtTime(a.time)} fue cancelada por la barbería.`, { appointmentId: a.id });
    } else {
      if (p && p.status === 'pending') {
        if (p.method !== 'efectivo' && status === 'confirmed') fail('Valida primero el comprobante en la pestaña Pagos.');
        p.status = 'approved'; p.reviewedAt = new Date().toISOString(); // efectivo: se cobra en la barbería
      }
      if (p && p.status === 'rejected') fail('El pago fue rechazado. Pide un nuevo comprobante o cancela la cita.');
      if (status === 'confirmed') notify(db, a.userId, 'confirmed', 'Cita confirmada', `Te esperamos el ${fmtDate(a.date)} a las ${fmtTime(a.time)}.`, { appointmentId: a.id });
      if (status === 'completed') notify(db, a.userId, 'completed', 'Gracias por tu visita', 'Suma puntos calificando tu servicio.', { appointmentId: a.id });
    }
    a.status = status;
    return a;
  });
}

function upsert(list, item, make) {
  const i = list.findIndex((x) => x.id === item.id);
  if (i >= 0) { list[i] = { ...list[i], ...item }; return list[i]; }
  const created = make(item); list.push(created); return created;
}

export async function saveService({ actorId, service }) {
  await delay(150);
  return mutate((db) => {
    requireAdmin(db, actorId);
    if (!service.name?.trim()) fail('El servicio necesita un nombre.');
    if (!(service.price > 0)) fail('El precio debe ser mayor que 0.');
    if (!(service.duration >= 15 && service.duration <= 240)) fail('La duración debe estar entre 15 y 240 minutos.');
    return upsert(db.services, service, (s) => ({ ...s, id: uid('s') }));
  });
}
export async function deleteService({ actorId, id }) {
  await delay(150);
  return mutate((db) => {
    requireAdmin(db, actorId);
    const used = db.appointments.some((a) => a.serviceId === id);
    if (used) { find(db.services, id).active = false; return { archived: true }; }
    db.services = db.services.filter((s) => s.id !== id);
    db.barbers.forEach((b) => { b.serviceIds = b.serviceIds.filter((x) => x !== id); });
    return { archived: false };
  });
}

export async function saveBarber({ actorId, barber }) {
  await delay(150);
  return mutate((db) => {
    requireAdmin(db, actorId);
    if (!barber.name?.trim()) fail('El barbero necesita un nombre.');
    for (const [d, s] of Object.entries(barber.schedule || {})) {
      if (s.open && s.start >= s.end) fail(`Horario inválido el día ${d}: la hora de cierre debe ser posterior a la de apertura.`);
      if (s.open && s.breakStart && s.breakEnd && (s.breakStart >= s.breakEnd || s.breakStart < s.start || s.breakEnd > s.end)) fail(`El descanso debe estar dentro del horario (día ${d}).`);
    }
    return upsert(db.barbers, barber, (b) => ({ ...b, id: uid('b'), daysOff: [] }));
  });
}
export async function deleteBarber({ actorId, id }) {
  await delay(150);
  return mutate((db) => {
    requireAdmin(db, actorId);
    const used = db.appointments.some((a) => a.barberId === id);
    if (used) { find(db.barbers, id).active = false; return { archived: true }; }
    db.barbers = db.barbers.filter((b) => b.id !== id);
    return { archived: false };
  });
}

export async function savePromo({ actorId, promo }) {
  await delay(150);
  return mutate((db) => {
    requireAdmin(db, actorId);
    if (!promo.title?.trim() || !promo.code?.trim()) fail('La promoción necesita título y código.');
    if (!(promo.value > 0 && promo.value <= 100)) fail('El descuento debe estar entre 1% y 100%.');
    const code = promo.code.trim().toUpperCase();
    if (db.promos.some((p) => p.id !== promo.id && p.code.toUpperCase() === code)) fail('Ya existe una promoción con ese código.');
    return upsert(db.promos, { ...promo, code }, (p) => ({ ...p, id: uid('p'), type: 'percent' }));
  });
}
export async function deletePromo({ actorId, id }) {
  await delay(150);
  mutate((db) => { requireAdmin(db, actorId); db.promos = db.promos.filter((p) => p.id !== id); });
}

export async function saveSettings({ actorId, settings }) {
  await delay(150);
  mutate((db) => {
    requireAdmin(db, actorId);
    if (!(settings.exchangeRate > 0)) fail('La tasa de cambio debe ser mayor que 0.');
    db.settings = settings;
  });
}

export { methodLabel, toISODate };
