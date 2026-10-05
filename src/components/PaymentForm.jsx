import { useRef, useState } from 'react';
import { Smartphone, Landmark, Banknote, Globe, Upload, FileText, X, Info, Loader2 } from 'lucide-react';
import { BANKS, bankLabel } from '../api/banks.js';
import { PAYMENT_METHODS } from '../lib/paymentRules.js';
import { fileToProof, formatBytes } from '../lib/files.js';
import { ACCEPTED_PROOF_TYPES } from '../lib/validators.js';
import { bs, usd } from '../lib/pricing.js';
import { toISODate } from '../lib/dates.js';
import { isPdf, proofSrc } from '../lib/proof.js';
import { CopyRow, Field } from './ui.jsx';

const ICONS = { pago_movil: Smartphone, transferencia: Landmark, zelle: Globe, efectivo: Banknote };

function FileDrop({ proof, onChange, error }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');

  const take = async (file) => {
    if (!file) return;
    setBusy(true); setLocalError('');
    try { onChange(await fileToProof(file)); }
    catch (e) { setLocalError(e.message); onChange(null); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  };

  if (proof) {
    return (
      <div className="proof">
        <div className="thumb">{isPdf(proof) ? <FileText size={22} /> : <img src={proofSrc(proof)} alt="Vista previa del comprobante" />}</div>
        <div className="grow"><strong style={{ fontWeight: 600, wordBreak: 'break-all' }}>{proof.name}</strong><div className="muted small">{formatBytes(proof.size)}</div></div>
        <button type="button" className="icon-btn" onClick={() => onChange(null)} aria-label="Quitar comprobante"><X size={18} /></button>
      </div>
    );
  }
  const err = localError || error;
  return (
    <>
      <div
        className={`drop ${over ? 'over' : ''} ${err ? 'is-invalid' : ''}`} role="button" tabIndex={0}
        onClick={() => input.current?.click()} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files?.[0]); }}
      >
        {busy ? <Loader2 className="spin" size={26} /> : <Upload size={26} />}
        <strong style={{ fontWeight: 600, color: 'var(--text)' }}>{busy ? 'Procesando…' : 'Sube tu comprobante'}</strong>
        <span className="small">Arrastra el archivo o toca para elegirlo. PNG, JPG o PDF, hasta 5 MB.</span>
        <input ref={input} type="file" hidden accept={ACCEPTED_PROOF_TYPES.join(',')} onChange={(e) => take(e.target.files?.[0])} />
      </div>
      {err && <span className="field-error" role="alert">{err}</span>}
    </>
  );
}

/**
 * Formulario de pago (Pago Móvil, transferencia, Zelle/otros y efectivo).
 * value = { method, data, proof }. Los errores los calcula el padre con validatePayment().
 */
export default function PaymentForm({ amount, settings, value, onChange, errors = {} }) {
  const { method, data, proof } = value;
  const set = (patch) => onChange({ ...value, data: { ...data, ...patch } });
  const rate = settings.exchangeRate;
  const pm = settings.payment;
  const idLabel = (v) => v || '';

  return (
    <div className="stack">
      <div className="pay-tabs" role="tablist" aria-label="Método de pago">
        {PAYMENT_METHODS.map((m) => {
          const Icon = ICONS[m.key];
          return (
            <button key={m.key} type="button" role="tab" aria-selected={method === m.key} className={`pay-tab ${method === m.key ? 'active' : ''}`} onClick={() => onChange({ ...value, method: m.key, proof: m.needsProof ? proof : null })}>
              <Icon size={20} />{m.label}
            </button>
          );
        })}
      </div>

      <div className="card card-pad" style={{ background: 'var(--bg)' }}>
        <div className="card-title"><Info size={17} /><strong>{method === 'efectivo' ? 'Pago en la barbería' : 'Datos para pagar'}</strong></div>
        {method === 'pago_movil' && (<>
          <CopyRow label="Banco" value={bankLabel(pm.pagoMovil.bank)} copy={false} />
          <CopyRow label="Teléfono" value={pm.pagoMovil.phone} />
          <CopyRow label="Cédula / RIF" value={pm.pagoMovil.idDoc} />
          <CopyRow label="Monto" value={bs(amount, rate).replace('Bs. ', '')} />
          <p className="hint" style={{ marginTop: '0.5rem' }}>Equivale a {usd(amount)} a la tasa de Bs. {rate} por dólar.</p>
        </>)}
        {method === 'transferencia' && (<>
          <CopyRow label="Banco" value={bankLabel(pm.transfer.bank)} copy={false} />
          <CopyRow label="Cuenta" value={pm.transfer.account} />
          <CopyRow label="Titular" value={pm.transfer.holder} copy={false} />
          <CopyRow label="Cédula / RIF" value={pm.transfer.idDoc} />
          <CopyRow label="Monto" value={bs(amount, rate).replace('Bs. ', '')} />
        </>)}
        {method === 'zelle' && (<>
          <CopyRow label="Correo Zelle" value={pm.zelle.email} />
          <CopyRow label="Titular" value={pm.zelle.holder} copy={false} />
          <CopyRow label="Monto" value={usd(amount)} copy={false} />
          <p className="hint" style={{ marginTop: '0.5rem' }}>También aceptamos otras billeteras en dólares: escríbenos por WhatsApp y súbenos el comprobante aquí.</p>
        </>)}
        {method === 'efectivo' && (
          <p className="muted">Pagas <strong style={{ color: 'var(--gold)' }}>{usd(amount)}</strong> al llegar. Tu reserva queda pendiente hasta que el equipo la confirme; si cambias de planes, cancela con al menos 2 horas de anticipación.</p>
        )}
      </div>

      {method !== 'efectivo' && (
        <div className="form-grid cols-2">
          {method === 'pago_movil' && (<>
            <Field label="Tu banco" error={errors.bank} htmlFor="pm-bank">
              <select id="pm-bank" className={`select ${errors.bank ? 'is-invalid' : ''}`} value={data.bank} onChange={(e) => set({ bank: e.target.value })}>
                <option value="">Selecciona…</option>{BANKS.map((b) => <option key={b.code} value={b.code}>{b.name} ({b.code})</option>)}
              </select>
            </Field>
            <Field label="Teléfono con el que pagaste" error={errors.phone} htmlFor="pm-phone">
              <input id="pm-phone" className={`input ${errors.phone ? 'is-invalid' : ''}`} inputMode="tel" placeholder="0414-1234567" autoComplete="tel" value={data.phone} onChange={(e) => set({ phone: e.target.value })} />
            </Field>
            <Field label="Cédula o RIF del titular" error={errors.idDoc} htmlFor="pm-id">
              <div className="input-group">
                <select className="select" aria-label="Tipo de documento" value={data.idType} onChange={(e) => set({ idType: e.target.value })}>{['V', 'E', 'J', 'G', 'P'].map((t) => <option key={t}>{t}</option>)}</select>
                <input id="pm-id" className={`input ${errors.idDoc ? 'is-invalid' : ''}`} inputMode="numeric" placeholder="12345678" value={data.idDoc} onChange={(e) => set({ idDoc: e.target.value.replace(/\D/g, '') })} />
              </div>
            </Field>
          </>)}
          {method === 'transferencia' && (<>
            <Field label="Banco de origen" error={errors.bank} htmlFor="tr-bank">
              <select id="tr-bank" className={`select ${errors.bank ? 'is-invalid' : ''}`} value={data.bank} onChange={(e) => set({ bank: e.target.value })}>
                <option value="">Selecciona…</option>{BANKS.map((b) => <option key={b.code} value={b.code}>{b.name} ({b.code})</option>)}
              </select>
            </Field>
            <Field label="Titular de la cuenta" error={errors.holder} htmlFor="tr-holder">
              <input id="tr-holder" className={`input ${errors.holder ? 'is-invalid' : ''}`} autoComplete="name" value={data.holder} onChange={(e) => set({ holder: e.target.value })} />
            </Field>
          </>)}
          {method === 'zelle' && (
            <Field label="Correo desde el que enviaste" error={errors.senderEmail} htmlFor="zl-mail">
              <input id="zl-mail" type="email" className={`input ${errors.senderEmail ? 'is-invalid' : ''}`} autoComplete="email" value={data.senderEmail} onChange={(e) => set({ senderEmail: e.target.value })} />
            </Field>
          )}
          <Field label={method === 'zelle' ? 'Código de confirmación' : 'Número de referencia'} error={errors.reference} htmlFor="pay-ref" hint={method === 'pago_movil' ? 'Los últimos dígitos que aparecen en tu comprobante.' : undefined}>
            <input id="pay-ref" className={`input ${errors.reference ? 'is-invalid' : ''}`} inputMode={method === 'zelle' ? 'text' : 'numeric'} value={data.reference} onChange={(e) => set({ reference: method === 'zelle' ? e.target.value.replace(/\W/g, '') : e.target.value.replace(/\D/g, '') })} />
          </Field>
          <Field label="Fecha del pago" error={errors.paymentDate} htmlFor="pay-date">
            <input id="pay-date" type="date" max={toISODate(new Date())} className={`input ${errors.paymentDate ? 'is-invalid' : ''}`} value={data.paymentDate} onChange={(e) => set({ paymentDate: e.target.value })} />
          </Field>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <span className="label">Comprobante de pago</span>
            <FileDrop proof={proof} error={errors.proof} onChange={(p) => onChange({ ...value, proof: p })} />
          </div>
        </div>
      )}
    </div>
  );
}
