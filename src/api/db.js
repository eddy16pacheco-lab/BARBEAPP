import { buildSeed, DB_VERSION } from './seed.js';

export class ApiError extends Error {}

const KEY = 'barbapp.db.v1';
let state = null;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

function load() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.version === DB_VERSION) return parsed;
    }
  } catch { /* datos corruptos: se regenera el demo */ }
  const fresh = buildSeed(new Date());
  try { window.localStorage.setItem(KEY, JSON.stringify(fresh)); } catch { /* sin almacenamiento */ }
  return fresh;
}

export const getDB = () => (state ||= load());
export const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };

/** Todas las escrituras pasan por aquí: se opera sobre una copia y se persiste solo si no hubo errores. */
export function mutate(fn) {
  const draft = structuredClone(getDB());
  const result = fn(draft);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    throw new ApiError('No hay espacio de almacenamiento en el navegador. Usa un comprobante más liviano.');
  }
  state = draft;
  emit();
  return result;
}

export function resetDemo() {
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem('barbapp.session');
  state = null;
  emit();
}

// Sincroniza varias pestañas: la disponibilidad se actualiza al instante.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) { state = null; emit(); }
  });
}
