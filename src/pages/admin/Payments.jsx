import { useState } from 'react';
import { Check, X, FileText, ExternalLink, Banknote } from 'lucide-react';
import { useDB } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { reviewPayment } from '../../api/api.js';
import { bankLabel } from '../../api/banks.js';
import { usd, bs } from '../../lib/pricing.js';
import { fmtDate, fmtTime, fmtDateShort } from '../../lib/dates.js';
import { PayBadge, Modal, Empty, Field, PayMethod } from '../../components/ui.jsx';
import { isPdf, proofSrc, dataUrlToBlobUrl } from '../../lib/proof.js';

const TABS = [['pending', 'Por validar'], ['approved', 'Aprobados'], ['rejected', 'Rechazados'], ['all', 'Todos']];

function Details({ p }) {
  const d = p.data || {};
  const rows = [
    d.bank && ['Banco', bankLabel(d.bank)], d.phone && ['Teléfono', d.phone], d.idDoc && ['Cédula/RIF', `${d.idType || ''}${d.idDoc}`], d.holder && ['Titular', d.holder],
    d.senderEmail && ['Correo Zelle', d.senderEmail], d.reference && ['Referencia', d.reference], d.paymentDate && ['Fecha de pago', fmtDateShort(d.paymentDate)],
  ].filter(Boolean);
  if (!rows.length) return <p className="muted small"><Banknote size={14} style={{ verticalAlign: -2 }} /> Se cobra en efectivo en la barbería.</p>;
  return <div className="pay-grid">{rows.map(([k, v]) => <div key={k}><span>{k}</span><strong style={{ fontWeight: 600 }}>{v}</strong></div>)}</div>;
}

export default function AdminPayments() {
  const db = useDB();
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('pending');
  const [view, setView] = useState(null);
  const [reject, setReject] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');

  const list = db.payments.filter((p) => tab === 'all' || p.status === tab).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 40);
  const count = (s) => db.payments.filter((p) => p.status === s).length;

  const decide = async (p, decision, text) => {
    setBusy(p.id);
    try { await reviewPayment({ actorId: user.id, paymentId: p.id, decision, note: text }); toast.ok(decision === 'approve' ? 'Pago aprobado. La cita quedó confirmada.' : 'Pago rechazado. Avisamos al cliente.'); setReject(null); setNote(''); }
    catch (e) { toast.err(e.message); }
    setBusy('');
  };
  const openProof = (proof) => { const url = proof.dataUrl ? dataUrlToBlobUrl(proof.dataUrl) : proofSrc(proof); window.open(url, '_blank', 'noopener'); };

  return (
    <>
      <div className="page-head" style={{ marginBottom: 0 }}><h1>Conciliación de pagos</h1><p>Compara el comprobante con el movimiento de tu banco antes de aprobar. Al aprobar, la cita queda confirmada.</p></div>
      <div className="tabs" role="tablist">{TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}{k !== 'all' && <span className="muted small num">({count(k)})</span>}</button>)}</div>
      {list.length === 0 && <div className="card"><Empty title="No hay pagos en esta lista" /></div>}
      <div className="stack">
        {list.map((p) => {
          const a = db.appointments.find((x) => x.id === p.appointmentId);
          const u = db.users.find((x) => x.id === p.userId);
          const s = db.services.find((x) => x.id === a?.serviceId);
          const src = proofSrc(p.proof);
          return (
            <article key={p.id} className="card pay-card">
              <div className="stack" style={{ gap: '0.6rem' }}>
                <div className="row-between"><div><strong>{u?.name}</strong><div className="muted small">{s?.name} · {a && `${fmtDate(a.date, { day: 'numeric', month: 'short' })}, ${fmtTime(a.time)}`}</div></div><PayBadge payment={p} /></div>
                <div className="row" style={{ gap: '1.2rem' }}><span className="price">{usd(p.amount)}</span><span className="muted small num">{bs(p.amount, db.settings.exchangeRate)} · <PayMethod method={p.method} /></span></div>
                <Details p={p} />
                {p.reviewNote && <p className="small" style={{ color: 'var(--bad)' }}>Motivo del rechazo: {p.reviewNote}</p>}
              </div>
              {p.proof && <button className="proof-thumb" onClick={() => setView(p.proof)} aria-label="Ver comprobante">{isPdf(p.proof) ? <span className="stack center" style={{ gap: 4, justifyItems: 'center' }}><FileText size={32} /><span className="small">PDF</span></span> : <img src={src} alt="Comprobante de pago" />}</button>}
              {p.status === 'pending' && (
                <div className="appt-actions" style={{ gridColumn: '1 / -1' }}>
                  <button className="btn btn-ok" disabled={busy === p.id} onClick={() => decide(p, 'approve')}><Check size={16} /> {p.method === 'efectivo' ? 'Marcar como cobrado' : 'Aprobar'}</button>
                  {p.method !== 'efectivo' && <button className="btn btn-danger" disabled={busy === p.id} onClick={() => setReject(p)}><X size={16} /> Rechazar</button>}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {view && (
        <Modal wide title="Comprobante" onClose={() => setView(null)} footer={<button className="btn btn-line" onClick={() => openProof(view)}><ExternalLink size={16} /> Abrir en pestaña nueva</button>}>
          {isPdf(view) ? <div className="empty"><FileText size={40} /><p>{view.name}</p><p className="small">Los PDF se abren en una pestaña nueva.</p></div> : <img className="proof-full" src={proofSrc(view)} alt="Comprobante de pago" />}
        </Modal>
      )}
      {reject && (
        <Modal title="Rechazar pago" onClose={() => setReject(null)} footer={<><button className="btn btn-line" onClick={() => setReject(null)}>Volver</button><button className="btn btn-danger" disabled={busy === reject.id} onClick={() => decide(reject, 'reject', note)}>Rechazar pago</button></>}>
          <Field label="Motivo (el cliente lo verá)" htmlFor="rj" hint="Ejemplo: La referencia no aparece en nuestro banco.">
            <textarea id="rj" className="textarea" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </Modal>
      )}
    </>
  );
}
