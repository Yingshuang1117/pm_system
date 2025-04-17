import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { UserRole, User } from '../types';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, department: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  isProductManager: () => boolean;
  isAdmin: () => boolean;
  hasAdminPermissions: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('[AuthContext] Initial token check:', token ? 'Token exists' : 'No token');
    
    const initializeAuth = async () => {
      if (token) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/api/me');
          console.log('[AuthContext] User data fetched:', {
            user: response.data,
            role: response.data.role,
            isSuperAdmin: response.data.role === UserRole.SUPER_ADMIN,
            isAdmin: response.data.role === UserRole.ADMIN,
            isProductManager: response.data.role === UserRole.PRODUCT_MANAGER
          });
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('[AuthContext] Error fetching user data:', error);
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        console.log('[AuthContext] No token found, setting isAuthenticated to false');
        setIsAuthenticated(false);
        setUser(null);
      }
      setIsInitializing(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/login', { username: email, password });
      const { token, user } = response.data;
      console.log('[AuthContext] Login successful:', { 
        token: token ? 'Token received' : 'No token', 
        user,
        role: user.role,
        isSuperAdmin: user.role === UserRole.SUPER_ADMIN,
        isAdmin: user.role === UserRole.ADMIN,
        isProductManager: user.role === UserRole.PRODUCT_MANAGER
      });

      if (!token) {
        throw new Error('No token received from server');
      }

      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, department: string) => {
    await api.post('/api/register', { email, password, name, department });
  };

  const logout = () => {
    console.log('[AuthContext] Logging out user:', { 
      previousUser: user,
      previousRole: user?.role 
    });
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

  const isProductManager = () => {
    console.log('[AuthContext] Checking isProductManager:', { 
      userRole: user?.role, 
      isProductManager: user?.role === UserRole.PRODUCT_MANAGER,
      userExists: !!user 
    });
    return user?.role === UserRole.PRODUCT_MANAGER;
  };

  const isAdmin = () => {
    console.log('[AuthContext] Checking isAdmin:', { 
      userRole: user?.role, 
      isAdmin: user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN,
      userExists: !!user 
    });

    return user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
  };

  const hasAdminPermissions = () => {
    const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
    const isAdminUser = user?.role === UserRole.ADMIN;
    const hasPermission = isSuperAdmin || isAdminUser;

    console.log('[AuthContext] Checking hasAdminPermissions:', { 
      userRole: user?.role, 
      isSuperAdmin,
      isAdminUser,
      hasPermission,
      userExists: !!user 
    });

    return hasPermission;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isProductManager,
    isAdmin,
    hasAdminPermissions
  };

  if (isInitializing) {
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 