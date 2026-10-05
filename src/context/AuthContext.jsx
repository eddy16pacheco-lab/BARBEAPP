import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useDB } from './DataContext.jsx';
import * as api from '../api/api.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const db = useDB();
  const [uid, setUid] = useState(api.getSessionUserId());

  useEffect(() => {
    const onStorage = (e) => { if (e.key === 'barbapp.session') setUid(api.getSessionUserId()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const user = useMemo(() => db.users.find((u) => u.id === uid) || null, [db, uid]);

  const signIn = useCallback(async (creds) => { const u = await api.login(creds); setUid(u.id); return u; }, []);
  const signUp = useCallback(async (data) => { const u = await api.register(data); setUid(u.id); return u; }, []);
  const signOut = useCallback(() => { api.logout(); setUid(null); }, []);

  const value = useMemo(() => ({ user, isAdmin: user?.role === 'admin', signIn, signUp, signOut }), [user, signIn, signUp, signOut]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
