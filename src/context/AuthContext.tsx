import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import api from '../lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, organizationSlug: string) => Promise<void>;
  bypassLogin: (email: string, organizationSlug: string) => void;
  logout: () => Promise<void>;
  setUser: (u: User | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      return;
    }

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

      const userObj: User = {
        id: identity.id ?? u.id,
        email: identity.email ?? u.email,
        fullName: computedFullName,
        name: computedFullName,
        firstName,
        lastName,
        role: u.membership?.role?.name ?? identity.role ?? u.role ?? 'ADMIN',
        organizationId: u.organization?.id ?? identity.organizationId,
      };
      setUser(userObj);
      localStorage.setItem('currentUser', JSON.stringify(userObj));
    } catch (err: any) {
      console.warn('Note: GET /auth/me was not available or returned an error:', err?.response?.status ?? err?.message);
      // Only clear tokens if the backend explicitly tells us the token is invalid (401 Unauthorized)
      if (err?.response?.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        setUser(null);
      } else {
        // Fallback: recover user from token or saved user
        const parsed = parseJwt(token);
        if (parsed) {
          const fallbackName = parsed.fullName || parsed.name || (parsed.email ? parsed.email.split('@')[0] : 'User');
          const recoveredUser: User = {
            id: parsed.id ?? parsed.sub ?? parsed.userId ?? 'user-1',
            email: parsed.email ?? '',
            fullName: fallbackName,
            name: fallbackName,
            firstName: parsed.firstName || fallbackName.split(' ')[0],
            lastName: parsed.lastName || '',
            role: parsed.role ?? 'ADMIN',
            organizationId: parsed.organizationId,
          };
          setUser((prev) => prev ?? recoveredUser);
          localStorage.setItem('currentUser', JSON.stringify(recoveredUser));
        }
      }
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
    
    const resData = data.data ?? data;
    const tokens = resData.tokens ?? resData;
    const accessToken: string | undefined = tokens.accessToken ?? resData.accessToken ?? data.accessToken;
    const refreshToken: string | undefined = tokens.refreshToken ?? resData.refreshToken ?? data.refreshToken;
    const userPayload = resData.user ?? tokens.user ?? data.user;

    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    localStorage.setItem('lastOrganizationSlug', organizationSlug.trim().toLowerCase());

    // Immediately establish user session from login response or JWT
    const jwtData = accessToken ? parseJwt(accessToken) : null;
    const rawUser = userPayload || jwtData || {};
    const fallbackName = rawUser.fullName || rawUser.name || (email ? email.split('@')[0] : 'User');
    const immediateUser: User = {
      id: rawUser.id ?? rawUser.sub ?? rawUser.userId ?? 'user-1',
      email: rawUser.email ?? email,
      fullName: fallbackName,
      name: fallbackName,
      firstName: rawUser.firstName || fallbackName.split(' ')[0],
      lastName: rawUser.lastName || (fallbackName.includes(' ') ? fallbackName.split(' ').slice(1).join(' ') : ''),
      role: rawUser.role ?? 'ADMIN',
      organizationId: rawUser.organizationId ?? organizationSlug,
    };

    setUser(immediateUser);
    localStorage.setItem('currentUser', JSON.stringify(immediateUser));

    // Try background refresh with /auth/me if endpoint exists
    try {
      await fetchCurrentUser();
    } catch {
      // keep immediateUser
    }
  };

  const bypassLogin = (email: string, organizationSlug: string) => {
    const rawName = (email || 'user').split('@')[0];
    const computedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const devUser: User = {
      id: 'usr-' + Date.now(),
      email: (email || 'user@example.com').trim().toLowerCase(),
      fullName: computedName,
      name: computedName,
      firstName: computedName,
      lastName: '',
      role: 'ADMIN',
      organizationId: (organizationSlug || 'main-org').trim().toLowerCase(),
    };
    localStorage.setItem('accessToken', 'dev-bypass-token-' + Date.now());
    localStorage.setItem('currentUser', JSON.stringify(devUser));
    localStorage.setItem('lastOrganizationSlug', (organizationSlug || 'main-org').trim().toLowerCase());
    setUser(devUser);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
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
        bypassLogin,
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
