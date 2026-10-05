import { isEmail, isIdDoc, isReference, isVEMobile } from './validators.js';
import { toISODate } from './dates.js';

export const PAYMENT_METHODS = [
  { key: 'pago_movil', label: 'Pago Móvil', needsProof: true },
  { key: 'transferencia', label: 'Transferencia', needsProof: true },
  { key: 'zelle', label: 'Zelle / otros', needsProof: true },
  { key: 'efectivo', label: 'Efectivo', needsProof: false },
];
export const methodLabel = (k) => PAYMENT_METHODS.find((m) => m.key === k)?.label || k;
export const methodNeedsProof = (k) => !!PAYMENT_METHODS.find((m) => m.key === k)?.needsProof;

export const emptyPaymentData = (today = toISODate(new Date())) => ({
  bank: '', phone: '', idType: 'V', idDoc: '', reference: '', paymentDate: today, holder: '', senderEmail: '',
});

/** Valida el formulario de pago. Devuelve { field: mensaje }; vacío = válido. Se usa en UI y en la API. */
export function validatePayment({ method, data, proof }, today = toISODate(new Date())) {
  const e = {};
  if (!PAYMENT_METHODS.some((m) => m.key === method)) return { method: 'Elige un método de pago.' };
  if (method === 'efectivo') return e;

  if (method === 'pago_movil') {
    if (!data.bank) e.bank = 'Elige tu banco.';
    if (!isVEMobile(data.phone)) e.phone = 'Ingresa un teléfono válido (ej. 0414-1234567).';
    if (!isIdDoc(data.idDoc)) e.idDoc = 'Cédula o RIF con 6 a 9 dígitos, sin puntos.';
  }
  if (method === 'transferencia') {
    if (!data.bank) e.bank = 'Elige el banco de origen.';
    if (!data.holder || data.holder.trim().length < 3) e.holder = 'Indica el titular de la cuenta.';
  }
  if (method === 'zelle') {
    if (!isEmail(data.senderEmail)) e.senderEmail = 'Ingresa el correo desde el que enviaste el pago.';
  }
  if (method === 'zelle') {
    if (!/^[A-Za-z0-9]{4,20}$/.test((data.reference || '').trim())) e.reference = 'El código de confirmación tiene de 4 a 20 letras o números.';
  } else if (!isReference(data.reference)) e.reference = 'La referencia tiene de 4 a 12 dígitos.';
  if (!data.paymentDate) e.paymentDate = 'Indica la fecha del pago.';
  else if (data.paymentDate > today) e.paymentDate = 'La fecha no puede ser futura.';
  if (!proof) e.proof = 'Adjunta el comprobante (PNG, JPG o PDF).';
  return e;
}
