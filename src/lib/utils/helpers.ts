// ============================================
// DeadlineGuard — General Helper Functions
// ============================================

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique ID using UUID v4.
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Truncate text to a maximum length, appending "…" if truncated.
 *
 * @param text      — the text to truncate
 * @param maxLength — max character count (default 100)
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + '…';
}

/**
 * Format a byte count into a human-readable file size.
 *
 * @example formatFileSize(1536) // "1.5 KB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const index = Math.min(i, units.length - 1);
  const value = bytes / Math.pow(1024, index);

  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[index]}`;
}

/**
 * Get a descriptive icon name for a given MIME type / extension.
 * Returns a lucide-react icon name string.
 */
export function getFileIcon(
  mimeTypeOrExtension: string,
): string {
  const lower = mimeTypeOrExtension.toLowerCase();

  // By extension
  if (lower.endsWith('.pdf') || lower.includes('pdf'))
    return 'file-text';
  if (lower.endsWith('.docx') || lower.endsWith('.doc') || lower.includes('wordprocessing'))
    return 'file-text';
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.includes('spreadsheet'))
    return 'file-spreadsheet';
  if (lower.endsWith('.csv'))
    return 'file-spreadsheet';
  if (lower.endsWith('.txt') || lower.includes('text/plain'))
    return 'file';
  if (lower.includes('image'))
    return 'image';

  return 'file';
}

/**
 * Create a debounced version of a function.
 *
 * @param fn    — the function to debounce
 * @param delay — debounce delay in milliseconds
 * @returns A debounced function with a `.cancel()` method
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): T & { cancel: () => void } {
  let timerId: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: unknown[]) => {
    if (timerId !== null) clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn(...args);
      timerId = null;
    }, delay);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  return debounced;
}

/**
 * Sleep for the specified number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Conditionally join class names together (like `clsx`).
 *
 * @example classNames('btn', isActive && 'btn-active', size === 'lg' && 'btn-lg')
 */
export function classNames(
  ...args: (string | boolean | null | undefined)[]
): string {
  return args.filter(Boolean).join(' ');
}

/**
 * Create a color CSS class string based on priority level.
 */
export function priorityColor(
  priority: 'critical' | 'high' | 'medium' | 'low',
): string {
  const colors: Record<string, string> = {
    critical: 'text-red-500',
    high: 'text-orange-500',
    medium: 'text-yellow-500',
    low: 'text-blue-400',
  };
  return colors[priority] ?? 'text-gray-400';
}

/**
 * Safely parse JSON with a fallback value.
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Pick specific keys from an object.
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}
