/** Fuente (src) para mostrar un comprobante: el subido por el cliente o uno de demostración generado al vuelo. */
export function proofSrc(proof) {
  if (!proof) return null;
  if (proof.dataUrl) return proof.dataUrl;
  if (proof.demo) {
    const { ref, amountBs } = proof.demo;
    return (
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="520" viewBox="0 0 360 520"><rect width="360" height="520" fill="#f4f4f5"/><rect x="24" y="24" width="312" height="472" rx="14" fill="#fff"/><circle cx="180" cy="86" r="30" fill="#16a34a"/><path d="M165 86l11 11 20-22" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><text x="180" y="152" font-family="Arial" font-size="20" font-weight="700" text-anchor="middle" fill="#18181b">Pago móvil exitoso</text><text x="180" y="196" font-family="Arial" font-size="28" font-weight="700" text-anchor="middle" fill="#18181b">Bs. ${amountBs}</text><line x1="48" y1="232" x2="312" y2="232" stroke="#e4e4e7"/><text x="48" y="268" font-family="Arial" font-size="14" fill="#71717a">Referencia</text><text x="312" y="268" font-family="Arial" font-size="14" text-anchor="end" fill="#18181b">${ref}</text><text x="48" y="304" font-family="Arial" font-size="14" fill="#71717a">Destino</text><text x="312" y="304" font-family="Arial" font-size="14" text-anchor="end" fill="#18181b">BarbApp C.A.</text><text x="180" y="470" font-family="Arial" font-size="12" text-anchor="middle" fill="#a1a1aa">Comprobante de demostración</text></svg>`
      )
    );
  }
  return null;
}
export const isPdf = (proof) => proof?.type === 'application/pdf';

/** Convierte un data URL en un blob URL (los navegadores bloquean abrir PDFs como data: en pestañas nuevas). */
export function dataUrlToBlobUrl(dataUrl) {
  const [head, b64] = dataUrl.split(',');
  const mime = /data:([^;]+)/.exec(head)?.[1] || 'application/octet-stream';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}
