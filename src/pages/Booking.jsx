import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Scissors, User, CalendarDays, Clock, Check, ArrowLeft, ArrowRight, Tag, CheckCircle2, Loader2, Heart } from 'lucide-react';
import { useDB } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentTitle, useNow } from '../hooks.js';
import { createBooking } from '../api/api.js';
import { barberRating } from '../lib/metrics.js';
import { favoriteBarber } from '../lib/loyalty.js';
import { computePricing, isFirstAppointment, usd, bs } from '../lib/pricing.js';
import { fmtDate, fmtTime } from '../lib/dates.js';
import { isSlotAvailable } from '../lib/availability.js';
import { emptyPaymentData, validatePayment, methodLabel } from '../lib/paymentRules.js';
import { Media, Stars, Field } from '../components/ui.jsx';
import SlotPicker from '../components/SlotPicker.jsx';
import PaymentForm from '../components/PaymentForm.jsx';

const STEPS = ['Servicio', 'Barbero', 'Horario', 'Pago'];

function Ticket({ service, barber, date, time, pricing, rate }) {
  return (
    <div className="ticket">
      <div className="ticket-top">
        <h3><Scissors size={17} className="gold" /> Tu cita</h3>
        <div className="ticket-line"><Scissors size={16} /><div>{service ? <><strong>{service.name}</strong><small>{service.duration} min</small></> : <span className="pending">Elige un servicio</span>}</div></div>
        <div className="ticket-line"><User size={16} /><div>{barber ? <strong>{barber.name}</strong> : <span className="pending">Elige un barbero</span>}</div></div>
        <div className="ticket-line"><CalendarDays size={16} /><div>{date && time ? <><strong>{fmtDate(date)}</strong><small>{fmtTime(time)}</small></> : <span className="pending">Elige fecha y hora</span>}</div></div>
      </div>
      <div className="tear" />
      <div className="ticket-bottom">
        {service ? (<>
          <div className="sum-row"><span>Servicio</span><span className="num">{usd(pricing.subtotal)}</span></div>
          {pricing.discount > 0 && <div className="sum-row disc"><span>{pricing.applied.title} (−{pricing.pct}%)</span><span className="num">−{usd(pricing.discount)}</span></div>}
          <div className="sum-row total"><span>Total</span><span className="num">{usd(pricing.total)}</span></div>
          <div className="sum-row"><span /><span className="num small">{bs(pricing.total, rate)}</span></div>
        </>) : <p className="muted small">El total aparecerá aquí.</p>}
      </div>
    </div>
  );
}

export default function Booking() {
  useDocumentTitle('Reservar');
  const db = useDB();
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const now = useNow(30000);
  const [params, setParams] = useSearchParams();

  const sel = { servicio: params.get('servicio') || '', barbero: params.get('barbero') || '', fecha: params.get('fecha') || '', hora: params.get('hora') || '' };
  const service = db.services.find((s) => s.id === sel.servicio && s.active) || null;
  const barbersFor = useMemo(() => db.barbers.filter((b) => b.active && (!service || b.serviceIds.includes(service.id))), [db.barbers, service]);
  const barber = barbersFor.find((b) => b.id === sel.barbero) || null;

  // Si el turno de la URL ya no está libre (otro cliente lo tomó), se descarta.
  const slotOk = service && barber && sel.fecha && sel.hora && isSlotAvailable({ barber, durationMin: service.duration, dateISO: sel.fecha, appointments: db.appointments, now }, sel.hora);
  const date = slotOk ? sel.fecha : sel.fecha && !sel.hora ? sel.fecha : '';
  const time = slotOk ? sel.hora : '';

  const initialStep = !service ? 0 : !barber ? 1 : !time ? 2 : 3;
  const [step, setStep] = useState(initialStep);
  const [code, setCode] = useState('');
  const [payment, setPayment] = useState({ method: 'pago_movil', data: emptyPaymentData(), proof: null });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const update = (patch) => {
    const next = { ...sel, ...patch };
    const p = {}; Object.entries(next).forEach(([k, v]) => { if (v) p[k] = v; });
    setParams(p, { replace: true });
  };
  useEffect(() => { if (step > initialStep) setStep(initialStep); }, [initialStep]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (sel.hora && !slotOk && service && barber) toast.info('Ese turno ya no está disponible. Elige otro horario.'); }, []); // eslint-disable-line

  const isFirst = user ? isFirstAppointment(user.id, db.appointments) : true;
  const pricing = useMemo(
    () => (service ? computePricing({ service, dateISO: date || new Date().toISOString().slice(0, 10), isFirst, promos: db.promos, code }) : { subtotal: 0, discount: 0, total: 0, pct: 0, applied: null }),
    [service, date, isFirst, db.promos, code],
  );
  const fav = user ? favoriteBarber({ appointments: db.appointments, reviews: db.reviews, userId: user.id, now }) : null;
  const errors = validatePayment(payment);
  const rate = db.settings.exchangeRate;

  const canNext = [!!service, !!barber, !!time][step];
  const goStep = (i) => { if (i <= initialStep) setStep(i); };

  const confirm = async () => {
    if (!user) { toast.info('Inicia sesión para confirmar tu reserva. Guardamos tu selección.'); nav('/login', { state: { from: loc.pathname + loc.search } }); return; }
    setTried(true);
    if (Object.keys(errors).length) { toast.err('Revisa los datos del pago.'); return; }
    setBusy(true);
    try {
      const res = await createBooking({ userId: user.id, serviceId: service.id, barberId: barber.id, date, time, promoCode: code, payment });
      setDone(res);
    } catch (e) { toast.err(e.message); setBusy(false); if (/turno/.test(e.message)) { update({ hora: '' }); setStep(2); } }
  };

  if (done) {
    const p = done.payment, a = done.appointment;
    return (
      <div className="page container" style={{ maxWidth: 560 }}>
        <div className="card card-pad success">
          <span className="seal"><CheckCircle2 size={36} /></span>
          <h1 style={{ fontSize: '1.7rem' }}>¡Reserva recibida!</h1>
          <p className="muted">{service.name} con {barber.name}<br /><strong style={{ color: 'var(--text)' }}>{fmtDate(a.date)} a las {fmtTime(a.time)}</strong></p>
          <div className="alert alert-warn" style={{ textAlign: 'left' }}>
            <Clock size={18} />
            <span>{p.method === 'efectivo' ? 'Pagas en la barbería. Tu cita queda pendiente hasta que el equipo la confirme.' : 'Tu pago está pendiente de validación. Te avisaremos cuando quede confirmada.'}</span>
          </div>
          <div className="sum-row total" style={{ width: '100%' }}><span>Total ({methodLabel(p.method)})</span><span>{usd(a.total)}</span></div>
          <div className="row" style={{ justifyContent: 'center' }}>
            <Link to="/perfil" className="btn btn-gold">Ver mis citas</Link>
            <button className="btn btn-line" onClick={() => { setParams({}); setDone(null); setStep(0); setPayment({ method: 'pago_movil', data: emptyPaymentData(), proof: null }); setTried(false); setBusy(false); setCode(''); }}>Reservar otra</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page container">
      <div className="page-head"><h1>Reserva tu cita</h1></div>
      <ol className="steps" style={{ listStyle: 'none', padding: 0 }} aria-label="Pasos de la reserva">
        {STEPS.map((s, i) => (
          <li key={s}><button className={`step ${i === step ? 'current' : i < step ? 'done' : ''}`} disabled={i > initialStep} onClick={() => goStep(i)} aria-current={i === step ? 'step' : undefined} style={{ width: '100%' }}>
            <i>{i < step ? <Check size={15} /> : i + 1}</i>{s}
          </button></li>
        ))}
      </ol>

      <div className="book-layout">
        <section aria-live="polite">
          {step === 0 && (
            <div className="stack">
              <h2>¿Qué te vas a hacer?</h2>
              {db.services.filter((s) => s.active).map((s) => (
                <button key={s.id} className={`pick ${sel.servicio === s.id ? 'is-selected' : ''}`} onClick={() => { update({ servicio: s.id, barbero: sel.barbero && db.barbers.find((b) => b.id === sel.barbero)?.serviceIds.includes(s.id) ? sel.barbero : '', hora: '' }); setStep(1); }}>
                  <Media className="thumb" src={s.image} alt="" />
                  <span className="pick-main"><strong>{s.name}</strong><span className="muted small">{s.duration} min · {s.description}</span></span>
                  <span className="price" style={{ fontSize: '1.15rem' }}>{usd(s.price)}</span>
                  <span className="check"><Check size={14} /></span>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="stack">
              <h2>¿Con quién?</h2>
              {barbersFor.length === 0 && <p className="muted">Ningún barbero ofrece este servicio por ahora.</p>}
              {barbersFor.map((b) => {
                const r = barberRating(db, b.id);
                return (
                  <button key={b.id} className={`pick ${sel.barbero === b.id ? 'is-selected' : ''}`} onClick={() => { update({ barbero: b.id, hora: '' }); setStep(2); }}>
                    <Media className="thumb" src={b.image} alt="" icon={User} />
                    <span className="pick-main">
                      <strong>{b.name} {fav?.barberId === b.id && <span className="badge badge-gold" style={{ marginLeft: 6 }}><Heart size={11} fill="currentColor" /> Tu favorito</span>}</strong>
                      <span className="muted small">{b.specialty}</span>
                      {r.count > 0 && <span className="row" style={{ gap: 6 }}><Stars value={r.avg} size={13} /><span className="small muted num">{r.avg.toFixed(1)} ({r.count})</span></span>}
                    </span>
                    <span className="check"><Check size={14} /></span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && barber && service && (
            <div className="stack">
              <h2>¿Cuándo?</h2>
              <div className="card card-pad">
                <SlotPicker barber={barber} durationMin={service.duration} appointments={db.appointments} date={date} time={time} onChange={({ date: d, time: t }) => update({ fecha: d, hora: t || '' })} />
              </div>
            </div>
          )}

          {step === 3 && service && (
            <div className="stack">
              <h2>Confirma y paga</h2>
              {!user && <div className="alert alert-info"><User size={18} /><span>Para confirmar necesitas una cuenta. <Link to="/registro" state={{ from: loc.pathname + loc.search }} className="gold">Créala</Link> o <Link to="/login" state={{ from: loc.pathname + loc.search }} className="gold">inicia sesión</Link>: tu selección se conserva.</span></div>}
              {user && isFirst && pricing.applied?.auto && <div className="alert alert-ok"><Tag size={18} />Es tu primera cita: se aplicó {pricing.pct}% de descuento.</div>}
              <div className="card card-pad stack">
                <Field label="¿Tienes un código de promoción?" error={pricing.codeError} htmlFor="promo" hint={code && !pricing.codeError && pricing.applied?.code === code.trim().toUpperCase() ? `Código aplicado: −${pricing.pct}%` : 'Opcional. No se suma a otros descuentos: se aplica el mejor.'}>
                  <input id="promo" className={`input ${pricing.codeError ? 'is-invalid' : ''}`} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Ej. MARTES15" autoCapitalize="characters" />
                </Field>
              </div>
              <div className="card card-pad">
                <PaymentForm amount={pricing.total} settings={db.settings} value={payment} onChange={setPayment} errors={tried ? errors : {}} />
              </div>
              <div className="only-mobile"><Ticket service={service} barber={barber} date={date} time={time} pricing={pricing} rate={rate} /></div>
            </div>
          )}

          <div className="book-nav">
            <button className="btn btn-line" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={17} /> Atrás</button>
            {step < 3
              ? <button className="btn btn-gold" disabled={!canNext} onClick={() => setStep(step + 1)}>Continuar <ArrowRight size={17} /></button>
              : <button className="btn btn-gold btn-lg" disabled={busy || !service || !time} onClick={confirm}>{busy && <Loader2 size={18} className="spin" />}{user ? (payment.method === 'efectivo' ? 'Reservar' : 'Enviar pago y reservar') : 'Iniciar sesión para reservar'}</button>}
          </div>
        </section>

        <aside className="ticket-col" aria-label="Resumen de tu cita">
          <Ticket service={service} barber={barber} date={date} time={time} pricing={pricing} rate={rate} />
        </aside>
      </div>

      {service && step < 3 && (
        <div className="book-bar">
          <div className="grow"><strong>{usd(pricing.total)}</strong><span>{[service.name, barber?.name.split(' ')[0], time && fmtTime(time)].filter(Boolean).join(' · ')}</span></div>
        </div>
      )}
    </div>
  );
}
