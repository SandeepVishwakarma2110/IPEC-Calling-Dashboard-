import { createContext, useContext, useState } from 'react';
import { api } from './api';
const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
export function AuthProvider({ children }) {
  const [client, setClient] = useState(() => JSON.parse(localStorage.getItem('client') || 'null'));
  const login = async (email, password) => {
    const d = await api('/auth/login', { method: 'POST', body: { email, password } });
    localStorage.setItem('token', d.token); localStorage.setItem('client', JSON.stringify(d.client)); setClient(d.client);
  };
  const logout = async () => { try { await api('/auth/logout', { method: 'POST' }); } catch {} localStorage.clear(); setClient(null); };
  return <Ctx.Provider value={{ client, login, logout }}>{children}</Ctx.Provider>;
}
