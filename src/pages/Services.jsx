import { useNavigate } from 'react-router-dom';
import { Percent } from 'lucide-react';
import { useDB } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useDocumentTitle } from '../hooks.js';
import { ServiceCard } from '../components/Cards.jsx';
import { isFirstAppointment } from '../lib/pricing.js';

export default function Services() {
  useDocumentTitle('Servicios');
  const db = useDB();
  const { user } = useAuth();
  const nav = useNavigate();
  const first = !user || isFirstAppointment(user.id, db.appointments);
  const promo = db.promos.find((p) => p.active && p.auto && p.firstOnly);
  return (
    <div className="page container">
      <div className="page-head"><h1>Servicios</h1><p>Elige el servicio y después a tu barbero. Los precios están en dólares.</p></div>
      {first && promo && user && <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}><Percent size={18} /><span>Es tu primera cita: los precios con <strong>{promo.value}% menos</strong> son los que pagarás.</span></div>}
      <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {db.services.filter((s) => s.active).map((s) => <ServiceCard key={s.id} service={s} showDiscount={first && promo && user ? promo.value : 0} onBook={() => nav(`/reservar?servicio=${s.id}`)} />)}
      </div>
    </div>
  );
}
