'use client';

// ============================================
// DeadlineGuard — Notification Manager
// ============================================
//
// Handles browser push notification permissions,
// display, actions, and sound playback.
// ============================================

import type { Deadline, NotificationPayload } from '@/types';

/** Check if the Notification API is available (browser + HTTPS) */
export function isNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window
  );
}

/** Get current notification permission state */
export function getPermissionState(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Request notification permission from the user.
 * @returns The resulting permission state
 */
export async function requestPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    // Older browsers use callback-based API
    return new Promise((resolve) => {
      Notification.requestPermission((perm) => resolve(perm));
    });
  }
}

/**
 * Show a browser notification with optional actions.
 *
 * @param payload — the notification payload
 * @param onClick — callback when user clicks the notification
 * @returns The Notification instance, or null if not possible
 */
export function showNotification(
  payload: NotificationPayload,
  onClick?: (action: 'view' | 'complete' | 'snooze') => void,
): Notification | null {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    const notification = new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon ?? '/icons/icon-192.png',
      badge: payload.badge ?? '/icons/icon-64.png',
      tag: payload.tag,
      data: payload.data,
      requireInteraction: true,
      silent: false,
    });

    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      notification.close();
      onClick?.(payload.data?.action ?? 'view');
    };

    // Auto-close after 30 seconds
    setTimeout(() => {
      try { notification.close(); } catch { /* already closed */ }
    }, 30_000);

    return notification;
  } catch (err) {
    console.error('[notificationManager] Failed to show notification:', err);
    return null;
  }
}

/**
 * Build a notification payload for a deadline reminder.
 */
export function buildDeadlineNotification(
  deadline: Deadline,
  urgency: 'approaching' | 'today' | 'overdue',
  customMessage?: string,
): NotificationPayload {
  const titles: Record<typeof urgency, string> = {
    approaching: '⏰ Deadline sắp đến!',
    today: '🔴 Deadline hôm nay!',
    overdue: '🚨 Deadline đã quá hạn!',
  };

  const body =
    customMessage ??
    `${deadline.title}\n${deadline.description}`.slice(0, 200);

  return {
    title: titles[urgency],
    body,
    tag: `deadline-${deadline.id}`,
    data: {
      deadlineId: deadline.id,
      action: 'view',
      url: `/deadline/${deadline.id}`,
    },
  };
}

/**
 * Play a notification sound.
 * Uses the Web Audio API with a simple beep tone.
 */
export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as Record<string, typeof AudioContext>).webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Pleasant two-tone chime
    oscillator.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.15); // G5

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);

    // Clean up
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1000);
  } catch {
    // Audio not available — silent fail
  }
}

/**
 * Schedule a one-shot in-app notification using setTimeout.
 *
 * @param delayMs — milliseconds until notification fires
 * @param payload — notification payload
 * @param soundEnabled — whether to play a sound
 * @returns A cancel function
 */
export function scheduleInAppNotification(
  delayMs: number,
  payload: NotificationPayload,
  soundEnabled: boolean = true,
): () => void {
  const timerId = window.setTimeout(() => {
    showNotification(payload);
    if (soundEnabled) playNotificationSound();
  }, delayMs);

  return () => window.clearTimeout(timerId);
}
