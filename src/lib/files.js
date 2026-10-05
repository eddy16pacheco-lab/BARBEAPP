import { proofIssue } from './validators.js';

const MAX_IMG_SIDE = 1280;
const MAX_PDF_BYTES = 1024 * 1024; // el demo guarda en localStorage (~5 MB en total)

const readAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('No pudimos leer el archivo.'));
    r.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('La imagen no es válida.'));
    i.src = src;
  });

/**
 * Valida y convierte el comprobante a un objeto serializable.
 * Las imágenes se reducen (máx. 1280 px, JPEG) para no llenar el almacenamiento del demo.
 * En producción el archivo se sube a S3/Cloudinary y solo se guarda la URL.
 */
export async function fileToProof(file) {
  const issue = proofIssue(file);
  if (issue) throw new Error(issue);
  const raw = await readAsDataURL(file);
  if (file.type === 'application/pdf') {
    if (file.size > MAX_PDF_BYTES) throw new Error('En el demo los PDF pueden pesar hasta 1 MB.');
    return { name: file.name, type: file.type, size: file.size, dataUrl: raw };
  }
  const image = await loadImage(raw);
  const scale = Math.min(1, MAX_IMG_SIDE / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
  return { name: file.name, type: 'image/jpeg', size: Math.round(dataUrl.length * 0.75), dataUrl };
}

export const formatBytes = (n) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1048576).toFixed(1)} MB`);
