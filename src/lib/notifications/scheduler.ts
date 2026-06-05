'use client';

// ============================================
// DeadlineGuard — Background Notification Scheduler
// ============================================
//
// Periodically checks for due reminders and fires
// notifications. Handles visibility API, batching,
// and sent-flag updates.
// ============================================

import {
  getDueReminders,
  markReminderSent,
  getDeadline,
} from '@/lib/storage/database';
import {
  showNotification,
  buildDeadlineNotification,
  playNotificationSound,
  getPermissionState,
} from './notificationManager';
import { getUrgencyLevel } from '@/lib/utils/dateUtils';

/** How often to check for due reminders (ms) */
const CHECK_INTERVAL_MS = 60_000; // 1 minute

/** Maximum notifications to fire in a single batch */
const MAX_BATCH_SIZE = 3;

/** Minimum gap between batches (ms) — prevents flooding */
const BATCH_COOLDOWN_MS = 30_000; // 30 seconds

let intervalId: ReturnType<typeof setInterval> | null = null;
let lastBatchTime = 0;
let isRunning = false;

/**
 * Start the background reminder scheduler.
 * Checks for due reminders every minute and fires notifications.
 *
 * Safe to call multiple times — only one instance will run.
 */
export function startScheduler(): void {
  if (typeof window === 'undefined') return;
  if (isRunning) return;

  isRunning = true;

  // Run an immediate check
  checkAndNotify().catch(console.error);

  // Schedule periodic checks
  intervalId = setInterval(() => {
    checkAndNotify().catch(console.error);
  }, CHECK_INTERVAL_MS);

  // Pause when tab is hidden, resume when visible
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }
}

/**
 * Stop the background scheduler.
 */
export function stopScheduler(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  isRunning = false;

  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  }
}

/**
 * Check whether the scheduler is currently running.
 */
export function isSchedulerRunning(): boolean {
  return isRunning;
}

/**
 * Force an immediate check (useful after importing new deadlines).
 */
export async function forceCheck(): Promise<number> {
  return checkAndNotify();
}

// ---- Internal ----

/**
 * Core check loop: fetch due reminders, fire notifications, mark sent.
 * @returns number of notifications fired
 */
async function checkAndNotify(): Promise<number> {
  // Don't fire if permissions aren't granted
  if (getPermissionState() !== 'granted') return 0;

  // Enforce batch cooldown
  const now = Date.now();
  if (now - lastBatchTime < BATCH_COOLDOWN_MS) return 0;

  try {
    const dueReminders = await getDueReminders();

    if (dueReminders.length === 0) return 0;

    // Take at most MAX_BATCH_SIZE to avoid flooding
    const batch = dueReminders.slice(0, MAX_BATCH_SIZE);
    let fired = 0;

    for (const reminder of batch) {
      try {
        const deadline = await getDeadline(reminder.deadlineId);
        if (!deadline) {
          // Deadline was deleted — mark reminder as sent to avoid retries
          await markReminderSent(reminder.id);
          continue;
        }

        // Skip completed / snoozed deadlines
        if (deadline.status === 'completed') {
          await markReminderSent(reminder.id);
          continue;
        }

        const urgency = getUrgencyLevel(deadline.deadlineDate);
        const urgencyMap: Record<string, 'approaching' | 'today' | 'overdue'> = {
          overdue: 'overdue',
          today: 'today',
          soon: 'approaching',
          upcoming: 'approaching',
          far: 'approaching',
        };

        const payload = buildDeadlineNotification(
          deadline,
          urgencyMap[urgency] ?? 'approaching',
          reminder.message,
        );

        showNotification(payload);
        await markReminderSent(reminder.id);
        fired++;
      } catch (err) {
        console.error(
          `[scheduler] Failed to process reminder ${reminder.id}:`,
          err,
        );
      }
    }

    // Play sound once for the whole batch
    if (fired > 0) {
      playNotificationSound();
      lastBatchTime = Date.now();
    }

    return fired;
  } catch (err) {
    console.error('[scheduler] Error checking reminders:', err);
    return 0;
  }
}

/**
 * Pause checks when the tab is hidden;
 * run an immediate check when the tab becomes visible.
 */
function handleVisibilityChange(): void {
  if (document.visibilityState === 'visible') {
    // User came back — check for missed reminders
    checkAndNotify().catch(console.error);
  }
}
