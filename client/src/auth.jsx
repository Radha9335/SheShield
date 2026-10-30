import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, tokenStore } from './api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  useEffect(() => {
    if (!tokenStore.get()) return;
    api.me().then((d) => setUser(d.user)).catch(() => tokenStore.clear()).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onOut = () => setUser(null);
    window.addEventListener('sheshield:signed-out', onOut);
    return () => window.removeEventListener('sheshield:signed-out', onOut);
  }, []);

  const finish = useCallback((data) => {
    tokenStore.set(data.token);
    setUser(data.user);
  }, []);

  const value = {
    user,
    loading,
    login: async (b) => finish(await api.login(b)),
    register: async (b) => finish(await api.register(b)),
    logout: () => { tokenStore.clear(); setUser(null); },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
