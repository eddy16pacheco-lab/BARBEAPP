import { Clock, Heart, Copy, Tag } from 'lucide-react';
import { Media, Stars } from './ui.jsx';
import { usd } from '../lib/pricing.js';
import { DAY_NAMES, fmtDateShort } from '../lib/dates.js';
import { useToast } from '../context/ToastContext.jsx';

export function ServiceCard({ service, onBook, showDiscount }) {
  return (
    <article className="card svc-card">
      <Media src={service.image} alt={service.name} />
      <div className="svc-body">
        <h3>{service.name}</h3>
        <p>{service.description}</p>
        <div className="svc-foot">
          <div>
            <span className="price">{showDiscount ? <s>{usd(service.price)}</s> : null}{usd(showDiscount ? service.price * (1 - showDiscount / 100) : service.price)}</span>
            <div className="meta"><Clock size={14} />{service.duration} min</div>
          </div>
          <button className="btn btn-gold btn-sm" onClick={() => onBook(service)}>Reservar</button>
        </div>
      </div>
    </article>
  );
}

export function BarberCard({ barber, rating, favorite, onBook }) {
  return (
    <article className="card barber-card">
      <Media src={barber.image} alt={`Foto de ${barber.name}`} />
      <div className="svc-body">
        <div className="row-between" style={{ alignItems: 'start' }}>
          <div><h3>{barber.name}</h3><p>{barber.specialty}</p></div>
          {favorite && <span className="badge badge-gold" title="Tu barbero favorito"><Heart size={12} fill="currentColor" /> Favorito</span>}
        </div>
        <div className="row" style={{ gap: 6 }}>
          {rating.count ? (<><Stars value={rating.avg} /><span className="small muted num">{rating.avg.toFixed(1)} ({rating.count})</span></>) : <span className="small muted">Aún sin reseñas</span>}
        </div>
        <div className="svc-foot"><button className="btn btn-line btn-sm btn-block" onClick={() => onBook(barber)}>Reservar con {barber.name.split(' ')[0]}</button></div>
      </div>
    </article>
  );
}

export function PromoCard({ promo }) {
  const toast = useToast();
  const copy = async () => { try { await navigator.clipboard.writeText(promo.code); toast.ok(`Código ${promo.code} copiado`); } catch { toast.err('No pudimos copiar el código.'); } };
  const conditions = [
    promo.firstOnly && 'Solo en tu primera cita',
    promo.days?.length > 0 && `Válido los ${promo.days.map((d) => DAY_NAMES[d]).join(' y ')}`,
    promo.validUntil && `Hasta el ${fmtDateShort(promo.validUntil)}`,
  ].filter(Boolean);
  return (
    <article className="card promo-card">
      <Media src={promo.image} alt="" icon={Tag} />
      <div className="svc-body" style={{ padding: '1.2rem' }}>
        <div className="row-between"><h3>{promo.title}</h3><span className="price">{promo.value}%</span></div>
        <p>{promo.description}</p>
        {conditions.length > 0 && <p className="small faint">{conditions.join('. ')}.</p>}
        <div className="row" style={{ marginTop: '0.4rem' }}>
          {promo.auto
            ? <span className="badge badge-ok">Se aplica automáticamente</span>
            : <><span className="promo-code">{promo.code}</span><button className="btn btn-ghost btn-sm" onClick={copy}><Copy size={14} /> Copiar</button></>}
        </div>
      </div>
    </article>
  );
}
