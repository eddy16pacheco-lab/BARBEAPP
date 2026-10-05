import { addDays, startOfDay, toISODate, toDateTime } from '../lib/dates.js';
import { getDaySlots, scheduleFor } from '../lib/availability.js';
import { demoHash } from '../lib/security.js';

export const DB_VERSION = 1;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

const week = (spec) => {
  const o = {};
  for (let d = 0; d < 7; d++) {
    const s = spec[d];
    o[d] = s
      ? { open: true, start: s[0], end: s[1], breakStart: s[2] || null, breakEnd: s[3] || null }
      : { open: false, start: '09:00', end: '18:00', breakStart: null, breakEnd: null };
  }
  return o;
};

export function buildSeed(now = new Date()) {
  const rand = mulberry32(7);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  let seq = 0;
  const nid = (p) => `${p}_${(++seq).toString(36)}`;
  const today = startOfDay(now);
  const dayISO = (offset) => toISODate(addDays(today, offset));
  const stamp = (dateISO, hh = 9) => new Date(toDateTime(dateISO, `${String(hh).padStart(2, '0')}:00`)).toISOString();

  // ── Catálogo ──────────────────────────────────────────────────────────────
  const services = [
    { id: 's1', name: 'Corte clásico', description: 'Corte tradicional con tijera y máquina, lavado y acabado con producto.', price: 15, duration: 30, image: img('photo-1621605815971-fbc98d665033'), active: true, featured: true },
    { id: 's2', name: 'Corte + barba', description: 'Corte a tu medida y perfilado de barba con toalla caliente.', price: 25, duration: 45, image: img('photo-1503951914875-452162b0f3f1'), active: true, featured: true },
    { id: 's3', name: 'Afeitado con navaja', description: 'Afeitado al ras con toalla caliente, espuma artesanal y bálsamo.', price: 20, duration: 30, image: img('photo-1622287112023-94b7c56ed93a'), active: true, featured: true },
    { id: 's4', name: 'Corte infantil', description: 'Corte paciente y divertido para niños de hasta 12 años.', price: 12, duration: 30, image: img('photo-1612714102836-90cf34ad646d'), active: true, featured: false },
    { id: 's5', name: 'Tratamiento capilar', description: 'Hidratación profunda y masaje de cuero cabelludo.', price: 30, duration: 60, image: img('photo-1562322140-8baeececf3df'), active: true, featured: false },
    { id: 's6', name: 'Tinte y estilo', description: 'Cambio de color, decoloración y peinado final.', price: 45, duration: 90, image: img('photo-1560869713-7d0a2946e9b7'), active: true, featured: false },
  ];
  const byId = (arr, id) => arr.find((x) => x.id === id);

  const barbers = [
    { id: 'b1', name: 'Carlos Rodríguez', specialty: 'Cortes clásicos', bio: '12 años puliendo el corte tradicional. Fade limpio y tijera.', image: img('photo-1507003211169-0a1dd7228f2d'), active: true, serviceIds: ['s1', 's2', 's3', 's4'], daysOff: [], schedule: week({ 1: ['09:00', '19:00', '12:30', '13:30'], 2: ['09:00', '19:00', '12:30', '13:30'], 3: ['09:00', '19:00', '12:30', '13:30'], 4: ['09:00', '19:00', '12:30', '13:30'], 5: ['09:00', '19:00', '12:30', '13:30'], 6: ['09:00', '17:00', '12:30', '13:30'] }) },
    { id: 'b2', name: 'Miguel Ángel', specialty: 'Barba y afeitado', bio: 'Especialista en perfilado de barba y afeitado con navaja.', image: img('photo-1500648767791-00dcc994a43e'), active: true, serviceIds: ['s1', 's2', 's3'], daysOff: [], schedule: week({ 0: ['10:00', '15:00'], 2: ['10:00', '20:00', '13:00', '14:00'], 3: ['10:00', '20:00', '13:00', '14:00'], 4: ['10:00', '20:00', '13:00', '14:00'], 5: ['10:00', '20:00', '13:00', '14:00'], 6: ['10:00', '18:00', '13:00', '14:00'] }) },
    { id: 'b3', name: 'Javier Mendoza', specialty: 'Estilos modernos y color', bio: 'Degradados creativos, texturas y color. Siempre al día con las tendencias.', image: img('photo-1492562080023-ab3db95bfbce'), active: true, serviceIds: ['s1', 's2', 's4', 's5', 's6'], daysOff: [], schedule: week({ 1: ['09:00', '18:00', '12:00', '13:00'], 2: ['09:00', '18:00', '12:00', '13:00'], 3: ['09:00', '18:00', '12:00', '13:00'], 4: ['09:00', '18:00', '12:00', '13:00'], 5: ['09:00', '18:00', '12:00', '13:00'], 6: ['09:00', '15:00'] }) },
    { id: 'b4', name: 'Andrés Castillo', specialty: 'Corte y tratamientos', bio: 'Corte pulido y cuidado capilar. Ideal si buscas algo relajado.', image: img('photo-1472099645785-5658abf4ff4e'), active: true, serviceIds: ['s1', 's2', 's4', 's5'], daysOff: [], schedule: week({ 0: ['10:00', '15:00'], 3: ['11:00', '20:00', '15:00', '16:00'], 4: ['11:00', '20:00', '15:00', '16:00'], 5: ['11:00', '20:00', '15:00', '16:00'], 6: ['11:00', '20:00', '15:00', '16:00'] }) },
  ];

  const promos = [
    { id: 'p1', title: 'Primera cita', description: '20% de descuento en tu primera cita. Se aplica solo al reservar.', code: 'BIENVENIDO20', type: 'percent', value: 20, firstOnly: true, auto: true, days: [], validUntil: null, active: true, image: img('photo-1585747860715-2ba37e788b70') },
    { id: 'p2', title: 'Martes de barba', description: '15% en cualquier servicio los martes.', code: 'MARTES15', type: 'percent', value: 15, firstOnly: false, auto: false, days: [2], validUntil: null, active: true, image: img('photo-1599351431202-1e0f0137899a') },
    { id: 'p3', title: 'Trae un amigo', description: 'Comparte este código con un amigo: 10% para ambos.', code: 'AMIGOS10', type: 'percent', value: 10, firstOnly: false, auto: false, days: [], validUntil: dayISO(120), active: true, image: img('photo-1522075469751-3a6694fb2f61') },
  ];

  const settings = {
    exchangeRate: 100,
    shop: { name: 'BarbApp', address: 'Av. Principal de Las Mercedes, Caracas', phone: '0414-1234567', email: 'info@barbapp.com' },
    payment: {
      pagoMovil: { bank: '0102', phone: '0414-1234567', idDoc: 'J-123456789', holder: 'BarbApp C.A.' },
      transfer: { bank: '0102', account: '0102-0123-45-0123456789', idDoc: 'J-123456789', holder: 'BarbApp C.A.' },
      zelle: { email: 'pagos@barbapp.com', holder: 'BarbApp LLC' },
    },
  };

  // ── Usuarios ──────────────────────────────────────────────────────────────
  const users = [
    { id: 'u_admin', role: 'admin', name: 'Administrador', email: 'admin@barbapp.com', phone: '0414-1234567', idDoc: '', passwordHash: demoHash('admin123'), createdAt: stamp(dayISO(-400)) },
    { id: 'u_demo', role: 'client', name: 'Juan Pérez', email: 'cliente@barbapp.com', phone: '0412-5550142', idDoc: '12345678', passwordHash: demoHash('demo123'), createdAt: stamp(dayISO(-160)) },
  ];
  const fakeNames = ['Luis Fernández', 'Ana Torres', 'Pedro Gil', 'Rafael Núñez', 'Daniel Rojas', 'Sofía Márquez', 'Eduardo Silva', 'José Almeida', 'Gabriel Soto', 'Andrea Paredes', 'Víctor Lara', 'Mateo Briceño'];
  fakeNames.forEach((name, i) => {
    const offset = i < 4 ? -(3 + i * 6) : -(40 + i * 7); // 4 clientes "nuevos" (últimos 30 días)
    users.push({
      id: `u_${i + 1}`, role: 'client', name,
      email: `${name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}${i + 1}@correo.com`,
      phone: `04${pick(['12', '14', '16', '24', '26'])}-${String(Math.floor(rand() * 9e6) + 1e6)}`,
      idDoc: String(Math.floor(rand() * 2e7) + 8e6), passwordHash: demoHash('demo123'), createdAt: stamp(dayISO(offset)),
    });
  });
  const fakeClients = users.filter((u) => u.id.startsWith('u_') && /^u_\d+$/.test(u.id));

  // ── Citas, pagos, reseñas ─────────────────────────────────────────────────
  const appointments = [], payments = [], reviews = [], notifications = [];
  const epoch = new Date(0);

  function payData(method, dateISO) {
    const ref = String(Math.floor(rand() * 9e7) + 1e7);
    if (method === 'pago_movil') return { bank: pick(['0102', '0105', '0134', '0108']), phone: `04${pick(['12', '14', '16', '24'])}${String(Math.floor(rand() * 9e6) + 1e6)}`, idDoc: `V${Math.floor(rand() * 2e7) + 8e6}`, reference: ref, paymentDate: dateISO };
    if (method === 'transferencia') return { bank: pick(['0102', '0105', '0134']), holder: pick(fakeNames), reference: ref, paymentDate: dateISO };
    if (method === 'zelle') return { senderEmail: 'cliente@mail.com', reference: ref.slice(0, 8), paymentDate: dateISO };
    return {};
  }

  function book({ userId, barber, service, dateISO, time, status, method = 'pago_movil', payStatus, firstDiscount = false, createdDaysBefore = 2 }) {
    const pct = firstDiscount ? 20 : 0;
    const discount = Math.round(service.price * pct) / 100;
    const total = Math.round((service.price - discount) * 100) / 100;
    const aId = nid('a'), pId = nid('pay');
    const created = new Date(toDateTime(dateISO, time).getTime() - createdDaysBefore * 864e5).toISOString();
    appointments.push({ id: aId, userId, serviceId: service.id, barberId: barber.id, date: dateISO, time, duration: service.duration, price: service.price, discount, total, promoCode: firstDiscount ? 'BIENVENIDO20' : null, status, paymentId: pId, createdAt: created });
    const data = payData(method, dateISO);
    payments.push({
      id: pId, appointmentId: aId, userId, method, amount: total, status: payStatus, data,
      proof: method === 'efectivo' ? null : { name: 'comprobante-demo.svg', type: 'image/svg+xml', size: 1800, demo: { ref: data.reference || '00000000', amountBs: (total * settings.exchangeRate).toFixed(2) } },
      createdAt: created, reviewedAt: payStatus === 'pending' ? null : created, reviewNote: '',
    });
    return aId;
  }

  function review(apptId, rating, comment) {
    const a = byId(appointments, apptId);
    reviews.push({ id: nid('r'), appointmentId: apptId, userId: a.userId, barberId: a.barberId, rating, comment, createdAt: new Date(toDateTime(a.date, a.time).getTime() + 864e5).toISOString() });
  }

  const openDay = (barber, offset, dir) => {
    let o = offset;
    for (let i = 0; i < 8 && !scheduleFor(barber, dayISO(o)); i++) o += dir;
    return o;
  };
  const randomFree = (barber, service, dateISO) => {
    const free = getDaySlots({ barber, durationMin: service.duration, dateISO, appointments, now: epoch }).filter((s) => s.available);
    return free.length ? pick(free).time : null;
  };
  const bB = (id) => byId(barbers, id), sS = (id) => byId(services, id);

  // Historial explícito del cliente demo (barbero favorito = Carlos)
  const demoHistory = [
    ['b1', 's2', -10, null],
    ['b1', 's2', -38, [5, 'Siempre sale perfecto. Carlos no falla.']],
    ['b3', 's1', -24, [4, 'Muy buen degradado, un poco de espera.']],
    ['b1', 's1', -66, [5, 'Corte impecable y buena conversación.']],
    ['b2', 's3', -52, [3, 'Buen afeitado, pero empezó tarde.']],
    ['b3', 's5', -80, [5, 'El tratamiento me dejó el cabello increíble.']],
    ['b1', 's2', -97, [4, 'Primera visita. Muy buena atención.']],
    ['b1', 's2', -125, null],
    ['b3', 's6', -150, [5, 'Cambio de look total. Javier es un artista.']],
  ];
  demoHistory.forEach(([bid, sid, off, rev], i) => {
    const barber = bB(bid), service = sS(sid);
    const o = openDay(barber, off, -1);
    const dateISO = dayISO(o);
    const time = randomFree(barber, service, dateISO);
    const id = book({ userId: 'u_demo', barber, service, dateISO, time, status: 'completed', payStatus: 'approved', firstDiscount: i === demoHistory.length - 1, method: i % 3 === 0 ? 'efectivo' : 'pago_movil' });
    if (rev) review(id, rev[0], rev[1]);
  });

  // Próximas citas del cliente demo
  {
    const barber = bB('b1'), service = sS('s2');
    const dateISO = dayISO(openDay(barber, 3, 1));
    book({ userId: 'u_demo', barber, service, dateISO, time: randomFree(barber, service, dateISO), status: 'confirmed', payStatus: 'approved', createdDaysBefore: 1 });
    const b2 = bB('b3'), s2 = sS('s5');
    const d2 = dayISO(openDay(b2, 6, 1));
    book({ userId: 'u_demo', barber: b2, service: s2, dateISO: d2, time: randomFree(b2, s2, d2), status: 'pending', payStatus: 'pending', createdDaysBefore: 0 });
  }

  // Actividad del negocio: últimos 45 días + próxima semana
  const comments = {
    5: ['Excelente servicio, el mejor corte que he tenido.', 'Ambiente genial y atención de primera.', 'Puntual, limpio y muy profesional.', 'Salí encantado, vuelvo seguro.'],
    4: ['Muy buen corte, volveré.', 'Todo bien, solo esperé unos minutos.', 'Buen servicio y buen precio.'],
    3: ['Está bien, pero esperaba un poco más de detalle.'],
    2: ['El corte quedó disparejo de un lado.'],
    1: ['No quedé conforme con el resultado.'],
  };
  const ratingDraw = () => { const r = rand(); return r < 0.55 ? 5 : r < 0.85 ? 4 : r < 0.95 ? 3 : r < 0.98 ? 2 : 1; };
  const methodDraw = () => { const r = rand(); return r < 0.6 ? 'pago_movil' : r < 0.8 ? 'efectivo' : r < 0.95 ? 'transferencia' : 'zelle'; };

  for (let off = -45; off <= 7; off++) {
    const dateISO = dayISO(off);
    for (const barber of barbers) {
      if (!scheduleFor(barber, dateISO)) continue;
      const n = off <= 0 ? 1 + Math.floor(rand() * 3) : Math.floor(rand() * 3); // hoy y el pasado siempre tienen actividad
      for (let i = 0; i < n; i++) {
        const service = sS(pick(barber.serviceIds));
        const time = randomFree(barber, service, dateISO);
        if (!time) continue;
        const method = methodDraw();
        const isPast = toDateTime(dateISO, time) < now;
        const client = pick(fakeClients);
        if (isPast) {
          const cancelled = rand() < 0.08;
          const id = book({ userId: client.id, barber, service, dateISO, time, method, status: cancelled ? 'cancelled' : 'completed', payStatus: cancelled ? 'cancelled' : 'approved' });
          if (!cancelled && rand() < 0.5) { const r = ratingDraw(); review(id, r, pick(comments[r])); }
        } else {
          const pending = rand() < 0.3;
          book({ userId: client.id, barber, service, dateISO, time, method, status: pending ? 'pending' : 'confirmed', payStatus: pending ? 'pending' : 'approved', createdDaysBefore: 1 });
        }
      }
    }
  }
  appointments.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const upcomingDemo = appointments.find((a) => a.userId === 'u_demo' && a.status === 'confirmed' && a.date >= dayISO(0));
  notifications.push({ id: nid('n'), userId: 'u_demo', type: 'info', title: 'Bienvenido a BarbApp', body: 'Reserva en minutos y acumula puntos en cada visita.', createdAt: stamp(dayISO(-160)), read: true });
  if (upcomingDemo) notifications.push({ id: nid('n'), userId: 'u_demo', type: 'payment_approved', title: 'Pago aprobado', body: 'Tu cita quedó confirmada. Te esperamos.', createdAt: new Date(now.getTime() - 36e5).toISOString(), read: false, appointmentId: upcomingDemo.id });

  return { version: DB_VERSION, users, services, barbers, promos, appointments, payments, reviews, notifications, settings, resetTokens: [] };
}
