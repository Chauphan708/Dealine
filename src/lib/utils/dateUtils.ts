// ============================================
// DeadlineGuard — Date Utility Functions
// ============================================

import {
  format,
  formatDistanceToNow,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  isBefore,
  isAfter,
  isToday as isTodayFns,
  startOfDay,
  endOfDay,
  parseISO,
  isValid,
  addDays,
} from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import type { Language } from '@/types';

// ============================================
// Relative time formatting
// ============================================

/**
 * Format a date relative to now, in the given locale.
 *
 * Examples:
 *   vi: "2 ngày nữa", "Hôm nay", "Quá hạn 3 ngày"
 *   en: "in 2 days", "Today", "3 days overdue"
 *
 * @param date  — ISO 8601 string or Date
 * @param lang  — target language (default 'vi')
 */
export function formatRelativeTime(
  date: string | Date,
  lang: Language = 'vi',
): string {
  const d = toDate(date);
  if (!d) return lang === 'vi' ? 'Ngày không hợp lệ' : 'Invalid date';

  const now = new Date();

  if (isTodayFns(d)) {
    return lang === 'vi' ? 'Hôm nay' : 'Today';
  }

  if (isBefore(d, now)) {
    // Overdue
    const days = differenceInDays(now, d);
    const hours = differenceInHours(now, d);

    if (days === 0) {
      return lang === 'vi'
        ? `Quá hạn ${hours} giờ`
        : `${hours} hours overdue`;
    }
    return lang === 'vi'
      ? `Quá hạn ${days} ngày`
      : `${days} days overdue`;
  }

  // Future
  const days = differenceInDays(d, now);
  const hours = differenceInHours(d, now);

  if (days === 0) {
    return lang === 'vi' ? `Còn ${hours} giờ` : `${hours} hours left`;
  }
  if (days === 1) {
    return lang === 'vi' ? 'Ngày mai' : 'Tomorrow';
  }
  return lang === 'vi' ? `Còn ${days} ngày` : `${days} days left`;
}

// ============================================
// Boolean checks
// ============================================

/**
 * Check if a date is overdue (in the past).
 */
export function isOverdue(date: string | Date): boolean {
  const d = toDate(date);
  if (!d) return false;
  return isBefore(d, new Date());
}

/**
 * Check if a deadline is due today.
 */
export function isDueToday(date: string | Date): boolean {
  const d = toDate(date);
  if (!d) return false;
  return isTodayFns(d);
}

/**
 * Check if a deadline is due soon (within thresholdHours).
 */
export function isDueSoon(
  date: string | Date,
  thresholdHours: number = 48,
): boolean {
  const d = toDate(date);
  if (!d) return false;
  const now = new Date();
  if (isBefore(d, now)) return false;
  return differenceInHours(d, now) <= thresholdHours;
}

// ============================================
// Urgency classification
// ============================================

export type UrgencyLevel = 'overdue' | 'today' | 'soon' | 'upcoming' | 'far';

/**
 * Classify the urgency level of a deadline date.
 *
 * - overdue:  past due
 * - today:    due today
 * - soon:     due within 48 hours
 * - upcoming: due within 7 days
 * - far:      due later than 7 days
 */
export function getUrgencyLevel(date: string | Date): UrgencyLevel {
  const d = toDate(date);
  if (!d) return 'far';

  const now = new Date();

  if (isBefore(d, startOfDay(now)) && !isTodayFns(d)) return 'overdue';
  if (isTodayFns(d)) return 'today';

  const hoursAway = differenceInHours(d, now);
  if (hoursAway <= 48) return 'soon';
  if (hoursAway <= 168) return 'upcoming'; // 7 days
  return 'far';
}

// ============================================
// Vietnamese date parsing
// ============================================

/**
 * Parse Vietnamese date strings.
 *
 * Supported formats:
 *   "ngày 15 tháng 6 năm 2026"
 *   "15/06/2026"
 *   "15-06-2026"
 *   "15 tháng 6, 2026"
 *   "ngày 15/6"
 *
 * @returns Parsed Date or null if unable to parse
 */
export function parseVietnameseDate(text: string): Date | null {
  if (!text || typeof text !== 'string') return null;

  const cleaned = text.trim().toLowerCase();

  // Pattern 1: "ngày DD tháng MM năm YYYY"
  const fullVn = cleaned.match(
    /ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})/,
  );
  if (fullVn) {
    const d = new Date(
      parseInt(fullVn[3]),
      parseInt(fullVn[2]) - 1,
      parseInt(fullVn[1]),
      17, 0, 0,
    );
    if (isValid(d)) return d;
  }

  // Pattern 2: "DD tháng MM năm YYYY" (without "ngày")
  const noNgay = cleaned.match(
    /(\d{1,2})\s*tháng\s*(\d{1,2})\s*[,.]?\s*năm\s*(\d{4})/,
  );
  if (noNgay) {
    const d = new Date(
      parseInt(noNgay[3]),
      parseInt(noNgay[2]) - 1,
      parseInt(noNgay[1]),
      17, 0, 0,
    );
    if (isValid(d)) return d;
  }

  // Pattern 3: "DD tháng MM" (no year — assume current/next year)
  const noYear = cleaned.match(
    /(?:ngày\s*)?(\d{1,2})\s*tháng\s*(\d{1,2})/,
  );
  if (noYear) {
    const now = new Date();
    let year = now.getFullYear();
    const d = new Date(year, parseInt(noYear[2]) - 1, parseInt(noYear[1]), 17, 0, 0);
    // If the date is in the past, assume next year
    if (isBefore(d, now)) {
      year += 1;
      const d2 = new Date(year, parseInt(noYear[2]) - 1, parseInt(noYear[1]), 17, 0, 0);
      if (isValid(d2)) return d2;
    }
    if (isValid(d)) return d;
  }

  // Pattern 4: "DD/MM/YYYY" or "DD-MM-YYYY"
  const slashDate = cleaned.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (slashDate) {
    const d = new Date(
      parseInt(slashDate[3]),
      parseInt(slashDate[2]) - 1,
      parseInt(slashDate[1]),
      17, 0, 0,
    );
    if (isValid(d)) return d;
  }

  // Pattern 5: "DD/MM" (no year)
  const shortSlash = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (shortSlash) {
    const now = new Date();
    let year = now.getFullYear();
    const d = new Date(year, parseInt(shortSlash[2]) - 1, parseInt(shortSlash[1]), 17, 0, 0);
    if (isBefore(d, now)) year += 1;
    const d2 = new Date(year, parseInt(shortSlash[2]) - 1, parseInt(shortSlash[1]), 17, 0, 0);
    if (isValid(d2)) return d2;
  }

  // Fallback: try native Date.parse
  try {
    const d = new Date(text);
    if (isValid(d)) return d;
  } catch {
    // ignore
  }

  return null;
}

// ============================================
// Formatting
// ============================================

/**
 * Format a date into a human-readable string.
 *
 * @param date   — ISO string or Date
 * @param lang   — target language
 * @param style  — 'full' | 'short' | 'time'
 */
export function formatDate(
  date: string | Date,
  lang: Language = 'vi',
  style: 'full' | 'short' | 'time' = 'full',
): string {
  const d = toDate(date);
  if (!d) return '';

  const locale = lang === 'vi' ? vi : enUS;
  const formats: Record<typeof style, string> = {
    full: lang === 'vi' ? "dd 'tháng' MM, yyyy - HH:mm" : 'MMM dd, yyyy - HH:mm',
    short: lang === 'vi' ? 'dd/MM/yyyy' : 'MM/dd/yyyy',
    time: 'HH:mm',
  };

  return format(d, formats[style], { locale });
}

/**
 * Get a time-aware greeting.
 *
 * @param lang — target language
 */
export function getGreeting(lang: Language = 'vi'): string {
  const hour = new Date().getHours();

  if (lang === 'vi') {
    if (hour < 12) return 'Chào buổi sáng! ☀️';
    if (hour < 18) return 'Chào buổi chiều! 🌤️';
    return 'Chào buổi tối! 🌙';
  }

  if (hour < 12) return 'Good morning! ☀️';
  if (hour < 18) return 'Good afternoon! 🌤️';
  return 'Good evening! 🌙';
}

// ============================================
// Internal helpers
// ============================================

/**
 * Safely convert string | Date to Date, returning null on failure.
 */
function toDate(input: string | Date): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isValid(input) ? input : null;
  try {
    const d = parseISO(input);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}
