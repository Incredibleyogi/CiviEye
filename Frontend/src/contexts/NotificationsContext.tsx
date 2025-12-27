import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Notification } from '@/types';
import { notificationsApi, API_ORIGIN } from '@/lib/api';
import { useAuth } from './AuthContext';
import { io, Socket } from 'socket.io-client';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { isAuthenticated, user } = useAuth();

  const unreadCount = notifications.filter(n => !n.read).length;

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsApi.getAll();

      if (response.success && response.data) {
        const notifData = (response.data as { notifications?: Notification[] }).notifications || response.data;
        if (Array.isArray(notifData)) {
          const transformedNotifs = notifData.map((n: any) => ({
            id: n._id || n.id,
            type: n.type || 'status_update',
            message: n.message,
            postId: n.postId || n.post?._id,
            fromUser: n.fromUser ? {
              id: n.fromUser._id || n.fromUser.id,
              name: n.fromUser.name,
              avatar: n.fromUser.avatar
            } : undefined,
            createdAt: n.createdAt,
            read: n.read || false
          }));
          setNotifications(transformedNotifs);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const newSocket = io(API_ORIGIN, {
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        // Backend expects "register" with userId
        newSocket.emit('register', user.id);
      });

      newSocket.on('new_post', (data: any) => {
        addNotification({
          type: 'nearby_post',
          message: `New civic issue reported: ${data.title || 'New post'}`,
          postId: data._id || data.id,
          fromUser: data.user ? {
            id: data.user._id || data.user.id,
            name: data.user.name,
            avatar: data.user.avatar
          } : undefined
        });
      });

      newSocket.on('notification', (data: any) => {
        const notification: Omit<Notification, 'id' | 'createdAt' | 'read'> = {
          type: data.type || 'status_update',
          message: data.message,
          postId: data.postId,
          fromUser: data.fromUser,
        };
        addNotification(notification);
      });

      newSocket.on('post_status_update', (data: any) => {
        addNotification({
          type: 'status_update',
          message: `Your post status has been updated to: ${data.status}`,
          postId: data.postId,
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }

    // If user logs out, ensure socket is closed
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [isAuthenticated, user?.id]);

  // Fetch notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = async (id: string): Promise<boolean> => {
    try {
      // Backend expects { ids: [...] } array format
      const response = await notificationsApi.markRead(id);

      if (response.success) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Update locally even if API fails
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      return false;
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length > 0) {
        await notificationsApi.markMultipleRead(unreadIds);
      }
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        refreshNotifications
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}

