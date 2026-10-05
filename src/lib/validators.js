export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v || '').trim());

/** Móvil venezolano (0412, 0414, 0416, 0422, 0424, 0426) + 7 dígitos. Acepta guiones, espacios y +58. */
export function normalizeVEPhone(v) {
  return (v || '').replace(/[\s\-().]/g, '').replace(/^\+?58/, '0');
}
export const isVEMobile = (v) => /^04(12|14|16|22|24|26)\d{7}$/.test(normalizeVEPhone(v));

export const isIdDoc = (v) => /^\d{6,9}$/.test((v || '').trim());
export const isReference = (v) => /^\d{4,12}$/.test((v || '').trim());

export function passwordIssue(pw) {
  if (!pw || pw.length < 6) return 'Usa al menos 6 caracteres.';
  return null;
}

export const ACCEPTED_PROOF_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];
export const MAX_PROOF_BYTES = 5 * 1024 * 1024;

export function proofIssue(file) {
  if (!file) return 'Adjunta el comprobante de pago.';
  if (!ACCEPTED_PROOF_TYPES.includes(file.type)) return 'El comprobante debe ser PNG, JPG o PDF.';
  if (file.size > MAX_PROOF_BYTES) return 'El archivo supera los 5 MB.';
  return null;
}
