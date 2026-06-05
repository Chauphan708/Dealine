'use client';

// ============================================
// DeadlineGuard — IndexedDB Storage Layer
// ============================================

import Dexie, { type Table } from 'dexie';
import type {
  Deadline,
  Reminder,
  UserSettings,
  AppStats,
} from '@/types';

// ---- Additional DB record types ----

/** A stored document analysis record */
export interface DocumentRecord {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  rawText: string;
  documentSummary: string;
  documentType: string;
  deadlineIds: string[];
  analyzedAt: string;
  processingTime: number;
}

/** Key-value settings entry */
export interface SettingEntry {
  key: string;
  value: string; // JSON-serialised
}

/** Sync log for Google Drive integration */
export interface SyncLogEntry {
  id: string;
  action: 'upload' | 'download' | 'delete' | 'watch';
  fileId: string;
  fileName: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  timestamp: string;
}

// ---- Database Class ----

/**
 * DeadlineGuardDB — local-first IndexedDB database.
 *
 * Tables:
 *  - deadlines — extracted & manual deadlines
 *  - documents — processed document history
 *  - reminders — scheduled reminder entries
 *  - settings  — key-value user settings
 *  - syncLog   — Google Drive sync log
 */
class DeadlineGuardDB extends Dexie {
  deadlines!: Table<Deadline>;
  documents!: Table<DocumentRecord>;
  reminders!: Table<Reminder>;
  settings!: Table<SettingEntry>;
  syncLog!: Table<SyncLogEntry>;

  constructor() {
    super('DeadlineGuardDB');

    this.version(1).stores({
      deadlines:
        'id, deadlineDate, priority, category, status, sourceFile, createdAt, updatedAt',
      documents: 'id, fileName, fileType, analyzedAt',
      reminders: 'id, deadlineId, scheduledAt, type, sent',
      settings: 'key',
      syncLog: 'id, fileId, status, timestamp',
    });
  }
}

/** Singleton DB instance (lazy — only created in browser) */
let _db: DeadlineGuardDB | null = null;

/**
 * Get the singleton database instance.
 * Returns `null` when called during SSR.
 */
export function getDB(): DeadlineGuardDB | null {
  if (typeof window === 'undefined') return null;
  if (!_db) {
    _db = new DeadlineGuardDB();
  }
  return _db;
}

// ============================================
// Deadline CRUD
// ============================================

/**
 * Add a new deadline to the database.
 * @returns The id of the inserted deadline.
 */
export async function addDeadline(deadline: Deadline): Promise<string> {
  const db = getDB();
  if (!db) throw new Error('Database not available (SSR)');
  await db.deadlines.put(deadline);
  return deadline.id;
}

/**
 * Add multiple deadlines in a single transaction.
 */
export async function addDeadlines(deadlines: Deadline[]): Promise<void> {
  const db = getDB();
  if (!db) throw new Error('Database not available (SSR)');
  await db.deadlines.bulkPut(deadlines);
}

/**
 * Update an existing deadline by id (partial update).
 */
export async function updateDeadline(
  id: string,
  changes: Partial<Deadline>,
): Promise<void> {
  const db = getDB();
  if (!db) throw new Error('Database not available (SSR)');
  await db.deadlines.update(id, {
    ...changes,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Delete a deadline and its associated reminders.
 */
export async function deleteDeadline(id: string): Promise<void> {
  const db = getDB();
  if (!db) throw new Error('Database not available (SSR)');
  await db.transaction('rw', db.deadlines, db.reminders, async () => {
    await db.deadlines.delete(id);
    await db.reminders.where('deadlineId').equals(id).delete();
  });
}

/**
 * Get a single deadline by id.
 */
export async function getDeadline(id: string): Promise<Deadline | undefined> {
  const db = getDB();
  if (!db) return undefined;
  return db.deadlines.get(id);
}

/**
 * Get all deadlines, optionally filtered by status.
 */
export async function getAllDeadlines(
  status?: Deadline['status'],
): Promise<Deadline[]> {
  const db = getDB();
  if (!db) return [];
  if (status) {
    return db.deadlines.where('status').equals(status).toArray();
  }
  return db.deadlines.toArray();
}

// ============================================
// Query helpers
// ============================================

/**
 * Get upcoming deadlines (due in the future, not completed).
 * @param days — look-ahead window in days (default 7)
 */
export async function getUpcoming(days: number = 7): Promise<Deadline[]> {
  const db = getDB();
  if (!db) return [];
  const now = new Date().toISOString();
  const future = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000,
  ).toISOString();

  return db.deadlines
    .where('deadlineDate')
    .between(now, future, true, true)
    .and((d) => d.status === 'pending' || d.status === 'snoozed')
    .toArray();
}

/**
 * Get overdue deadlines (past due and not completed).
 */
export async function getOverdue(): Promise<Deadline[]> {
  const db = getDB();
  if (!db) return [];
  const now = new Date().toISOString();

  return db.deadlines
    .where('deadlineDate')
    .below(now)
    .and((d) => d.status === 'pending' || d.status === 'snoozed')
    .toArray();
}

/**
 * Get deadlines within a date range.
 */
export async function getByDateRange(
  start: string | Date,
  end: string | Date,
): Promise<Deadline[]> {
  const db = getDB();
  if (!db) return [];
  const s = typeof start === 'string' ? start : start.toISOString();
  const e = typeof end === 'string' ? end : end.toISOString();
  return db.deadlines
    .where('deadlineDate')
    .between(s, e, true, true)
    .toArray();
}

/**
 * Compute aggregate statistics.
 */
export async function getStats(): Promise<AppStats> {
  const db = getDB();
  if (!db) {
    return {
      totalDeadlines: 0,
      completedOnTime: 0,
      overdue: 0,
      upcoming: 0,
      documentsProcessed: 0,
      completionRate: 0,
    };
  }

  const all = await db.deadlines.toArray();
  const now = new Date().toISOString();

  const totalDeadlines = all.length;
  const completedOnTime = all.filter(
    (d) => d.status === 'completed',
  ).length;
  const overdue = all.filter(
    (d) =>
      d.deadlineDate < now &&
      (d.status === 'pending' || d.status === 'snoozed'),
  ).length;
  const upcoming = all.filter(
    (d) =>
      d.deadlineDate >= now &&
      (d.status === 'pending' || d.status === 'snoozed'),
  ).length;
  const documentsProcessed = await db.documents.count();
  const completionRate =
    totalDeadlines > 0 ? completedOnTime / totalDeadlines : 0;

  return {
    totalDeadlines,
    completedOnTime,
    overdue,
    upcoming,
    documentsProcessed,
    completionRate,
  };
}

// ============================================
// Reminder CRUD
// ============================================

/** Save reminders for a deadline (replaces existing). */
export async function saveReminders(reminders: Reminder[]): Promise<void> {
  const db = getDB();
  if (!db) return;
  await db.reminders.bulkPut(reminders);
}

/** Get unsent reminders due before the given time. */
export async function getDueReminders(
  before?: string,
): Promise<Reminder[]> {
  const db = getDB();
  if (!db) return [];
  const cutoff = before ?? new Date().toISOString();
  return db.reminders
    .where('scheduledAt')
    .belowOrEqual(cutoff)
    .and((r) => !r.sent)
    .toArray();
}

/** Mark a reminder as sent. */
export async function markReminderSent(id: string): Promise<void> {
  const db = getDB();
  if (!db) return;
  await db.reminders.update(id, { sent: true });
}

/** Delete all reminders for a deadline. */
export async function deleteRemindersForDeadline(
  deadlineId: string,
): Promise<void> {
  const db = getDB();
  if (!db) return;
  await db.reminders.where('deadlineId').equals(deadlineId).delete();
}

// ============================================
// Document CRUD
// ============================================

/** Save a document analysis record. */
export async function addDocument(doc: DocumentRecord): Promise<void> {
  const db = getDB();
  if (!db) return;
  await db.documents.put(doc);
}

/** Get all stored document records. */
export async function getAllDocuments(): Promise<DocumentRecord[]> {
  const db = getDB();
  if (!db) return [];
  return db.documents.orderBy('analyzedAt').reverse().toArray();
}

/** Delete a document record. */
export async function deleteDocument(id: string): Promise<void> {
  const db = getDB();
  if (!db) return;
  await db.documents.delete(id);
}

// ============================================
// Settings persistence
// ============================================

const DEFAULT_SETTINGS: UserSettings = {
  language: 'vi',
  theme: 'dark',
  geminiApiKey: '',
  defaultReminderTimes: [168, 72, 24, 3], // hours
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  notificationsEnabled: true,
  soundEnabled: true,
  googleDriveConnected: false,
  googleDriveFolderId: '',
  syncInterval: 30,
};

/**
 * Load user settings from the database,
 * falling back to defaults for missing keys.
 */
export async function loadSettings(): Promise<UserSettings> {
  const db = getDB();
  if (!db) return { ...DEFAULT_SETTINGS };

  const entries = await db.settings.toArray();
  const stored: Record<string, unknown> = {};
  for (const entry of entries) {
    try {
      stored[entry.key] = JSON.parse(entry.value);
    } catch {
      stored[entry.key] = entry.value;
    }
  }

  return { ...DEFAULT_SETTINGS, ...stored } as UserSettings;
}

/**
 * Persist user settings (partial update supported).
 */
export async function saveSettings(
  settings: Partial<UserSettings>,
): Promise<void> {
  const db = getDB();
  if (!db) return;

  const entries: SettingEntry[] = Object.entries(settings).map(
    ([key, value]) => ({
      key,
      value: JSON.stringify(value),
    }),
  );

  await db.settings.bulkPut(entries);
}

// ============================================
// Sync log
// ============================================

/** Append a sync log entry. */
export async function addSyncLog(entry: SyncLogEntry): Promise<void> {
  const db = getDB();
  if (!db) return;
  await db.syncLog.put(entry);
}

/** Get recent sync log entries. */
export async function getSyncLogs(limit: number = 50): Promise<SyncLogEntry[]> {
  const db = getDB();
  if (!db) return [];
  return db.syncLog.orderBy('timestamp').reverse().limit(limit).toArray();
}

/** Clear old sync logs (keep last N). */
export async function pruneSyncLogs(keep: number = 100): Promise<void> {
  const db = getDB();
  if (!db) return;
  const total = await db.syncLog.count();
  if (total <= keep) return;
  const toDelete = await db.syncLog
    .orderBy('timestamp')
    .limit(total - keep)
    .primaryKeys();
  await db.syncLog.bulkDelete(toDelete);
}

export { DeadlineGuardDB, DEFAULT_SETTINGS };
