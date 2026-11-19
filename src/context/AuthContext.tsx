import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RoleType } from '../types';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<any>;
  logout: () => Promise<void>;
  hasRole: (...roles: RoleType[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('biofinger_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('biofinger_access_token');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const data = await authService.getMe();
      setUser(data);
      localStorage.setItem('biofinger_user', JSON.stringify(data));
    } catch (error) {
      setUser(null);
      localStorage.removeItem('biofinger_user');
      localStorage.removeItem('biofinger_access_token');
      localStorage.removeItem('biofinger_refresh_token');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    const res = await authService.login(credentials);
    const { accessToken, refreshToken, user: loggedUser } = res.data;

    localStorage.setItem('biofinger_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('biofinger_refresh_token', refreshToken);
    }
    localStorage.setItem('biofinger_user', JSON.stringify(loggedUser));

    setUser(loggedUser);
    return res;
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('biofinger_refresh_token');
      await authService.logout(refreshToken || undefined);
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      localStorage.removeItem('biofinger_access_token');
      localStorage.removeItem('biofinger_refresh_token');
      localStorage.removeItem('biofinger_user');
    }
  };

  const hasRole = (...roles: RoleType[]): boolean => {
    if (!user || !user.role) return false;
    const userRole = typeof user.role === 'string' ? user.role : user.role.name;
    return roles.includes(userRole as RoleType);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
