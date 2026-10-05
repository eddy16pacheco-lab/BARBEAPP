import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, CalendarRange, CreditCard, Scissors, Users, Tag, Settings } from 'lucide-react';
import { useDB } from '../../context/DataContext.jsx';
import { useDocumentTitle } from '../../hooks.js';

export default function AdminLayout() {
  useDocumentTitle('Administración');
  const db = useDB();
  const pending = db.payments.filter((p) => p.status === 'pending').length;
  const items = [
    ['/admin', 'Resumen', LayoutDashboard, true], ['/admin/citas', 'Calendario', CalendarRange], ['/admin/pagos', 'Pagos', CreditCard, false, pending],
    ['/admin/servicios', 'Servicios', Scissors], ['/admin/barberos', 'Barberos', Users], ['/admin/promociones', 'Promociones', Tag], ['/admin/ajustes', 'Ajustes', Settings],
  ];
  return (
    <div className="page container">
      <div className="admin-shell">
        <nav className="admin-nav" aria-label="Administración">
          {items.map(([to, label, Icon, end, count]) => <NavLink key={to} to={to} end={end}><Icon size={17} />{label}{count > 0 && <span className="count">{count}</span>}</NavLink>)}
        </nav>
        <div className="stack-lg" style={{ minWidth: 0 }}><Outlet /></div>
      </div>
    </div>
  );
}
