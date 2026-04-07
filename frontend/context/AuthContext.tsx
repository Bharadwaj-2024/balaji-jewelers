'use client';
// context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI } from '@/lib/api';

interface User { id: number; name: string; email: string; role: string; phone?: string; }
interface AuthCtx {
  user: User | null;
  loading: boolean;
  login:    (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout:   () => Promise<void>;
  isAdmin:  boolean;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('bj_user') : null;
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch (_) {}
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('bj_token', data.token);
    localStorage.setItem('bj_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    const { data } = await authAPI.register({ name, email, password, phone });
    localStorage.setItem('bj_token', data.token);
    localStorage.setItem('bj_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = async () => {
    await authAPI.logout().catch(() => {});
    localStorage.removeItem('bj_token');
    localStorage.removeItem('bj_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
