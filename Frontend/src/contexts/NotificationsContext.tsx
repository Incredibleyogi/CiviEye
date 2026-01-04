import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { notificationsApi } from '@/lib/api';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type?: 'like' | 'comment' | 'status_update' | 'admin_response' | 'nearby_post';
  data?: {
    postId?: string;
  };
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const normalizeNotification = (n: any): Notification => ({
  id: n._id || n.id,
  title: n.title,
  message: n.message,
  read: n.read || false,
  createdAt: n.createdAt,
  type: n.type || 'nearby_post',  // ADD THIS - default to nearby_post
  data: n.data,
});


export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket, isConnected } = useSocket();
  const { isAuthenticated } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await notificationsApi.getAll();
      if (res.success && res.data) {
        const notifs = Array.isArray(res.data) ? res.data : (res.data as any).notifications || [];
        setNotifications(notifs.map(normalizeNotification));
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch notifications on mount and when auth changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Listen for real-time notifications via socket
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewNotification = (notification: any) => {
      console.log('New notification received:', notification);
      setNotifications(prev => [normalizeNotification(notification), ...prev]);
    };

    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [socket, isConnected]);

  const markAsRead = useCallback(async (id: string) => {
    const res = await notificationsApi.markRead(id);
    if (res.success) {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    const res = await notificationsApi.markMultipleRead(unreadIds);
    if (res.success) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  }, [notifications]);

  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
}
