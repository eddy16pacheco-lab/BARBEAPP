import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarDays, Award, User, Heart, Star, Footprints, Crown, MessageSquare, Medal, Loader2, CalendarPlus } from 'lucide-react';
import { useDB } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentTitle } from '../hooks.js';
import { updateProfile, changePassword } from '../api/api.js';
import { computeBadges, favoriteBarber, getTier, userPoints, TIERS, REVIEW_POINTS } from '../lib/loyalty.js';
import { toDateTime } from '../lib/dates.js';
import { usd } from '../lib/pricing.js';
import { Avatar, Empty, Field, Media, Stars } from '../components/ui.jsx';
import AppointmentCard from '../components/AppointmentCard.jsx';
import { useNow } from '../hooks.js';
import { isEmail, isVEMobile } from '../lib/validators.js';

const BADGE_ICONS = { first: Footprints, regular: Medal, explorer: User, critic: MessageSquare, gold: Crown };

function Appointments({ user }) {
  const db = useDB();
  const now = useNow(60000);
  const mine = db.appointments.filter((a) => a.userId === user.id);
  const upcoming = mine.filter((a) => (a.status === 'pending' || a.status === 'confirmed') && toDateTime(a.date, a.time) >= new Date(now.getTime() - 3600000)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const past = mine.filter((a) => !upcoming.includes(a)).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const [filter, setFilter] = useState('all');
  const shown = past.filter((a) => filter === 'all' || a.status === filter);
  return (
    <div className="stack-lg">
      <section className="stack">
        <div className="row-between"><h2>Próximas citas</h2><Link to="/reservar" className="btn btn-gold btn-sm"><CalendarPlus size={16} /> Nueva cita</Link></div>
        {upcoming.length === 0 && <div className="card"><Empty icon={CalendarDays} title="No tienes citas próximas"><Link to="/reservar" className="gold">Reserva tu próximo corte</Link></Empty></div>}
        {upcoming.map((a) => <AppointmentCard key={a.id} appt={a} userId={user.id} />)}
      </section>
      <section className="stack">
        <div className="row-between"><h2>Historial</h2>
          <div className="chips" role="group" aria-label="Filtrar historial">{[['all', 'Todas'], ['completed', 'Completadas'], ['cancelled', 'Canceladas']].map(([k, l]) => <button key={k} className={`chip ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{l}</button>)}</div>
        </div>
        {shown.length === 0 && <div className="card"><Empty icon={CalendarDays} title="Sin citas en el historial" /></div>}
        {shown.map((a) => <AppointmentCard key={a.id} appt={a} userId={user.id} />)}
      </section>
    </div>
  );
}

function Loyalty({ user }) {
  const db = useDB();
  const now = useNow(60000);
  const points = userPoints({ appointments: db.appointments, reviews: db.reviews, userId: user.id });
  const tier = getTier(points);
  const badges = computeBadges({ appointments: db.appointments, reviews: db.reviews, userId: user.id, points });
  const fav = favoriteBarber({ appointments: db.appointments, reviews: db.reviews, userId: user.id, now });
  const favB = fav && db.barbers.find((b) => b.id === fav.barberId);
  const history = db.reviews.filter((r) => r.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="stack-lg">
      <div className={`card tier-card ${tier.key}`}>
        <div className="row-between">
          <div><span className="muted small">Tu nivel</span><div className={`tier-name ${tier.key}`}><Crown size={24} />{tier.name}</div></div>
          <div style={{ textAlign: 'right' }}><div className="tier-points num">{points}</div><span className="muted small">puntos</span></div>
        </div>
        <div>
          <div className="progress" role="progressbar" aria-valuenow={Math.round(tier.progress * 100)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${tier.progress * 100}%` }} /></div>
          <div className="tier-rail">{TIERS.map((t) => <span key={t.key}>{t.name} · {t.min}</span>)}</div>
        </div>
        <p className="muted small">{tier.next ? `Te faltan ${tier.missing} puntos para llegar a ${tier.next.name}.` : 'Estás en el nivel más alto. Gracias por tu fidelidad.'} Ganas 1 punto por cada dólar en citas completadas y {REVIEW_POINTS} por cada reseña.</p>
      </div>

      <section className="stack">
        <h2>Tu barbero favorito</h2>
        {!fav ? <div className="card"><Empty icon={Heart} title="Aún no hay favorito">Completa tu primera cita y lo calcularemos por ti.</Empty></div> : (
          <div className="card card-pad stack">
            <div className="fav">
              <Media src={favB?.image} alt={favB?.name} icon={User} />
              <div><h3>{favB?.name}</h3><p className="muted small">{fav.visits} de tus {fav.totalVisits} visitas · última el {fav.last.split('-').reverse().join('/')}</p><span className="badge badge-gold" style={{ marginTop: 6 }}><Heart size={11} fill="currentColor" /> Favorito</span></div>
            </div>
            <div className="fav-bars">
              {fav.ranking.map((r) => {
                const b = db.barbers.find((x) => x.id === r.barberId);
                return <div key={r.barberId} className="fav-bar"><span>{b?.name.split(' ')[0]}</span><div className="progress"><i style={{ width: `${(r.score / fav.ranking[0].score) * 100}%` }} /></div><span className="muted num">{r.visits} {r.visits === 1 ? 'visita' : 'visitas'}</span></div>;
              })}
            </div>
            <p className="hint">Se calcula con tus citas completadas: las recientes y las que calificaste mejor pesan más.</p>
          </div>
        )}
      </section>

      <section className="stack">
        <h2>Insignias</h2>
        <div className="badges-grid">
          {badges.map((b) => { const Icon = BADGE_ICONS[b.key] || Award; return (
            <div key={b.key} className={`badge-tile ${b.earned ? 'earned' : ''}`}><span className="ico"><Icon size={18} /></span><strong style={{ fontSize: '0.92rem' }}>{b.name}</strong><small>{b.earned ? 'Conseguida' : b.hint}</small></div>
          ); })}
        </div>
      </section>

      <section className="stack">
        <h2>Tus reseñas</h2>
        {history.length === 0 && <div className="card"><Empty icon={Star} title="Aún no has dejado reseñas">Califica tus citas completadas y gana {REVIEW_POINTS} puntos.</Empty></div>}
        {history.map((r) => { const b = db.barbers.find((x) => x.id === r.barberId); return (
          <div key={r.id} className="card card-pad stack" style={{ gap: 6 }}><div className="row-between"><strong>{b?.name}</strong><Stars value={r.rating} /></div>{r.comment && <p className="muted">{r.comment}</p>}</div>
        ); })}
      </section>
    </div>
  );
}

function Data({ user }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone, idDoc: user.idDoc || '' });
  const [pw, setPw] = useState({ current: '', next: '' });
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const saveProfile = async (e) => {
    e.preventDefault();
    const er = {};
    if (form.name.trim().length < 3) er.name = 'Escribe tu nombre completo.';
    if (!isEmail(form.email)) er.email = 'Correo no válido.';
    if (!isVEMobile(form.phone)) er.phone = 'Teléfono no válido (ej. 0414-1234567).';
    setErrs(er); if (Object.keys(er).length) return;
    setBusy('p');
    try { await updateProfile(user.id, form); toast.ok('Datos actualizados'); } catch (x) { toast.err(x.message); }
    setBusy('');
  };
  const savePw = async (e) => {
    e.preventDefault(); setBusy('w');
    try { await changePassword(user.id, pw); toast.ok('Contraseña actualizada'); setPw({ current: '', next: '' }); } catch (x) { toast.err(x.message); }
    setBusy('');
  };
  return (
    <div className="stack-lg" style={{ maxWidth: 640 }}>
      <form className="card card-pad stack" onSubmit={saveProfile} noValidate>
        <h2>Mis datos</h2>
        <div className="form-grid cols-2">
          <Field label="Nombre completo" error={errs.name} htmlFor="d-name"><input id="d-name" className={`input ${errs.name ? 'is-invalid' : ''}`} value={form.name} onChange={set('name')} /></Field>
          <Field label="Correo electrónico" error={errs.email} htmlFor="d-mail"><input id="d-mail" type="email" className={`input ${errs.email ? 'is-invalid' : ''}`} value={form.email} onChange={set('email')} /></Field>
          <Field label="Teléfono" error={errs.phone} htmlFor="d-phone"><input id="d-phone" inputMode="tel" className={`input ${errs.phone ? 'is-invalid' : ''}`} value={form.phone} onChange={set('phone')} /></Field>
          <Field label="Cédula (opcional)" htmlFor="d-id" hint="Agiliza tus pagos con Pago Móvil."><input id="d-id" inputMode="numeric" className="input" value={form.idDoc} onChange={(e) => setForm({ ...form, idDoc: e.target.value.replace(/\D/g, '') })} /></Field>
        </div>
        <div><button className="btn btn-gold" disabled={busy === 'p'}>{busy === 'p' && <Loader2 size={16} className="spin" />}Guardar cambios</button></div>
      </form>
      <form className="card card-pad stack" onSubmit={savePw}>
        <h2>Cambiar contraseña</h2>
        <div className="form-grid cols-2">
          <Field label="Contraseña actual" htmlFor="d-cur"><input id="d-cur" type="password" className="input" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
          <Field label="Nueva contraseña" htmlFor="d-new" hint="Mínimo 6 caracteres."><input id="d-new" type="password" className="input" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
        </div>
        <div><button className="btn btn-line" disabled={busy === 'w' || !pw.current || !pw.next}>Actualizar contraseña</button></div>
      </form>
    </div>
  );
}

export default function Profile() {
  useDocumentTitle('Mi cuenta');
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'citas';
  const db = useDB();
  const points = userPoints({ appointments: db.appointments, reviews: db.reviews, userId: user.id });
  const tier = getTier(points);
  const TABS = [['citas', 'Mis citas', CalendarDays], ['fidelidad', 'Puntos y barbero favorito', Award], ['datos', 'Mis datos', User]];
  return (
    <div className="page container">
      <div className="profile-head">
        <Avatar name={user.name} size={64} />
        <div><h1 style={{ fontSize: '1.6rem' }}>{user.name}</h1><span className="muted small">{user.email} · </span><span className="badge badge-gold">{tier.name} · {points} pts</span></div>
      </div>
      <div className="tabs" role="tablist">
        {TABS.map(([k, label, Icon]) => <button key={k} role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setParams(k === 'citas' ? {} : { tab: k })}><Icon size={16} />{label}</button>)}
      </div>
      {tab === 'citas' && <Appointments user={user} />}
      {tab === 'fidelidad' && <Loyalty user={user} />}
      {tab === 'datos' && <Data user={user} />}
    </div>
  );
}
