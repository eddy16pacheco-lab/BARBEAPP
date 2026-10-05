import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useDB } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { saveService, deleteService, saveBarber, deleteBarber, savePromo, deletePromo, saveSettings } from '../../api/api.js';
import { DAY_NAMES } from '../../lib/dates.js';
import { usd } from '../../lib/pricing.js';
import { Avatar, Empty, Field, Media, Modal } from '../../components/ui.jsx';

function useSave() {
  const { user } = useAuth();
  const toast = useToast();
  return async (fn, ok, onDone) => {
    try { await fn(user.id); toast.ok(ok); onDone?.(); } catch (e) { toast.err(e.message); }
  };
}
const Toggle = ({ checked, onChange, children }) => <label className="check-row"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{children}</label>;
const ConfirmDelete = ({ what, onClose, onOk }) => (
  <Modal title={`¿Eliminar ${what}?`} onClose={onClose} footer={<><button className="btn btn-line" onClick={onClose}>Volver</button><button className="btn btn-danger" onClick={onOk}>Eliminar</button></>}>
    <p className="muted">Si tiene citas registradas, se archivará en lugar de borrarse para conservar el historial.</p>
  </Modal>
);

/* ── Servicios ─────────────────────────────────────── */
export function AdminServices() {
  const db = useDB(); const save = useSave();
  const [edit, setEdit] = useState(null); const [del, setDel] = useState(null);
  const blank = { name: '', description: '', price: 15, duration: 30, image: '', active: true, featured: false };
  return (
    <>
      <div className="row-between"><div className="page-head" style={{ marginBottom: 0 }}><h1>Servicios y precios</h1></div><button className="btn btn-gold" onClick={() => setEdit(blank)}><Plus size={17} /> Nuevo servicio</button></div>
      <div className="table-wrap"><table className="table">
        <thead><tr><th>Servicio</th><th>Precio</th><th>Duración</th><th>Estado</th><th /></tr></thead>
        <tbody>{db.services.map((s) => (
          <tr key={s.id} style={{ opacity: s.active ? 1 : 0.55 }}>
            <td><div className="row" style={{ flexWrap: 'nowrap' }}><Media className="thumb" style={{ width: 44, height: 44, borderRadius: 8, flex: 'none' }} src={s.image} alt="" /><div><strong>{s.name}</strong>{s.featured && <span className="badge badge-gold" style={{ marginLeft: 6 }}>Destacado</span>}</div></div></td>
            <td className="num">{usd(s.price)}</td><td className="num">{s.duration} min</td>
            <td>{s.active ? <span className="badge badge-ok">Activo</span> : <span className="badge badge-cancelled">Oculto</span>}</td>
            <td><div className="actions"><button className="btn btn-ghost btn-sm" onClick={() => setEdit(s)} aria-label={`Editar ${s.name}`}><Pencil size={15} /></button><button className="btn btn-ghost btn-sm" onClick={() => setDel(s)} aria-label={`Eliminar ${s.name}`}><Trash2 size={15} /></button></div></td>
          </tr>))}</tbody>
      </table></div>
      {edit && <ServiceForm initial={edit} onClose={() => setEdit(null)} save={save} />}
      {del && <ConfirmDelete what={del.name} onClose={() => setDel(null)} onOk={() => save((id) => deleteService({ actorId: id, id: del.id }), 'Servicio eliminado', () => setDel(null))} />}
    </>
  );
}
function ServiceForm({ initial, onClose, save }) {
  const [f, setF] = useState(initial);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={f.id ? 'Editar servicio' : 'Nuevo servicio'} onClose={onClose} footer={<><button className="btn btn-line" onClick={onClose}>Cancelar</button><button className="btn btn-gold" onClick={() => save((id) => saveService({ actorId: id, service: { ...f, price: Number(f.price), duration: Number(f.duration) } }), 'Servicio guardado', onClose)}>Guardar</button></>}>
      <div className="form-grid">
        <Field label="Nombre" htmlFor="sv-n"><input id="sv-n" className="input" value={f.name} onChange={set('name')} /></Field>
        <Field label="Descripción" htmlFor="sv-d"><textarea id="sv-d" className="textarea" value={f.description} onChange={set('description')} /></Field>
        <div className="form-grid cols-2">
          <Field label="Precio (USD)" htmlFor="sv-p"><input id="sv-p" type="number" min="1" step="0.5" className="input" value={f.price} onChange={set('price')} /></Field>
          <Field label="Duración (min)" htmlFor="sv-t"><input id="sv-t" type="number" min="15" max="240" step="5" className="input" value={f.duration} onChange={set('duration')} /></Field>
        </div>
        <Field label="URL de la imagen" htmlFor="sv-i" hint="Opcional."><input id="sv-i" className="input" value={f.image} onChange={set('image')} /></Field>
        <Toggle checked={f.active} onChange={(v) => setF({ ...f, active: v })}>Visible para los clientes</Toggle>
        <Toggle checked={f.featured} onChange={(v) => setF({ ...f, featured: v })}>Destacar en el inicio</Toggle>
      </div>
    </Modal>
  );
}

/* ── Barberos y horarios ───────────────────────────── */
const ORDER = [1, 2, 3, 4, 5, 6, 0];
export function AdminBarbers() {
  const db = useDB(); const save = useSave();
  const [edit, setEdit] = useState(null); const [del, setDel] = useState(null);
  const blank = { name: '', specialty: '', bio: '', image: '', active: true, serviceIds: db.services.filter((s) => s.active).map((s) => s.id), schedule: Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [d, { open: d >= 1 && d <= 5, start: '09:00', end: '18:00', breakStart: '12:30', breakEnd: '13:30' }])) };
  const summary = (b) => ORDER.filter((d) => b.schedule[d]?.open).map((d) => DAY_NAMES[d].slice(0, 3)).join(', ') || 'Sin horario';
  return (
    <>
      <div className="row-between"><div className="page-head" style={{ marginBottom: 0 }}><h1>Barberos y horarios</h1></div><button className="btn btn-gold" onClick={() => setEdit(blank)}><Plus size={17} /> Nuevo barbero</button></div>
      <div className="stack">
        {db.barbers.map((b) => (
          <article key={b.id} className="card appt" style={{ opacity: b.active ? 1 : 0.55 }}>
            <div className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
              <Avatar src={b.image} name={b.name} size={52} />
              <div className="appt-main grow"><strong>{b.name} {!b.active && <span className="badge badge-cancelled">Inactivo</span>}</strong><span className="muted small">{b.specialty}</span><span className="small">{summary(b)} · {b.serviceIds.length} servicios</span></div>
            </div>
            <div className="appt-actions"><button className="btn btn-line btn-sm" onClick={() => setEdit(b)}><Pencil size={15} /> Editar</button><button className="btn btn-ghost btn-sm" onClick={() => setDel(b)} aria-label={`Eliminar ${b.name}`}><Trash2 size={15} /></button></div>
          </article>))}
      </div>
      {edit && <BarberForm initial={edit} services={db.services} onClose={() => setEdit(null)} save={save} />}
      {del && <ConfirmDelete what={del.name} onClose={() => setDel(null)} onOk={() => save((id) => deleteBarber({ actorId: id, id: del.id }), 'Barbero eliminado', () => setDel(null))} />}
    </>
  );
}
function BarberForm({ initial, services, onClose, save }) {
  const [f, setF] = useState(initial);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const day = (d, patch) => setF({ ...f, schedule: { ...f.schedule, [d]: { ...f.schedule[d], ...patch } } });
  const toggleSvc = (id) => setF({ ...f, serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter((x) => x !== id) : [...f.serviceIds, id] });
  return (
    <Modal wide title={f.id ? 'Editar barbero' : 'Nuevo barbero'} onClose={onClose} footer={<><button className="btn btn-line" onClick={onClose}>Cancelar</button><button className="btn btn-gold" onClick={() => save((id) => saveBarber({ actorId: id, barber: f }), 'Barbero guardado', onClose)}>Guardar</button></>}>
      <div className="stack-lg">
        <div className="form-grid cols-2">
          <Field label="Nombre" htmlFor="br-n"><input id="br-n" className="input" value={f.name} onChange={set('name')} /></Field>
          <Field label="Especialidad" htmlFor="br-s"><input id="br-s" className="input" value={f.specialty} onChange={set('specialty')} /></Field>
        </div>
        <Field label="URL de la foto" htmlFor="br-i" hint="Opcional."><input id="br-i" className="input" value={f.image} onChange={set('image')} /></Field>
        <Toggle checked={f.active} onChange={(v) => setF({ ...f, active: v })}>Disponible para reservas</Toggle>
        <div><h4 style={{ marginBottom: 8 }}>Servicios que ofrece</h4><div className="chips">{services.filter((s) => s.active).map((s) => <button type="button" key={s.id} className={`chip ${f.serviceIds.includes(s.id) ? 'active' : ''}`} aria-pressed={f.serviceIds.includes(s.id)} onClick={() => toggleSvc(s.id)}>{s.name}</button>)}</div></div>
        <div>
          <h4 style={{ marginBottom: 4 }}>Horario de atención</h4>
          {ORDER.map((d) => { const s = f.schedule[d]; return (
            <div className="sched-row" key={d}>
              <Toggle checked={s.open} onChange={(v) => day(d, { open: v })}>{DAY_NAMES[d].slice(0, 3)}</Toggle>
              {s.open ? <div className="times"><input type="time" className="input" aria-label={`Apertura ${DAY_NAMES[d]}`} value={s.start} onChange={(e) => day(d, { start: e.target.value })} /><span>a</span><input type="time" className="input" aria-label={`Cierre ${DAY_NAMES[d]}`} value={s.end} onChange={(e) => day(d, { end: e.target.value })} /><span>descanso</span><input type="time" className="input" aria-label={`Inicio descanso ${DAY_NAMES[d]}`} value={s.breakStart || ''} onChange={(e) => day(d, { breakStart: e.target.value || null })} /><span>a</span><input type="time" className="input" aria-label={`Fin descanso ${DAY_NAMES[d]}`} value={s.breakEnd || ''} onChange={(e) => day(d, { breakEnd: e.target.value || null })} /></div> : <span className="muted small">Cerrado</span>}
            </div>); })}
        </div>
      </div>
    </Modal>
  );
}

/* ── Promociones ───────────────────────────────────── */
export function AdminPromos() {
  const db = useDB(); const save = useSave();
  const [edit, setEdit] = useState(null); const [del, setDel] = useState(null);
  const blank = { title: '', description: '', code: '', value: 10, firstOnly: false, auto: false, days: [], validUntil: null, active: true, image: '' };
  return (
    <>
      <div className="row-between"><div className="page-head" style={{ marginBottom: 0 }}><h1>Promociones</h1></div><button className="btn btn-gold" onClick={() => setEdit(blank)}><Plus size={17} /> Nueva promoción</button></div>
      {db.promos.length === 0 && <div className="card"><Empty title="Sin promociones" /></div>}
      <div className="table-wrap"><table className="table">
        <thead><tr><th>Promoción</th><th>Código</th><th>Descuento</th><th>Condiciones</th><th>Estado</th><th /></tr></thead>
        <tbody>{db.promos.map((p) => (
          <tr key={p.id}><td><strong>{p.title}</strong></td><td><span className="promo-code" style={{ padding: '0.1rem 0.5rem' }}>{p.code}</span></td><td className="num">{p.value}%</td>
            <td className="small muted">{[p.auto && 'Automática', p.firstOnly && 'Primera cita', p.days?.length > 0 && p.days.map((d) => DAY_NAMES[d].slice(0, 3)).join('/'), p.validUntil && `Hasta ${p.validUntil}`].filter(Boolean).join(' · ') || 'Sin restricciones'}</td>
            <td>{p.active ? <span className="badge badge-ok">Activa</span> : <span className="badge badge-cancelled">Inactiva</span>}</td>
            <td><div className="actions"><button className="btn btn-ghost btn-sm" onClick={() => setEdit(p)} aria-label={`Editar ${p.title}`}><Pencil size={15} /></button><button className="btn btn-ghost btn-sm" onClick={() => setDel(p)} aria-label={`Eliminar ${p.title}`}><Trash2 size={15} /></button></div></td></tr>))}</tbody>
      </table></div>
      {edit && <PromoForm initial={edit} onClose={() => setEdit(null)} save={save} />}
      {del && <Modal title={`¿Eliminar "${del.title}"?`} onClose={() => setDel(null)} footer={<><button className="btn btn-line" onClick={() => setDel(null)}>Volver</button><button className="btn btn-danger" onClick={() => save((id) => deletePromo({ actorId: id, id: del.id }), 'Promoción eliminada', () => setDel(null))}>Eliminar</button></>}><p className="muted">Las citas ya reservadas conservan su descuento.</p></Modal>}
    </>
  );
}
function PromoForm({ initial, onClose, save }) {
  const [f, setF] = useState(initial);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggleDay = (d) => setF({ ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d] });
  return (
    <Modal title={f.id ? 'Editar promoción' : 'Nueva promoción'} onClose={onClose} footer={<><button className="btn btn-line" onClick={onClose}>Cancelar</button><button className="btn btn-gold" onClick={() => save((id) => savePromo({ actorId: id, promo: { ...f, value: Number(f.value), validUntil: f.validUntil || null } }), 'Promoción guardada', onClose)}>Guardar</button></>}>
      <div className="form-grid">
        <Field label="Título" htmlFor="pr-t"><input id="pr-t" className="input" value={f.title} onChange={set('title')} /></Field>
        <Field label="Descripción" htmlFor="pr-d"><textarea id="pr-d" className="textarea" value={f.description} onChange={set('description')} /></Field>
        <div className="form-grid cols-2">
          <Field label="Código" htmlFor="pr-c"><input id="pr-c" className="input" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, '') })} /></Field>
          <Field label="Descuento (%)" htmlFor="pr-v"><input id="pr-v" type="number" min="1" max="100" className="input" value={f.value} onChange={set('value')} /></Field>
        </div>
        <Field label="Válida hasta (opcional)" htmlFor="pr-u"><input id="pr-u" type="date" className="input" value={f.validUntil || ''} onChange={set('validUntil')} /></Field>
        <div><h4 style={{ marginBottom: 8, fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--muted)', fontWeight: 500 }}>Solo estos días (vacío = todos)</h4><div className="chips">{ORDER.map((d) => <button type="button" key={d} className={`chip ${f.days.includes(d) ? 'active' : ''}`} aria-pressed={f.days.includes(d)} onClick={() => toggleDay(d)}>{DAY_NAMES[d].slice(0, 3)}</button>)}</div></div>
        <Toggle checked={f.firstOnly} onChange={(v) => setF({ ...f, firstOnly: v })}>Solo para la primera cita del cliente</Toggle>
        <Toggle checked={f.auto} onChange={(v) => setF({ ...f, auto: v })}>Aplicar automáticamente (sin código)</Toggle>
        <Toggle checked={f.active} onChange={(v) => setF({ ...f, active: v })}>Activa</Toggle>
      </div>
    </Modal>
  );
}

/* ── Ajustes ───────────────────────────────────────── */
export function AdminSettings() {
  const db = useDB(); const save = useSave();
  const [f, setF] = useState(db.settings);
  const pm = (k) => (e) => setF({ ...f, payment: { ...f.payment, pagoMovil: { ...f.payment.pagoMovil, [k]: e.target.value } } });
  const zl = (k) => (e) => setF({ ...f, payment: { ...f.payment, zelle: { ...f.payment.zelle, [k]: e.target.value } } });
  return (
    <>
      <div className="page-head" style={{ marginBottom: 0 }}><h1>Ajustes de cobro</h1><p>Estos datos se muestran a los clientes al pagar.</p></div>
      <form className="card card-pad stack" style={{ maxWidth: 640 }} onSubmit={(e) => { e.preventDefault(); save((id) => saveSettings({ actorId: id, settings: { ...f, exchangeRate: Number(f.exchangeRate) } }), 'Ajustes guardados'); }}>
        <Field label="Tasa de cambio (Bs. por USD)" htmlFor="st-r" hint="Se usa para mostrar el monto en bolívares."><input id="st-r" type="number" min="1" step="0.01" className="input" value={f.exchangeRate} onChange={(e) => setF({ ...f, exchangeRate: e.target.value })} /></Field>
        <h3>Pago Móvil</h3>
        <div className="form-grid cols-2">
          <Field label="Teléfono" htmlFor="st-ph"><input id="st-ph" className="input" value={f.payment.pagoMovil.phone} onChange={pm('phone')} /></Field>
          <Field label="Cédula / RIF" htmlFor="st-id"><input id="st-id" className="input" value={f.payment.pagoMovil.idDoc} onChange={pm('idDoc')} /></Field>
        </div>
        <Field label="Correo Zelle" htmlFor="st-z"><input id="st-z" className="input" value={f.payment.zelle.email} onChange={zl('email')} /></Field>
        <div><button className="btn btn-gold">Guardar ajustes</button></div>
      </form>
    </>
  );
}
