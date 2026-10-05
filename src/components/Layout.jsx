import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Scissors, Bell, Menu, X, User, LogOut, LayoutDashboard, CalendarDays, Award, MapPin, Phone, Mail, RotateCcw, CalendarClock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useDB } from '../context/DataContext.jsx';
import { useNow } from '../hooks.js';
import { markNotificationsRead } from '../api/api.js';
import { resetDemo } from '../api/db.js';
import { hoursUntil } from '../lib/availability.js';
import { fmtTime, relativeDay } from '../lib/dates.js';
import { Avatar } from './ui.jsx';

const LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/servicios', label: 'Servicios' },
  { to: '/promociones', label: 'Promociones' },
  { to: '/reservar', label: 'Reservar' },
];

function useOutside(ref, cb) {
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) cb(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, cb]);
}

/** Notificaciones guardadas + recordatorios calculados (citas en las próximas 24 h). */
function useNotifications(userId) {
  const db = useDB();
  const now = useNow(60000);
  return useMemo(() => {
    if (!userId) return { items: [], unread: 0 };
    const stored = db.notifications.filter((n) => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12);
    const reminders = db.appointments
      .filter((a) => a.userId === userId && (a.status === 'confirmed' || a.status === 'pending'))
      .filter((a) => { const h = hoursUntil(a, now); return h > 0 && h <= 24; })
      .map((a) => {
        const svc = db.services.find((s) => s.id === a.serviceId); const b = db.barbers.find((x) => x.id === a.barberId);
        return { id: `rem_${a.id}`, reminder: true, title: 'Recordatorio de cita', body: `${relativeDay(a.date, now)} a las ${fmtTime(a.time)}: ${svc?.name} con ${b?.name}.`, createdAt: now.toISOString(), read: false };
      });
    const items = [...reminders, ...stored];
    return { items, unread: items.filter((n) => !n.read).length };
  }, [db, userId, now]);
}

function Bell_({ userId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutside(ref, () => setOpen(false));
  const { items, unread } = useNotifications(userId);
  return (
    <div className="user-menu" ref={ref}>
      <button className="icon-btn" aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ''}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Bell size={20} />{unread > 0 && <span className="dot">{unread}</span>}
      </button>
      {open && (
        <div className="menu-pop notif-pop">
          <header><strong>Notificaciones</strong>{unread > 0 && <button className="btn btn-ghost btn-sm" style={{ width: 'auto' }} onClick={() => markNotificationsRead(userId)}>Marcar leídas</button>}</header>
          <div className="notif-list">
            {items.length === 0 && <p className="muted small" style={{ padding: '1.2rem' }}>No tienes notificaciones.</p>}
            {items.map((n) => (
              <div key={n.id} className={`notif ${n.read ? '' : 'unread'}`}>
                <strong>{n.reminder && <CalendarClock size={14} style={{ verticalAlign: -2, marginRight: 6, color: 'var(--gold)' }} />}{n.title}</strong>
                <p>{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { user, signOut, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const nav = useNavigate();
  useOutside(ref, () => setOpen(false));
  return (
    <div className="user-menu" ref={ref}>
      <button className="icon-btn" style={{ width: 'auto', padding: '0 0.4rem' }} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menú de cuenta">
        <Avatar name={user.name} size={32} />
      </button>
      {open && (
        <div className="menu-pop" onClick={() => setOpen(false)}>
          <div className="menu-head"><strong>{user.name}</strong><div className="muted small">{user.email}</div></div>
          <hr />
          {isAdmin
            ? <Link to="/admin"><LayoutDashboard size={17} /> Panel de administración</Link>
            : <><Link to="/perfil"><CalendarDays size={17} /> Mis citas</Link><Link to="/perfil?tab=fidelidad"><Award size={17} /> Mis puntos</Link><Link to="/perfil?tab=datos"><User size={17} /> Mis datos</Link></>}
          <hr />
          <button onClick={() => { signOut(); nav('/'); }}><LogOut size={17} /> Cerrar sesión</button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { user } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => { document.body.style.overflow = drawer ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [drawer]);
  const links = user?.role === 'admin' ? [{ to: '/admin', label: 'Administración' }, ...LINKS.slice(0, 2)] : LINKS;
  return (
    <>
      <header className="site-header">
        <div className="container">
          <Link to="/" className="brand" aria-label="BarbApp, inicio"><span className="brand-mark"><Scissors size={17} /></span>BarbApp</Link>
          <nav className="nav" aria-label="Principal">
            {links.map((l) => <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>)}
          </nav>
          <div className="header-actions">
            {user ? (<><Bell_ userId={user.id} /><UserMenu /></>) : (
              <div className="header-auth">
                <Link to="/login" className="btn btn-line btn-sm">Iniciar sesión</Link>
                <Link to="/registro" className="btn btn-gold btn-sm">Crear cuenta</Link>
              </div>
            )}
            <button className="icon-btn menu-btn" aria-label={drawer ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={drawer} onClick={() => setDrawer((d) => !d)}>
              {drawer ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>
      {drawer && (
        <div className="drawer">
          {links.map((l) => <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>)}
          {user && user.role !== 'admin' && <NavLink to="/perfil">Mi cuenta</NavLink>}
          {!user && (
            <div className="drawer-cta">
              <Link to="/registro" className="btn btn-gold btn-lg btn-block">Crear cuenta</Link>
              <Link to="/login" className="btn btn-line btn-lg btn-block">Iniciar sesión</Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function Footer() {
  const db = useDB();
  const { shop } = db.settings;
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link to="/" className="brand" style={{ marginBottom: '0.75rem' }}><span className="brand-mark"><Scissors size={17} /></span>BarbApp</Link>
            <p style={{ maxWidth: '34ch' }}>Reserva con tu barbero favorito, paga con Pago Móvil y suma puntos en cada visita.</p>
          </div>
          <div>
            <h4>Explora</h4>
            <ul><li><Link to="/servicios">Servicios</Link></li><li><Link to="/promociones">Promociones</Link></li><li><Link to="/reservar">Reservar cita</Link></li><li><Link to="/perfil?tab=fidelidad">Programa de puntos</Link></li></ul>
          </div>
          <div>
            <h4>Contacto</h4>
            <ul>
              <li className="row" style={{ gap: 8, flexWrap: 'nowrap' }}><MapPin size={15} style={{ flex: 'none' }} />{shop.address}</li>
              <li className="row" style={{ gap: 8 }}><Phone size={15} />{shop.phone}</li>
              <li className="row" style={{ gap: 8 }}><Mail size={15} />{shop.email}</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} BarbApp. Versión de demostración: los datos viven en tu navegador.</span>
          <button className="btn btn-ghost btn-sm" onClick={() => { if (window.confirm('¿Restablecer los datos de demostración? Se perderán tus cambios.')) { resetDemo(); window.location.hash = '#/'; window.location.reload(); } }}>
            <RotateCcw size={14} /> Restablecer demo
          </button>
        </div>
      </div>
    </footer>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <>
      <Header />
      <main><Outlet /></main>
      <Footer />
    </>
  );
}

export function Protected({ children, admin = false }) {
  const { user } = useAuth();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
import { Navigate } from 'react-router-dom';
