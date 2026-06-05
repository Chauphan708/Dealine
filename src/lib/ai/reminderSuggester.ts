// ============================================
// DeadlineGuard — Smart Reminder Suggester
// ============================================

import {
  subDays,
  subHours,
  isBefore,
  isAfter,
  setHours,
  setMinutes,
  getHours,
  addDays,
} from 'date-fns';
import type { Deadline, Reminder, Priority } from '@/types';
import { generateId } from '@/lib/utils/helpers';

/**
 * Reminder offsets by priority level.
 * Each entry is the number of hours before the deadline.
 */
const REMINDER_OFFSETS: Record<Priority, number[]> = {
  critical: [168, 72, 24, 12, 3, 1], // 7d, 3d, 1d, 12h, 3h, 1h
  high: [120, 48, 24, 6], // 5d, 2d, 1d, 6h
  medium: [72, 24, 3], // 3d, 1d, 3h
  low: [24, 3], // 1d, 3h
};

/** Default quiet hours: 22:00 – 07:00 */
const DEFAULT_QUIET_START = 22;
const DEFAULT_QUIET_END = 7;

interface QuietHours {
  start: number; // hour 0-23
  end: number; // hour 0-23
}

/**
 * Suggest optimal reminder times for a deadline.
 *
 * Rules:
 * 1. Use priority-based offsets (more critical = more reminders)
 * 2. Skip reminders that would fall in the past
 * 3. Respect quiet hours (shift to boundary)
 * 4. Return properly typed Reminder objects
 *
 * @param deadline      — the deadline to create reminders for
 * @param quietHoursStart — "HH:mm" string (default "22:00")
 * @param quietHoursEnd   — "HH:mm" string (default "07:00")
 */
export function suggestReminders(
  deadline: Deadline,
  quietHoursStart: string = '22:00',
  quietHoursEnd: string = '07:00',
): Reminder[] {
  const deadlineDate = new Date(deadline.deadlineDate);
  if (isNaN(deadlineDate.getTime())) return [];

  const now = new Date();
  const quietHours = parseQuietHours(quietHoursStart, quietHoursEnd);
  const offsets = REMINDER_OFFSETS[deadline.priority] || REMINDER_OFFSETS.medium;

  const reminders: Reminder[] = [];

  for (const hoursBeforeDeadline of offsets) {
    let reminderTime: Date;

    if (hoursBeforeDeadline >= 24) {
      // For day-level offsets, use subDays for clarity
      const days = Math.floor(hoursBeforeDeadline / 24);
      const remainingHours = hoursBeforeDeadline % 24;
      reminderTime = subHours(subDays(deadlineDate, days), remainingHours);
    } else {
      reminderTime = subHours(deadlineDate, hoursBeforeDeadline);
    }

    // Skip reminders in the past (with 1 minute grace)
    if (isBefore(reminderTime, new Date(now.getTime() - 60_000))) {
      continue;
    }

    // Adjust for quiet hours
    reminderTime = adjustForQuietHours(reminderTime, quietHours);

    // Don't create a reminder after the deadline itself
    if (isAfter(reminderTime, deadlineDate)) {
      continue;
    }

    reminders.push({
      id: generateId(),
      deadlineId: deadline.id,
      scheduledAt: reminderTime.toISOString(),
      type: 'push',
      sent: false,
      message: buildReminderMessage(deadline, hoursBeforeDeadline),
    });
  }

  return reminders;
}

/**
 * Suggest reminders for multiple deadlines at once.
 */
export function suggestRemindersForAll(
  deadlines: Deadline[],
  quietHoursStart?: string,
  quietHoursEnd?: string,
): Reminder[] {
  return deadlines.flatMap((d) =>
    suggestReminders(d, quietHoursStart, quietHoursEnd),
  );
}

// ---- Internal helpers ----

function parseQuietHours(start: string, end: string): QuietHours {
  const [sh] = start.split(':').map(Number);
  const [eh] = end.split(':').map(Number);
  return {
    start: isNaN(sh) ? DEFAULT_QUIET_START : sh,
    end: isNaN(eh) ? DEFAULT_QUIET_END : eh,
  };
}

/**
 * If the reminder falls during quiet hours,
 * shift it to the end of the quiet period (e.g. 07:00 next morning).
 */
function adjustForQuietHours(time: Date, quiet: QuietHours): Date {
  const hour = getHours(time);

  const isInQuiet =
    quiet.start > quiet.end
      ? // Overnight quiet (e.g. 22:00 – 07:00): in quiet if >= start OR < end
        hour >= quiet.start || hour < quiet.end
      : // Same-day quiet (e.g. 13:00 – 14:00): in quiet if >= start AND < end
        hour >= quiet.start && hour < quiet.end;

  if (!isInQuiet) return time;

  // Shift to end of quiet hours
  let adjusted = setMinutes(setHours(time, quiet.end), 0);

  // If shifting backwards (e.g. quiet starts at 22, reminder at 23, end at 07)
  // we need to move to the next day's 07:00
  if (quiet.start > quiet.end && hour >= quiet.start) {
    adjusted = addDays(adjusted, 1);
  }

  return adjusted;
}

/**
 * Build a human-readable reminder message.
 */
function buildReminderMessage(
  deadline: Deadline,
  hoursBefore: number,
): string {
  const timeLabel = formatHoursLabel(hoursBefore);
  return `⏰ "${deadline.title}" — còn ${timeLabel}`;
}

function formatHoursLabel(hours: number): string {
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const rem = hours % 24;
    if (rem === 0) return `${days} ngày`;
    return `${days} ngày ${rem} giờ`;
  }
  return `${hours} giờ`;
}
