'use client';

// ============================================
// DeadlineGuard — useNotifications Custom Hook
// ============================================

import { useState, useEffect, useCallback } from 'react';
import {
  getPermissionState,
  requestPermission as requestBrowserPermission,
  showNotification,
  isNotificationSupported,
} from '@/lib/notifications/notificationManager';
import { startScheduler, stopScheduler } from '@/lib/notifications/scheduler';

/**
 * Hook for managing notification permissions, playing sounds,
 * sending test notifications, and orchestrating the background scheduler.
 */
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  // Sync state and start the background scheduler on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setPermission(getPermissionState());

    // Start background check loop for reminders
    startScheduler();

    return () => {
      // Clean up scheduler when the hook/app unmounts
      stopScheduler();
    };
  }, []);

  /**
   * Request user permission for push notifications
   */
  const requestPermission = useCallback(async () => {
    const result = await requestBrowserPermission();
    setPermission(result);
    return result;
  }, []);

  /**
   * Trigger a test push notification instantly
   */
  const sendTestNotification = useCallback((title: string = 'DeadlineGuard Test', body: string = 'Đây là thông báo kiểm thử từ Trợ lý nhắc việc!') => {
    if (!isNotificationSupported()) {
      alert('Trình duyệt của bạn không hỗ trợ thông báo.');
      return false;
    }

    if (permission !== 'granted') {
      alert('Vui lòng cấp quyền thông báo trước khi gửi thử.');
      return false;
    }

    showNotification({
      title,
      body,
      tag: 'test-notification',
      data: {
        deadlineId: 'test',
        action: 'view',
        url: '/',
      },
    });

    return true;
  }, [permission]);

  return {
    permission,
    isSupported: isNotificationSupported(),
    requestPermission,
    sendTestNotification,
  };
}
