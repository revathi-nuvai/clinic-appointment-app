import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from '../utils/constants';
import { User, AuthTokens, LoginCredentials, RegisterCredentials } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // Start loading=true so PrivateRoute never flashes a redirect before auth resolves
  const [isLoading, setIsLoading] = useState(true);

  const storeSession = (u: User, tokens: AuthTokens) => {
    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  };

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  // On mount: validate existing token with backend to prevent stale session
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    api.get('/users/me')
      .then(res => setUser(res.data.data))
      .catch(() => clearSession())
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/login', credentials);
      storeSession(data.data.user, {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/register', credentials);
      storeSession(data.data.user, {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // Always clear session even if API call fails
    } finally {
      clearSession();
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
