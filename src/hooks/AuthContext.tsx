import { useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '../types';
import { apiClient } from '../api/client';
import { AuthContext, TOKEN_KEY } from './authTypes';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;
    apiClient.setToken(token);

    apiClient.getMe()
      .then((userData) => {
        if (!cancelled) {
          setUser(userData);
        }
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          apiClient.setToken(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiClient.login({ email, password });
    localStorage.setItem(TOKEN_KEY, response.token);
    setToken(response.token);
    apiClient.setToken(response.token);
    setUser(response.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const response = await apiClient.register({ email, password, name });
    localStorage.setItem(TOKEN_KEY, response.token);
    setToken(response.token);
    apiClient.setToken(response.token);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    apiClient.setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
