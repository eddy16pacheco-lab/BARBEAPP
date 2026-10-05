import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, CalendarCheck, Smartphone, Award } from 'lucide-react';
import { useDB } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useNow, useDocumentTitle } from '../hooks.js';
import { nextSlotsByBarber } from '../lib/availability.js';
import { barberRating } from '../lib/metrics.js';
import { favoriteBarber } from '../lib/loyalty.js';
import { fmtTime, relativeDay } from '../lib/dates.js';
import { Avatar, Stars, shortName } from '../components/ui.jsx';
import { BarberCard, PromoCard, ServiceCard } from '../components/Cards.jsx';

export default function Home() {
  useDocumentTitle('');
  const db = useDB();
  const { user } = useAuth();
  const nav = useNavigate();
  const now = useNow(30000);

  const services = db.services.filter((s) => s.active);
  const quick = [...services].sort((a, b) => a.duration - b.duration)[0];
  const barbers = db.barbers.filter((b) => b.active);
  const live = useMemo(
    () => (quick ? nextSlotsByBarber({ barbers: barbers.filter((b) => b.serviceIds.includes(quick.id)), durationMin: quick.duration, appointments: db.appointments, now }).slice(0, 4) : []),
    [db, quick, now], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const fav = user ? favoriteBarber({ appointments: db.appointments, reviews: db.reviews, userId: user.id, now }) : null;
  const promos = db.promos.filter((p) => p.active && (!p.validUntil || p.validUntil >= now.toISOString().slice(0, 10)));
  const quotes = db.reviews.filter((r) => r.comment && r.rating >= 4).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  const firstPromo = promos.find((p) => p.auto && p.firstOnly);
  const book = (params) => nav(`/reservar?${new URLSearchParams(params)}`);

  return (
    <>
      <section className="hero">
        <div className="hero-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1400&q=70')" }} />
        <div className="container hero-inner">
          <div className="hero-copy">
            <h1>Tu corte, a la hora que tú eliges</h1>
            <p>Escoge servicio y barbero, mira la agenda en vivo y paga con Pago Móvil. Sin llamadas ni esperas.</p>
            <div className="hero-cta">
              <Link to="/reservar" className="btn btn-gold btn-lg">Reservar cita</Link>
              <Link to="/servicios" className="btn btn-line btn-lg">Ver servicios</Link>
            </div>
            {firstPromo && !user && <p className="small" style={{ color: 'var(--gold-hi)' }}>{firstPromo.value}% de descuento en tu primera cita, aplicado automáticamente.</p>}
          </div>
          <div className="live" aria-label="Próximos turnos libres">
            <div className="live-title"><span className="pulse" />Próximos turnos libres</div>
            <p className="small muted" style={{ marginBottom: 4 }}>{quick?.name}, {quick?.duration} min. Toca uno para reservarlo.</p>
            {live.length === 0 && <p className="muted small">No hay turnos disponibles por ahora.</p>}
            {live.map(({ barber, dateISO, time }) => (
              <button key={barber.id} className="live-row" onClick={() => book({ servicio: quick.id, barbero: barber.id, fecha: dateISO, hora: time })}>
                <Avatar src={barber.image} name={barber.name} size={40} />
                <span className="grow"><span className="when">{relativeDay(dateISO, now)}, {fmtTime(time)}</span><br /><span className="who">{barber.name}</span></span>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div><h2>Servicios destacados</h2><p>Precios claros y duración a la vista.</p></div>
            <Link to="/servicios" className="btn btn-line btn-sm">Ver todos</Link>
          </div>
          <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {services.filter((s) => s.featured).slice(0, 3).map((s) => <ServiceCard key={s.id} service={s} onBook={() => book({ servicio: s.id })} />)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head"><div><h2>Nuestros barberos</h2><p>{fav ? 'Marcamos a tu favorito según tus visitas y calificaciones.' : 'Elige con quién quieres sentarte.'}</p></div></div>
          <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {barbers.map((b) => <BarberCard key={b.id} barber={b} rating={barberRating(db, b.id)} favorite={fav?.barberId === b.id} onBook={() => book({ barbero: b.id })} />)}
          </div>
        </div>
      </section>

      {promos.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head"><div><h2>Promociones activas</h2><p>Los códigos se escriben al pagar tu reserva.</p></div><Link to="/promociones" className="btn btn-line btn-sm">Ver detalles</Link></div>
            <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>{promos.slice(0, 2).map((p) => <PromoCard key={p.id} promo={p} />)}</div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div className="section-head"><div><h2>Lo que dicen los clientes</h2></div></div>
          <div className="reviews-strip">
            {quotes.map((r) => {
              const u = db.users.find((x) => x.id === r.userId); const b = db.barbers.find((x) => x.id === r.barberId);
              return (
                <figure key={r.id} className="card quote" style={{ margin: 0 }}>
                  <Stars value={r.rating} />
                  <p>“{r.comment}”</p>
                  <figcaption className="small muted">{shortName(u?.name)} atendido por {b?.name.split(' ')[0]}</figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {[[CalendarCheck, 'Reserva sin llamar', 'La agenda se actualiza en tiempo real: lo que ves libre, es tuyo.'], [Smartphone, 'Paga con Pago Móvil', 'Sube tu comprobante y te confirmamos en minutos. También recibimos efectivo y Zelle.'], [Award, 'Cada visita suma', 'Acumula puntos, sube de Bronce a Oro y deja reseñas para ganar más.']].map(([Icon, t, d]) => (
            <div key={t} className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap', gap: '0.9rem' }}>
              <span className="brand-mark" style={{ width: 40, height: 40, flex: 'none', borderRadius: 10 }}><Icon size={20} /></span>
              <div><h3 style={{ marginBottom: 4 }}>{t}</h3><p className="muted small">{d}</p></div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
