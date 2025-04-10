import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export enum UserRole {
  PRODUCT_MANAGER = 'product_manager',
  PRODUCT_DIRECTOR = 'product_director',
  ADMIN = 'admin'
}

interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, department: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  isProductDirector: () => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Fetch user data
      api.get('/api/me')
        .then(response => {
          setUser(response.data);
          setIsAuthenticated(true);
        })
        .catch(() => {
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
          setIsAuthenticated(false);
        });
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, department: string) => {
    await api.post('/api/register', { email, password, name, department });
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (data: Partial<User>) => {
    const response = await api.put('/api/profile', data);
    setUser(response.data);
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    await api.put('/api/password', { oldPassword, newPassword });
  };

  const isProductDirector = () => {
    return user?.role === UserRole.PRODUCT_DIRECTOR;
  };

  const isAdmin = () => {
    return user?.role === UserRole.ADMIN;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isProductDirector,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 