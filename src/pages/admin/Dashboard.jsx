import { Link } from 'react-router-dom';
import { DollarSign, CalendarCheck, UserPlus, CreditCard, TrendingUp } from 'lucide-react';
import { useDB } from '../../context/DataContext.jsx';
import { useNow } from '../../hooks.js';
import { adminMetrics } from '../../lib/metrics.js';
import { toISODate, fmtTime, DAY_SHORT, fromISODate } from '../../lib/dates.js';
import { usd } from '../../lib/pricing.js';
import { StatusBadge, Empty } from '../../components/ui.jsx';

function RevenueChart({ series }) {
  const W = 480, H = 280, pad = { t: 26, b: 28, l: 6, r: 6 };
  const max = Math.max(...series.map((s) => s.value), 1);
  const bw = (W - pad.l - pad.r) / series.length;
  const today = toISODate(new Date());
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Ingresos de los últimos 14 días">
      {[0.25, 0.5, 0.75, 1].map((g) => <line key={g} x1={pad.l} x2={W - pad.r} y1={pad.t + (H - pad.t - pad.b) * (1 - g)} y2={pad.t + (H - pad.t - pad.b) * (1 - g)} />)}
      {series.map((s, i) => {
        const h = ((H - pad.t - pad.b) * s.value) / max;
        const x = pad.l + i * bw + bw * 0.18, w = bw * 0.64, y = H - pad.b - h;
        const d = fromISODate(s.date);
        return (
          <g key={s.date}>
            <title>{`${s.date}: ${usd(s.value)}`}</title>
            <rect className={`bar ${s.date === today ? 'today' : ''}`} x={x} y={y} width={w} height={Math.max(h, 1)} rx="3" />
            {s.value > 0 && i % 2 === (series.length - 1) % 2 && <text className="val" x={x + w / 2} y={y - 5} textAnchor="middle">{Math.round(s.value)}</text>}
            <text x={x + w / 2} y={H - 10} textAnchor="middle">{i % 2 === (series.length - 1) % 2 ? `${DAY_SHORT[d.getDay()]} ${d.getDate()}` : ''}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Dashboard() {
  const db = useDB();
  const now = useNow(60000);
  const m = adminMetrics(db, now);
  const today = toISODate(now);
  const agenda = db.appointments.filter((a) => a.date === today && a.status !== 'cancelled').sort((a, b) => a.time.localeCompare(b.time));
  const name = (list, id) => list.find((x) => x.id === id)?.name || '—';
  const maxS = m.topServices[0]?.revenue || 1, maxB = m.topBarbers[0]?.revenue || 1;
  const stats = [
    [DollarSign, 'Ingresos de hoy', usd(m.revenueToday), `${usd(m.revenueMonth)} en el mes`],
    [CalendarCheck, 'Citas de hoy', m.appointmentsToday, `${m.todayDone} completadas · ${m.todayPending} pendientes`],
    [UserPlus, 'Clientes nuevos', m.newClients30, 'Últimos 30 días'],
    [CreditCard, 'Pagos por validar', m.pendingPayments, m.pendingCash ? `+${m.pendingCash} en efectivo` : 'Comprobantes en espera'],
  ];
  return (
    <>
      <div className="page-head" style={{ marginBottom: 0 }}><h1>Resumen</h1><p>Actualizado en vivo con cada reserva y cada pago.</p></div>
      <div className="stat-grid">
        {stats.map(([Icon, label, value, sub]) => <div key={label} className="card stat"><span className="label"><Icon size={15} />{label}</span><span className="value num">{value}</span><span className="sub">{sub}</span></div>)}
      </div>
      {m.pendingPayments > 0 && <div className="alert alert-warn" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}><span>Hay {m.pendingPayments} comprobante{m.pendingPayments > 1 ? 's' : ''} esperando validación.</span><Link to="/admin/pagos" className="btn btn-gold btn-sm">Revisar pagos</Link></div>}
      <div className="dash-grid">
        <div className="card card-pad"><div className="card-title"><TrendingUp size={18} /><h3>Ingresos, últimos 14 días (USD)</h3></div><RevenueChart series={m.series} /></div>
        <div className="card card-pad">
          <div className="card-title"><CalendarCheck size={18} /><h3>Agenda de hoy</h3></div>
          {agenda.length === 0 ? <Empty icon={CalendarCheck} title="Sin citas hoy" /> : agenda.slice(0, 8).map((a) => (
            <div key={a.id} className="agenda-row"><span className="agenda-time num">{fmtTime(a.time)}</span><div className="grow"><strong style={{ fontWeight: 600 }}>{name(db.users, a.userId)}</strong><div className="muted small">{name(db.services, a.serviceId)} · {name(db.barbers, a.barberId).split(' ')[0]}</div></div><StatusBadge status={a.status} /></div>
          ))}
          {agenda.length > 8 && <Link to="/admin/citas" className="gold small">Ver las {agenda.length} citas</Link>}
        </div>
      </div>
      <div className="dash-grid" style={{ gridTemplateColumns: undefined }}>
        <div className="card card-pad"><div className="card-title"><h3>Servicios más rentables (30 días)</h3></div>
          <div className="rank">{m.topServices.map((s) => <div key={s.id} className="rank-row"><div className="row-between"><span>{name(db.services, s.id)}</span><span className="muted num">{s.count} · {usd(s.revenue)}</span></div><div className="progress"><i style={{ width: `${(s.revenue / maxS) * 100}%` }} /></div></div>)}</div></div>
        <div className="card card-pad"><div className="card-title"><h3>Rendimiento por barbero (30 días)</h3></div>
          <div className="rank">{m.topBarbers.map((s) => <div key={s.id} className="rank-row"><div className="row-between"><span>{name(db.barbers, s.id)}</span><span className="muted num">{s.count} · {usd(s.revenue)}</span></div><div className="progress"><i style={{ width: `${(s.revenue / maxB) * 100}%` }} /></div></div>)}</div></div>
      </div>
    </>
  );
}
