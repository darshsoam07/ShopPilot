import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getJson, postJson, TOKEN_KEY } from '../services/http';

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  role: 'customer' | 'admin' | string;
}

interface TokenResponse { access_token: string; token_type: string }
interface Credentials { email: string; password: string }
interface Registration extends Credentials { full_name: string }

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: Credentials) => Promise<void>;
  register: (data: Registration) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener('shoppilot:unauthorized', handleUnauthorized);

    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
    } else {
      getJson<AuthUser>('/api/v1/auth/me')
        .then(setUser)
        .catch(clearSession)
        .finally(() => setIsLoading(false));
    }

    return () => window.removeEventListener('shoppilot:unauthorized', handleUnauthorized);
  }, [clearSession]);

  const login = useCallback(async (credentials: Credentials) => {
    const token = await postJson<TokenResponse>('/api/v1/auth/login', credentials);
    sessionStorage.setItem(TOKEN_KEY, token.access_token);
    const currentUser = await getJson<AuthUser>('/api/v1/auth/me');
    setUser(currentUser);
  }, []);

  const register = useCallback(async (data: Registration) => {
    await postJson<AuthUser>('/api/v1/auth/register', data);
    await login({ email: data.email, password: data.password });
  }, [login]);

  const logout = useCallback(() => clearSession(), [clearSession]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
  }), [user, isLoading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
