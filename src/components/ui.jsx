import { useEffect, useId, useRef, useState } from 'react';
import { Star, X, Scissors, Check, Copy, Loader2, ShoppingBag } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { methodLabel } from '../lib/paymentRules.js';

export function Stars({ value = 0, size = 14 }) {
  const full = Math.round(value);
  return (
    <span className="stars" role="img" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= full ? '' : 'off'} fill="currentColor" strokeWidth={0} />
      ))}
    </span>
  );
}

export function StarInput({ value, onChange }) {
  return (
    <div className="stars-input row" role="radiogroup" aria-label="Calificación" style={{ gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" role="radio" aria-checked={value === i} aria-label={`${i} estrellas`} className={i <= value ? 'on' : ''} onClick={() => onChange(i)}>
          <Star size={32} fill="currentColor" strokeWidth={0} />
        </button>
      ))}
    </div>
  );
}

const STATUS = {
  pending: 'Pendiente', confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada',
};
export const statusLabel = (s) => STATUS[s] || s;
export const StatusBadge = ({ status }) => <span className={`badge badge-${status}`}>{STATUS[status] || status}</span>;

const PAY = {
  pending: ['pending', 'Pendiente de validación'], approved: ['approved', 'Pago aprobado'], rejected: ['rejected', 'Pago rechazado'],
  refund_pending: ['warn', 'Reembolso pendiente'], cancelled: ['cancelled', 'Pago anulado'],
};
export function PayBadge({ payment }) {
  if (!payment) return null;
  if (payment.method === 'efectivo' && payment.status === 'pending') return <span className="badge badge-pending">Efectivo: se cobra en la barbería</span>;
  const [cls, label] = PAY[payment.status] || ['info', payment.status];
  return <span className={`badge badge-${cls}`}>{label}</span>;
}
export const PayMethod = ({ method }) => <>{methodLabel(method)}</>;

export function Media({ src, alt = '', className = '', style, icon: Icon = Scissors }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`media ${className}`} style={style}>
      {src && !failed ? <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} /> : <div className="media-fallback" aria-hidden><Icon size={28} /></div>}
    </div>
  );
}

export function Avatar({ src, name = '', size = 40 }) {
  const [failed, setFailed] = useState(false);
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {src && !failed ? <img src={src} alt="" onError={() => setFailed(true)} /> : initials}
    </span>
  );
}

export function Modal({ title, onClose, children, footer, wide = false }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const prev = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector('input, select, textarea, button:not(.modal-x)')?.focus?.();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref}>
        <div className="modal-head">
          <h3 id={titleId}>{title}</h3>
          <button className="icon-btn modal-x" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
        </div>
        {children}
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, error, hint, children, htmlFor }) {
  return (
    <div className="field">
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {error ? <span className="field-error" role="alert">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}

export const Empty = ({ icon: Icon = ShoppingBag, title, children }) => (
  <div className="empty"><Icon size={34} /><strong style={{ color: 'var(--text)' }}>{title}</strong>{children && <p>{children}</p>}</div>
);

export const Spinner = ({ size = 18 }) => <Loader2 size={size} className="spin" aria-label="Cargando" />;

export function Busy({ busy, children }) {
  return <>{busy ? <Spinner /> : null}{children}</>;
}

export function CopyRow({ label, value, copy = true }) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  const doCopy = async () => {
    try { await navigator.clipboard.writeText(String(value)); setDone(true); setTimeout(() => setDone(false), 1500); toast.info('Copiado'); }
    catch { toast.err('No pudimos copiar. Hazlo manualmente.'); }
  };
  return (
    <div className="copy-row">
      <span>{label}</span>
      {copy
        ? <button type="button" onClick={doCopy} aria-label={`Copiar ${label}`}>{value}{done ? <Check size={15} /> : <Copy size={15} />}</button>
        : <strong style={{ fontWeight: 600 }}>{value}</strong>}
    </div>
  );
}

export const initialsOf = (name = '') => name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
export const shortName = (name = '') => { const [a, b] = name.split(' '); return b ? `${a} ${b[0]}.` : a; };
