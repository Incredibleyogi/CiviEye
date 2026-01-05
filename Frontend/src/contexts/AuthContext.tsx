import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authApi, profileApi, passwordApi } from '@/lib/api';
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
    verifyOtp: (otp: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  resendOtp: () => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  updateProfile: (data: { name?: string; bio?: string; avatar?: string }) => Promise<boolean>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { registerUser, isConnected } = useSocket();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

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
          bio: userData.bio,
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
  setPendingEmail(data.email); // ✅ STORE EMAIL FOR OTP
  return { success: true };
}
      return { success: false, error: res.error || 'Signup failed' };
    } catch {
      return { success: false, error: 'Signup failed' };
    }
  }, []);

 const verifyOtp = useCallback(async (otp: string) => {
  if (!pendingEmail) {
    return {
      success: false,
      error: 'Email missing. Please sign up again.',
    };
  }

  try {
    const res = await authApi.verifyOtp({
      email: pendingEmail,
      otp,
    });
    return res;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OTP verification failed',
    };
  }
}, [pendingEmail]);


const resendOtp = useCallback(async () => {
  if (!pendingEmail) {
    return {
      success: false,
      error: 'Email missing. Please sign up again.',
    };
  }

  try {
    const res = await authApi.resendOtp({
      email: pendingEmail,
    });
    return res;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resend OTP',
    };
  }
}, [pendingEmail]);

 

  const logout = useCallback(() => {
    localStorage.removeItem('civiceye_token');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const updateProfile = useCallback(async (data: { name?: string; bio?: string; avatar?: string }) => {
    try {
      const res = await profileApi.updateProfile(data);
      if (res.success && res.data) {
        const userData = (res.data as any).user || res.data;
        setUser(prev => prev ? {
          ...prev,
          name: userData.name || prev.name,
          bio: userData.bio || prev.bio,
          avatar: userData.avatar || prev.avatar,
        } : null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      const res = await passwordApi.changePassword({ currentPassword, newPassword });
      return res.success;
    } catch {
      return false;
    }
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
        verifyOtp,
    resendOtp,
        login,
        signup,
        logout,
        updateUser,
        updateProfile,
        updatePassword,
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
