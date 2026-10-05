import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CalendarX, Star, Lock, CreditCard, RefreshCw, Eye } from 'lucide-react';
import { Modal, PayBadge, StarInput, StatusBadge, Avatar, Field, PayMethod } from './ui.jsx';
import SlotPicker from './SlotPicker.jsx';
import PaymentForm from './PaymentForm.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDB } from '../context/DataContext.jsx';
import { useNow } from '../hooks.js';
import { cancelAppointment, rescheduleAppointment, submitReview, resubmitPayment } from '../api/api.js';
import { canModify, modifyBlockReason } from '../lib/availability.js';
import { fmtDate, fmtTime, relativeDay } from '../lib/dates.js';
import { usd } from '../lib/pricing.js';
import { REVIEW_POINTS } from '../lib/loyalty.js';
import { emptyPaymentData, validatePayment } from '../lib/paymentRules.js';

function CancelModal({ appt, actorId, onClose }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try { await cancelAppointment({ actorId, appointmentId: appt.id }); toast.ok('Cita cancelada'); onClose(); }
    catch (e) { toast.err(e.message); setBusy(false); }
  };
  return (
    <Modal title="¿Cancelar esta cita?" onClose={onClose} footer={<><button className="btn btn-line" onClick={onClose}>Mantener cita</button><button className="btn btn-danger" disabled={busy} onClick={go}>{busy ? 'Cancelando…' : 'Sí, cancelar'}</button></>}>
      <p className="muted">Se liberará el turno del {fmtDate(appt.date)} a las {fmtTime(appt.time)}. {appt.paymentApproved && 'Como ya pagaste, coordinaremos el reembolso contigo.'}</p>
    </Modal>
  );
}

function RescheduleModal({ appt, actorId, onClose }) {
  const db = useDB();
  const toast = useToast();
  const options = db.barbers.filter((b) => b.active && b.serviceIds.includes(appt.serviceId));
  const [barberId, setBarberId] = useState(appt.barberId);
  const [pick, setPick] = useState({ date: appt.date, time: appt.time });
  const [busy, setBusy] = useState(false);
  const barber = db.barbers.find((b) => b.id === barberId);
  const unchanged = barberId === appt.barberId && pick.date === appt.date && pick.time === appt.time;
  const go = async () => {
    setBusy(true);
    try { await rescheduleAppointment({ actorId, appointmentId: appt.id, barberId, ...pick }); toast.ok('Cita reprogramada'); onClose(); }
    catch (e) { toast.err(e.message); setBusy(false); }
  };
  return (
    <Modal wide title="Reprogramar cita" onClose={onClose} footer={<><button className="btn btn-line" onClick={onClose}>Cerrar</button><button className="btn btn-gold" disabled={busy || !pick.time || unchanged} onClick={go}>{busy ? 'Guardando…' : 'Guardar nuevo horario'}</button></>}>
      <div className="stack-lg">
        <Field label="Barbero" htmlFor="rs-barber">
          <select id="rs-barber" className="select" value={barberId} onChange={(e) => { setBarberId(e.target.value); setPick({ date: pick.date, time: null }); }}>
            {options.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>
        <SlotPicker barber={barber} durationMin={appt.duration} appointments={db.appointments} date={pick.date} time={pick.time} ignoreAppointmentId={appt.id} onChange={setPick} />
      </div>
    </Modal>
  );
}

function ReviewModal({ appt, barber, userId, onClose }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try { await submitReview({ userId, appointmentId: appt.id, rating, comment }); toast.ok(`¡Gracias! Sumaste ${REVIEW_POINTS} puntos`); onClose(); }
    catch (e) { toast.err(e.message); setBusy(false); }
  };
  return (
    <Modal title={`Califica tu cita con ${barber.name.split(' ')[0]}`} onClose={onClose} footer={<><button className="btn btn-line" onClick={onClose}>Ahora no</button><button className="btn btn-gold" disabled={!rating || busy} onClick={go}>{busy ? 'Enviando…' : 'Enviar reseña'}</button></>}>
      <div className="stack">
        <StarInput value={rating} onChange={setRating} />
        <Field label="Cuéntanos cómo te fue (opcional)" htmlFor="rv-text" hint={`${comment.length}/500. Ganas ${REVIEW_POINTS} puntos por reseñar.`}>
          <textarea id="rv-text" className="textarea" maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="¿Qué te gustó? ¿Algo que mejorar?" />
        </Field>
      </div>
    </Modal>
  );
}

function ResubmitModal({ payment, amount, userId, onClose }) {
  const db = useDB();
  const toast = useToast();
  const [value, setValue] = useState({ method: payment.method === 'efectivo' ? 'pago_movil' : payment.method, data: { ...emptyPaymentData(), ...payment.data }, proof: null });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const errors = validatePayment(value);
  const go = async () => {
    setTried(true);
    if (Object.keys(errors).length) return;
    setBusy(true);
    try { await resubmitPayment({ userId, paymentId: payment.id, payment: value }); toast.ok('Comprobante enviado. Queda pendiente de validación.'); onClose(); }
    catch (e) { toast.err(e.message); setBusy(false); }
  };
  return (
    <Modal wide title="Enviar un nuevo comprobante" onClose={onClose} footer={<><button className="btn btn-line" onClick={onClose}>Cancelar</button><button className="btn btn-gold" disabled={busy} onClick={go}>{busy ? 'Enviando…' : 'Enviar comprobante'}</button></>}>
      <div className="stack">
        {payment.reviewNote && <div className="alert alert-err">Motivo del rechazo: {payment.reviewNote}</div>}
        <PaymentForm amount={amount} settings={db.settings} value={value} onChange={setValue} errors={tried ? errors : {}} />
      </div>
    </Modal>
  );
}

/** Tarjeta de cita del cliente con sus acciones (cancelar, reprogramar, calificar, reenviar pago). */
export default function AppointmentCard({ appt, userId }) {
  const db = useDB();
  const now = useNow(30000);
  const [modal, setModal] = useState(null);
  const service = db.services.find((s) => s.id === appt.serviceId);
  const barber = db.barbers.find((b) => b.id === appt.barberId);
  const payment = db.payments.find((p) => p.id === appt.paymentId);
  const review = db.reviews.find((r) => r.appointmentId === appt.id);
  const editable = canModify(appt, now);
  const blocked = useMemo(() => modifyBlockReason(appt, now), [appt, now]);
  const active = appt.status === 'pending' || appt.status === 'confirmed';
  const enriched = { ...appt, paymentApproved: payment?.status === 'approved' && payment?.method !== 'efectivo' };

  return (
    <article className="card appt">
      <div className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
        <Avatar src={barber?.image} name={barber?.name} size={48} />
        <div className="appt-main grow">
          <div className="row" style={{ gap: 8 }}><span className="appt-when">{active ? relativeDay(appt.date, now) : fmtDate(appt.date, { day: 'numeric', month: 'short', year: 'numeric' })} · {fmtTime(appt.time)}</span><StatusBadge status={appt.status} /></div>
          <span>{service?.name || 'Servicio'} con {barber?.name || 'barbero'}</span>
          <span className="muted small num">
            {appt.discount > 0 ? <><s>{usd(appt.price)}</s> {usd(appt.total)} (−{usd(appt.discount)}{appt.promoCode ? `, ${appt.promoCode}` : ''})</> : usd(appt.total)}
            {payment && <> · <PayMethod method={payment.method} /></>}
          </span>
          <div className="row" style={{ gap: 6, marginTop: 4 }}><PayBadge payment={payment} /></div>
        </div>
      </div>
      <div className="stack" style={{ gap: '0.5rem' }}>
        {payment?.status === 'rejected' && <div className="appt-reject">Tu pago fue rechazado: {payment.reviewNote}</div>}
        <div className="appt-actions">
          {payment?.status === 'rejected' && <button className="btn btn-gold btn-sm" onClick={() => setModal('pay')}><CreditCard size={15} /> Reenviar pago</button>}
          {active && <>
            <button className="btn btn-line btn-sm" disabled={!editable} onClick={() => setModal('resched')}><RefreshCw size={15} /> Reprogramar</button>
            <button className="btn btn-danger btn-sm" disabled={!editable} onClick={() => setModal('cancel')}><CalendarX size={15} /> Cancelar</button>
          </>}
          {appt.status === 'completed' && !review && <button className="btn btn-gold btn-sm" onClick={() => setModal('review')}><Star size={15} /> Calificar</button>}
          {appt.status === 'completed' && review && <span className="row small muted" style={{ gap: 4 }}><Star size={14} fill="var(--gold)" color="var(--gold)" /> Calificaste {review.rating}/5</span>}
        </div>
        {active && !editable && <div className="appt-note"><Lock size={13} />{blocked}</div>}
      </div>
      {modal === 'cancel' && <CancelModal appt={enriched} actorId={userId} onClose={() => setModal(null)} />}
      {modal === 'resched' && <RescheduleModal appt={appt} actorId={userId} onClose={() => setModal(null)} />}
      {modal === 'review' && <ReviewModal appt={appt} barber={barber} userId={userId} onClose={() => setModal(null)} />}
      {modal === 'pay' && <ResubmitModal payment={payment} amount={appt.total} userId={userId} onClose={() => setModal(null)} />}
    </article>
  );
}
