// ============================================
// DeadlineGuard — Core Type Definitions
// ============================================

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type DeadlineStatus = 'pending' | 'completed' | 'overdue' | 'snoozed';
export type ReminderType = 'push' | 'in-app';
export type Language = 'vi' | 'en';
export type ThemeMode = 'dark' | 'light';
export type ViewMode = 'list' | 'calendar' | 'timeline';

export interface Deadline {
  id: string;
  title: string;
  description: string;
  deadlineDate: string; // ISO 8601
  priority: Priority;
  category: string;
  sourceText: string;
  sourceFile: string;
  confidence: number; // 0-1
  status: DeadlineStatus;
  reminders: Reminder[];
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  deadlineId: string;
  scheduledAt: string; // ISO 8601
  type: ReminderType;
  sent: boolean;
  message: string;
}

export interface DocumentAnalysis {
  id: string;
  deadlines: Omit<Deadline, 'id' | 'status' | 'reminders' | 'tags' | 'notes' | 'createdAt' | 'updatedAt'>[];
  documentSummary: string;
  documentType: string;
  rawText: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  analyzedAt: string;
  processingTime: number; // ms
}

export interface GeminiDeadlineExtraction {
  deadlines: Array<{
    title: string;
    description: string;
    deadline_date: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    source_text: string;
    confidence: number;
  }>;
  document_summary: string;
  document_type: string;
}

export interface UserSettings {
  language: Language;
  theme: ThemeMode;
  geminiApiKey: string;
  defaultReminderTimes: number[]; // hours before deadline
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string; // HH:mm
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  googleDriveConnected: boolean;
  googleDriveFolderId: string;
  syncInterval: number; // minutes
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size: number;
  webViewLink: string;
  synced: boolean;
  lastSyncedAt: string | null;
}

export interface SyncStatus {
  isConnected: boolean;
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  filesWatched: number;
  isSyncing: boolean;
  error: string | null;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag: string;
  data: {
    deadlineId: string;
    action: 'view' | 'complete' | 'snooze';
    url: string;
  };
}

export interface AppStats {
  totalDeadlines: number;
  completedOnTime: number;
  overdue: number;
  upcoming: number;
  documentsProcessed: number;
  completionRate: number;
}

// i18n types
export interface Translations {
  [key: string]: string | Translations;
}

export interface I18nContext {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}
