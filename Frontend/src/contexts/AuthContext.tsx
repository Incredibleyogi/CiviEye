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

const USER_STORAGE_KEY = 'civiceye_user';

// Helper to get cached user from localStorage
const getCachedUser = (): User | null => {
  try {
    const cached = localStorage.getItem(USER_STORAGE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

// Helper to save user to localStorage
const saveUserToStorage = (user: User | null) => {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize with cached user to prevent flicker
  const [user, setUser] = useState<User | null>(() => getCachedUser());
  const [loading, setLoading] = useState(true);
  const { registerUser, isConnected } = useSocket();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  // Sync user state to localStorage
  useEffect(() => {
    saveUserToStorage(user);
  }, [user]);

  // Register user with socket when authenticated
  useEffect(() => {
    if (user && isConnected) {
      registerUser(user.id);
    }
  }, [user, isConnected, registerUser]);

  // Check for existing session on mount and refresh user data
useEffect(() => {
  const checkAuth = async () => {
    const token = localStorage.getItem('civiceye_token');
    if (token) {
      try {
        const res = await profileApi.getCurrentUser();
        console.log('[AuthContext] getCurrentUser response:', res);

        if (res.success && res.data) {
          // FIX: Handle both { user: {...} } and { ...userData } formats
          const userData = (res.data as any).user || res.data;
          console.log('[AuthContext] Extracted user data:', userData);

          setUser(prev => {
            if (!prev) {
              return {
                id: userData._id || userData.id,
                name: userData.name,
                email: userData.email,
                avatar: userData.avatar,
                bio: userData.bio,
                role: userData.role,
              };
            }

            return {
              ...prev,
              name: userData.name ?? prev.name,
              email: userData.email ?? prev.email,
              avatar: userData.avatar ?? prev.avatar,
              bio: userData.bio ?? prev.bio,
              role: userData.role ?? prev.role,
            };
          });
        }
        // ❌ no else block
      } catch {
        // ❌ do not clear user here
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
        const newUser: User = {
          id: userData._id || userData.id,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar,
          bio: userData.bio,
          role: userData.role,
        };
      // update state
        setUser(newUser);
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
        setPendingEmail(data.email);
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
    localStorage.removeItem(USER_STORAGE_KEY);
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
          bio: userData.bio ?? prev.bio, // Use ?? to preserve empty string
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
  
  console.log('[AuthContext] Auth state:', { isAuthenticated, isAdmin, userRole: user?.role, user: user?.email });

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
