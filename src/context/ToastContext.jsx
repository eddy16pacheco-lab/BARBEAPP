import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);
const ICONS = { ok: CheckCircle2, err: AlertCircle, info: Info };

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((type, text) => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l, { id, type, text }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 4200);
  }, []);
  const api = useMemo(() => ({ ok: (t) => push('ok', t), err: (t) => push('err', t), info: (t) => push('info', t) }), [push]);
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => {
          const Icon = ICONS[t.type];
          return <div key={t.id} className={`toast ${t.type}`}><Icon size={18} />{t.text}</div>;
        })}
      </div>
    </ToastCtx.Provider>
  );
}
