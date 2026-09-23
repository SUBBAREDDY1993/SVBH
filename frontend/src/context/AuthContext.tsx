import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { Role, User } from '../types';

interface AuthContextType {
  user: Partial<User> | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (token: string, user: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Partial<User> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Clear legacy localStorage tokens so authentication is required whenever the application is opened
      localStorage.removeItem('svbh_token');
      localStorage.removeItem('svbh_user');

      const token = sessionStorage.getItem('svbh_token');
      const storedUser = authService.getStoredUser();

      if (token && storedUser) {
        try {
          const freshUser = await authService.getCurrentUser();
          setUser(freshUser);
        } catch (err) {
          console.warn('Session expired or invalid, redirecting to login:', err);
          authService.logout();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string, userData: Partial<User>) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    authService.logout();
  };

  const isAuthenticated = !!user && authService.isAuthenticated();
  const isAdmin = user?.role === 'ROLE_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
