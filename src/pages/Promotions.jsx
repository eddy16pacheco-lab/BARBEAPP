import { Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDB } from '../context/DataContext.jsx';
import { useDocumentTitle } from '../hooks.js';
import { PromoCard } from '../components/Cards.jsx';
import { Empty } from '../components/ui.jsx';
import { toISODate } from '../lib/dates.js';

export default function Promotions() {
  useDocumentTitle('Promociones');
  const db = useDB();
  const today = toISODate(new Date());
  const active = db.promos.filter((p) => p.active && (!p.validUntil || p.validUntil >= today));
  return (
    <div className="page container">
      <div className="page-head"><h1>Promociones</h1><p>Escribe el código en el último paso de tu reserva. Los descuentos no se suman: se aplica el mejor.</p></div>
      {active.length === 0
        ? <Empty icon={Tag} title="No hay promociones activas">Vuelve pronto o <Link to="/reservar" className="gold">reserva ahora</Link>.</Empty>
        : <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>{active.map((p) => <PromoCard key={p.id} promo={p} />)}</div>}
    </div>
  );
}
