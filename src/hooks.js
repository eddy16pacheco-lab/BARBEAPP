import { useEffect, useState } from 'react';

/** Hora actual que se refresca sola (para reglas como "faltan menos de 2 h"). */
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function useDocumentTitle(title) {
  useEffect(() => { document.title = title ? `${title} · BarbApp` : 'BarbApp · Barbería'; }, [title]);
}
