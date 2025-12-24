import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { authApi, passwordApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (otp: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: () => Promise<{ success: boolean; error?: string }>;
  googleLogin: (token: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  updateProfile: (updates: { name?: string; bio?: string; avatar?: string }) => Promise<boolean>;
  isAdmin: boolean;
  pendingEmail: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('civiceye_token');
    const storedUser = localStorage.getItem('civiceye_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authApi.login({ email, password });
      
      if (response.success && response.data) {
        const { token: authToken, user: userData } = response.data as { token: string; user: User };
        setToken(authToken);
        setUser(userData);
        localStorage.setItem('civiceye_token', authToken);
        localStorage.setItem('civiceye_user', JSON.stringify(userData));
        return { success: true };
      }
      
      return { success: false, error: response.error || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const signup = async (name: string, email: string, password: string, confirmPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get user location for nearby notifications
      let lat: number | undefined;
      let lng: number | undefined;
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch {
          console.log('Location not available');
        }
      }

      const response = await authApi.signup({ name, email, password, confirmPassword, lat, lng });
      
      if (response.success) {
        setPendingEmail(email);
        return { success: true };
      }
      
      return { success: false, error: response.error || 'Signup failed' };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const verifyOtp = async (otp: string): Promise<{ success: boolean; error?: string }> => {
    if (!pendingEmail) {
      return { success: false, error: 'No pending verification' };
    }

    try {
      const response = await authApi.verifyOtp({ email: pendingEmail, otp });
      
      if (response.success) {
        setPendingEmail(null);
        return { success: true };
      }
      
      return { success: false, error: response.error || 'Invalid OTP' };
    } catch (error) {
      console.error('OTP verification error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const resendOtp = async (): Promise<{ success: boolean; error?: string }> => {
    if (!pendingEmail) {
      return { success: false, error: 'No pending verification' };
    }

    try {
      const response = await authApi.resendOtp({ email: pendingEmail });
      
      if (response.success) {
        return { success: true };
      }
      
      return { success: false, error: response.error || 'Failed to resend OTP' };
    } catch (error) {
      console.error('Resend OTP error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const googleLogin = async (token: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authApi.googleLogin({ token });
      
      if (response.success && response.data) {
        const { token: authToken, user: userData } = response.data;
        const userObj: User = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          avatar: userData.profilePic,
          role: 'user' as UserRole,
        };
        setToken(authToken);
        setUser(userObj);
        localStorage.setItem('civiceye_token', authToken);
        localStorage.setItem('civiceye_user', JSON.stringify(userObj));
        return { success: true };
      }
      
      return { success: false, error: response.error || 'Google login failed' };
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('civiceye_token');
    localStorage.removeItem('civiceye_user');
  };

  const updatePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const response = await passwordApi.changePassword({ 
        currentPassword: oldPassword, 
        newPassword 
      });
      return response.success;
    } catch (error) {
      console.error('Change password error:', error);
      return false;
    }
  };

  const updateProfile = async (updates: { name?: string; bio?: string; avatar?: string }): Promise<boolean> => {
    // TODO: Implement profile update API endpoint when backend supports it
    // For now, update locally
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('civiceye_user', JSON.stringify(updatedUser));
      return true;
    }
    return false;
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        signup,
        verifyOtp,
        resendOtp,
        googleLogin,
        logout,
        updatePassword,
        updateProfile,
        isAdmin,
        pendingEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
