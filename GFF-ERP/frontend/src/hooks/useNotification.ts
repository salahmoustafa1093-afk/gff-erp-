import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  clearNotifications,
  type Notification,
} from '@/app/slices/appSlice';
import { apiService } from '@/app/api';

export interface NotificationOptions {
  title: string;
  message: string;
  type?: Notification['type'];
  link?: string;
  duration?: number;
}

export function useNotification() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.app.notifications);
  const unreadCount = useAppSelector((state) => state.app.unreadNotifications);

  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval>>();

  // Show a toast notification and add to notification list
  const showNotification = useCallback(
    (options: NotificationOptions) => {
      const { title, message, type = 'info', link } = options;

      dispatch(
        addNotification({
          title,
          message,
          type,
          link,
          read: false,
        })
      );

      return { id: `notif_${Date.now()}` };
    },
    [dispatch]
  );

  // Mark a single notification as read
  const markAsRead = useCallback(
    (id: string) => {
      dispatch(markNotificationRead(id));
    },
    [dispatch]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    dispatch(markAllNotificationsRead());
  }, [dispatch]);

  // Delete a notification
  const deleteNotification = useCallback(
    (id: string) => {
      dispatch(removeNotification(id));
    },
    [dispatch]
  );

  // Clear all notifications
  const clearAll = useCallback(() => {
    dispatch(clearNotifications());
  }, [dispatch]);

  // Start polling for new notifications
  const startPolling = useCallback(
    (intervalMs: number = 30000) => {
      if (isPolling) return;

      setIsPolling(true);
      pollingRef.current = setInterval(async () => {
        try {
          const data = await apiService.get<Notification[]>('/notifications/unread');
          data.forEach((notif) => {
            if (!notifications.find((n) => n.id === notif.id)) {
              dispatch(addNotification(notif));
            }
          });
        } catch {
          // Silently fail - don't show error for background polling
        }
      }, intervalMs);
    },
    [isPolling, notifications, dispatch]
  );

  // Stop polling
  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = undefined;
    }
  }, []);

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    try {
      const data = await apiService.get<{ notifications: Notification[]; unreadCount: number }>(
        '/notifications'
      );
      data.notifications.forEach((notif) => {
        dispatch(addNotification(notif));
      });
      return data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return { notifications: [], unreadCount: 0 };
    }
  }, [dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Convenience methods
  const success = useCallback(
    (title: string, message?: string) => {
      showNotification({ title, message: message || title, type: 'success' });
    },
    [showNotification]
  );

  const error = useCallback(
    (title: string, message?: string) => {
      showNotification({ title, message: message || title, type: 'error' });
    },
    [showNotification]
  );

  const warning = useCallback(
    (title: string, message?: string) => {
      showNotification({ title, message: message || title, type: 'warning' });
    },
    [showNotification]
  );

  const info = useCallback(
    (title: string, message?: string) => {
      showNotification({ title, message: message || title, type: 'info' });
    },
    [showNotification]
  );

  return {
    // State
    notifications,
    unreadCount,
    isPolling,

    // Actions
    showNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    startPolling,
    stopPolling,
    fetchNotifications,

    // Convenience methods
    success,
    error,
    warning,
    info,
  };
}

export default useNotification;