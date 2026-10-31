import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '../types/auth';
import { AuthService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (payload: {
    email: string;
    full_name: string;
    password: string;
    confirm_password: string;
    accept_terms: boolean;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateUser: (user: User) => void;
  hasRole: (role: 'ADMIN' | 'OFFICER' | 'ANY') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial authentication check on application boot
  const initializeAuth = useCallback(async () => {
    setIsLoading(true);
    const stored = AuthService.getStoredAuth();
    if (stored.token && stored.user) {
      setUser(stored.user);
      setToken(stored.token);
      try {
        // Validate token against backend /me
        const validatedUser = await AuthService.getMe();
        setUser(validatedUser);
        setToken(AuthService.getToken());
      } catch (err) {
        console.warn('Initial session validation error:', err);
        // If validation failed, clear session
        AuthService.clearSession();
        setUser(null);
        setToken(null);
      }
    } else {
      setUser(null);
      setToken(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Periodic token refresh check every 15 minutes
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(async () => {
      try {
        const refreshed = await AuthService.refreshToken();
        if (refreshed) {
          setToken(refreshed.access_token);
        }
      } catch (e) {
        console.warn('Background token refresh failed:', e);
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token]);

  const login = async (email: string, password: string, rememberMe = false) => {
    setIsLoading(true);
    try {
      const res = await AuthService.login(email, password, rememberMe);
      setUser(res.user);
      setToken(res.access_token);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: {
    email: string;
    full_name: string;
    password: string;
    confirm_password: string;
    accept_terms: boolean;
  }) => {
    setIsLoading(true);
    try {
      const res = await AuthService.register(payload);
      setUser(res.user);
      setToken(res.access_token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AuthService.logout();
    } finally {
      setUser(null);
      setToken(null);
      setIsLoading(false);
    }
  };

  const refreshAuth = async () => {
    const refreshed = await AuthService.refreshToken();
    if (refreshed) {
      setToken(refreshed.access_token);
      try {
        const me = await AuthService.getMe();
        setUser(me);
      } catch {
        // fallback
      }
    } else {
      setUser(null);
      setToken(null);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const hasRole = (role: 'ADMIN' | 'OFFICER' | 'ANY'): boolean => {
    return AuthService.hasPermission(user?.role as UserRole, role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        register,
        logout,
        refreshAuth,
        updateUser,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

