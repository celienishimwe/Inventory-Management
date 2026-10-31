import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import api from '../lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, organizationSlug: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      const u = data.data ?? data;
      const identity = u.user ?? u.identity ?? u;

      const rawFullName = identity.fullName ?? identity.name ?? u.fullName ?? u.name;
      const rawFirstName = identity.firstName ?? u.firstName;
      const rawLastName = identity.lastName ?? u.lastName;

      const computedFullName = rawFullName || ([rawFirstName, rawLastName].filter(Boolean).join(' ')) || identity.email?.split('@')[0] || '';
      const firstName = rawFirstName || (computedFullName ? computedFullName.split(' ')[0] : '');
      const lastName = rawLastName || (computedFullName && computedFullName.includes(' ') ? computedFullName.split(' ').slice(1).join(' ') : '');

      setUser({
        id: identity.id ?? u.id,
        email: identity.email ?? u.email,
        fullName: computedFullName,
        name: computedFullName,
        firstName,
        lastName,
        role: u.membership?.role?.name ?? identity.role ?? u.role ?? 'USER',
        organizationId: u.organization?.id ?? identity.organizationId,
      });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchCurrentUser().finally(() => setIsLoading(false));
    } else {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, organizationSlug: string) => {
    const { data } = await api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
      organizationSlug: organizationSlug.trim().toLowerCase(),
    });
    const tokens = data.data ?? data;
    if (tokens.accessToken) {
      localStorage.setItem('accessToken', tokens.accessToken);
    }
    if (tokens.refreshToken) {
      localStorage.setItem('refreshToken', tokens.refreshToken);
    }
    localStorage.setItem('lastOrganizationSlug', organizationSlug.trim().toLowerCase());
    await fetchCurrentUser();
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        setUser,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
