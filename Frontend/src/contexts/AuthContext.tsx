import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authApi, profileApi } from '@/lib/api';
import { useSocket } from './SocketContext';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: { name: string; email: string; password: string; confirmPassword: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { registerUser, isConnected } = useSocket();

  // Register user with socket when authenticated
  useEffect(() => {
    if (user && isConnected) {
      registerUser(user.id);
    }
  }, [user, isConnected, registerUser]);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('civiceye_token');
      if (token) {
        try {
          const res = await profileApi.getCurrentUser();
          if (res.success && res.data) {
            const userData = res.data as any;
            setUser({
              id: userData._id || userData.id,
              name: userData.name,
              email: userData.email,
              avatar: userData.avatar,
              bio: userData.bio,
              role: userData.role,
            });
          } else {
            localStorage.removeItem('civiceye_token');
          }
        } catch {
          localStorage.removeItem('civiceye_token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await authApi.login({ email, password });
      if (res.success && res.data) {
        const { token, user: userData } = res.data as { token: string; user: any };
        localStorage.setItem('civiceye_token', token);
        setUser({
          id: userData._id || userData.id,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar,
          role: userData.role,
        });
        return { success: true };
      }
      return { success: false, error: res.error || 'Login failed' };
    } catch {
      return { success: false, error: 'Login failed' };
    }
  }, []);

  const signup = useCallback(async (data: { name: string; email: string; password: string; confirmPassword: string }) => {
    try {
      const res = await authApi.signup(data);
      if (res.success) {
        return { success: true };
      }
      return { success: false, error: res.error || 'Signup failed' };
    } catch {
      return { success: false, error: 'Signup failed' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('civiceye_token');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        loading,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
