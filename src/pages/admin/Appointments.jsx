import { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Flag } from 'lucide-react';
import { useDB } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { setAppointmentStatus } from '../../api/api.js';
import { toISODate, fmtDate, fmtTime } from '../../lib/dates.js';
import { usd } from '../../lib/pricing.js';
import MonthCalendar from '../../components/MonthCalendar.jsx';
import { PayBadge, StatusBadge, Empty, Modal } from '../../components/ui.jsx';

const FILTERS = [['all', 'Todas'], ['pending', 'Pendientes'], ['confirmed', 'Confirmadas'], ['completed', 'Completadas'], ['cancelled', 'Canceladas']];

export default function AdminAppointments() {
  const db = useDB();
  const { user } = useAuth();
  const toast = useToast();
  const [date, setDate] = useState(toISODate(new Date()));
  const [filter, setFilter] = useState('all');
  const [barber, setBarber] = useState('all');
  const [confirmCancel, setConfirmCancel] = useState(null);

  const base = useMemo(() => db.appointments.filter((a) => barber === 'all' || a.barberId === barber), [db.appointments, barber]);
  const counts = useMemo(() => { const c = {}; base.forEach((a) => { if (a.status !== 'cancelled') c[a.date] = (c[a.date] || 0) + 1; }); return c; }, [base]);
  const dayList = base.filter((a) => a.date === date).sort((a, b) => a.time.localeCompare(b.time));
  const list = dayList.filter((a) => filter === 'all' || a.status === filter);
  const countOf = (f) => dayList.filter((a) => f === 'all' || a.status === f).length;
  const find = (arr, id) => arr.find((x) => x.id === id);

  const act = async (id, status, msg) => {
    try { await setAppointmentStatus({ actorId: user.id, appointmentId: id, status }); toast.ok(msg); } catch (e) { toast.err(e.message); }
  };

  return (
    <>
      <div className="page-head" style={{ marginBottom: 0 }}><h1>Calendario de reservas</h1><p>Los puntos dorados indican cuántas citas hay cada día.</p></div>
      <div className="split">
        <div className="card card-pad stack">
          <MonthCalendar selected={date} onSelect={setDate} markerCount={(iso) => counts[iso] || 0} />
          <div className="field"><label htmlFor="f-barber">Barbero</label>
            <select id="f-barber" className="select" value={barber} onChange={(e) => setBarber(e.target.value)}><option value="all">Todos</option>{db.barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
        </div>
        <div className="stack" style={{ minWidth: 0 }}>
          <div className="row-between"><h2>{fmtDate(date)}</h2><span className="muted small">{dayList.length} citas</span></div>
          <div className="chips" role="group" aria-label="Filtrar por estado">{FILTERS.map(([k, l]) => <button key={k} className={`chip ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{l} ({countOf(k)})</button>)}</div>
          {list.length === 0 ? <div className="card"><Empty title="No hay citas con este filtro" /></div> : (
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Hora</th><th>Cliente</th><th>Servicio</th><th>Barbero</th><th>Total</th><th>Estado</th><th>Pago</th><th /></tr></thead>
              <tbody>{list.map((a) => {
                const pay = find(db.payments, a.paymentId);
                return (
                  <tr key={a.id}>
                    <td className="num"><strong>{fmtTime(a.time)}</strong></td>
                    <td>{find(db.users, a.userId)?.name}</td>
                    <td>{find(db.services, a.serviceId)?.name}</td>
                    <td>{find(db.barbers, a.barberId)?.name.split(' ')[0]}</td>
                    <td className="num">{usd(a.total)}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td><PayBadge payment={pay} /></td>
                    <td><div className="actions">
                      {a.status === 'pending' && pay?.method === 'efectivo' && <button className="btn btn-ok btn-sm" onClick={() => act(a.id, 'confirmed', 'Cita confirmada')}><CheckCircle2 size={14} /> Confirmar</button>}
                      {a.status === 'confirmed' && <button className="btn btn-ok btn-sm" onClick={() => act(a.id, 'completed', 'Cita completada')}><Flag size={14} /> Completar</button>}
                      {(a.status === 'pending' || a.status === 'confirmed') && <button className="btn btn-danger btn-sm" onClick={() => setConfirmCancel(a)} aria-label="Cancelar cita"><XCircle size={14} /></button>}
                    </div></td>
                  </tr>
                );
              })}</tbody>
            </table></div>
          )}
        </div>
      </div>
      {confirmCancel && (
        <Modal title="¿Cancelar esta cita?" onClose={() => setConfirmCancel(null)} footer={<><button className="btn btn-line" onClick={() => setConfirmCancel(null)}>Volver</button><button className="btn btn-danger" onClick={() => { act(confirmCancel.id, 'cancelled', 'Cita cancelada'); setConfirmCancel(null); }}>Cancelar cita</button></>}>
          <p className="muted">{find(db.users, confirmCancel.userId)?.name}, {fmtDate(confirmCancel.date)} a las {fmtTime(confirmCancel.time)}. Se avisará al cliente y se liberará el turno.</p>
        </Modal>
      )}
    </>
  );
}
