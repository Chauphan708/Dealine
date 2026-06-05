'use client';

// ============================================
// DeadlineGuard — Google Drive Service
// ============================================
//
// Client-side Google Drive integration via OAuth 2.0.
//
// ⚠️  SETUP REQUIRED:
// 1. Create a Google Cloud project
// 2. Enable the Google Drive API
// 3. Create OAuth 2.0 credentials (Web application)
// 4. Add your domain to "Authorized JavaScript origins"
// 5. Add redirect URI
// 6. Replace GOOGLE_CLIENT_ID below with your client ID
// ============================================

import type { DriveFile, SyncStatus } from '@/types';
import { generateId } from '@/lib/utils/helpers';

/**
 * ⚠️ Replace with your Google Cloud OAuth 2.0 Client ID.
 * Get one at: https://console.cloud.google.com/apis/credentials
 */
const GOOGLE_CLIENT_ID = '879795270922-tiqesouhapnnf1479dqideg4605rfcg0.apps.googleusercontent.com';

const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

// Supported document MIME types for scanning
const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/plain',
  'text/csv',
];

// ---- Token management ----

let accessToken: string | null = null;
let tokenExpiry: number = 0;

function getStoredToken(): { token: string; expiry: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('dg_drive_token');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function storeToken(token: string, expiresIn: number): void {
  if (typeof window === 'undefined') return;
  const expiry = Date.now() + expiresIn * 1000;
  accessToken = token;
  tokenExpiry = expiry;
  localStorage.setItem(
    'dg_drive_token',
    JSON.stringify({ token, expiry }),
  );
}

function clearStoredToken(): void {
  accessToken = null;
  tokenExpiry = 0;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('dg_drive_token');
  }
}

function isTokenValid(): boolean {
  if (!accessToken) {
    const stored = getStoredToken();
    if (stored) {
      accessToken = stored.token;
      tokenExpiry = stored.expiry;
    }
  }
  return !!accessToken && Date.now() < tokenExpiry;
}

// ---- OAuth 2.0 ----

/**
 * Initiate the Google OAuth 2.0 flow via popup window.
 *
 * Opens a Google sign-in popup. On success, stores the
 * access token for subsequent API calls.
 *
 * @throws Error if popup is blocked or auth fails
 */
export async function authenticateWithGoogle(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Google auth requires a browser environment');
  }

  if (GOOGLE_CLIENT_ID.startsWith('YOUR_')) {
    throw new Error(
      'Google Drive not configured. Please set your Google Client ID in driveService.ts. ' +
        'See https://console.cloud.google.com/apis/credentials',
    );
  }

  return new Promise((resolve, reject) => {
    const redirectUri = `${window.location.origin}/auth/callback`;

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'token',
      scope: SCOPES,
      include_granted_scopes: 'true',
      prompt: 'consent',
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      'google-auth',
      `width=${width},height=${height},left=${left},top=${top}`,
    );

    if (!popup) {
      reject(new Error('Popup blocked. Please allow popups for this site.'));
      return;
    }

    // Poll the popup for the redirect with token in hash
    const pollTimer = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(pollTimer);
          reject(new Error('Authentication cancelled'));
          return;
        }

        const popupUrl = popup.location.href;
        if (popupUrl.includes('access_token')) {
          clearInterval(pollTimer);
          const hash = popup.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const token = params.get('access_token');
          const expiresIn = parseInt(params.get('expires_in') ?? '3600');

          popup.close();

          if (token) {
            storeToken(token, expiresIn);
            resolve(token);
          } else {
            reject(new Error('No access token received'));
          }
        }
      } catch {
        // Cross-origin — popup hasn't redirected yet, keep polling
      }
    }, 500);

    // Timeout after 2 minutes
    setTimeout(() => {
      clearInterval(pollTimer);
      try { popup.close(); } catch { /* ignore */ }
      reject(new Error('Authentication timed out'));
    }, 120_000);
  });
}

/**
 * Disconnect from Google Drive (clear stored token).
 */
export function disconnectGoogle(): void {
  clearStoredToken();
}

/**
 * Check if currently connected to Google Drive.
 */
export function isGoogleConnected(): boolean {
  return isTokenValid();
}

// ---- Drive API methods ----

/**
 * Make an authenticated request to the Drive API.
 */
async function driveRequest<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  if (!isTokenValid()) {
    throw new Error('Not authenticated with Google Drive. Please connect first.');
  }

  const url = new URL(`${DRIVE_API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredToken();
      throw new Error('Session expired. Please reconnect to Google Drive.');
    }
    const error = await response.text();
    throw new Error(`Drive API error (${response.status}): ${error}`);
  }

  return response.json() as Promise<T>;
}

/**
 * List files in a specific Google Drive folder.
 *
 * @param folderId — the Drive folder ID (use 'root' for root)
 * @returns Array of DriveFile objects
 */
export async function listFilesInFolder(
  folderId: string = 'root',
): Promise<DriveFile[]> {
  const mimeFilter = SUPPORTED_MIME_TYPES
    .map((m) => `mimeType='${m}'`)
    .join(' or ');

  const query = `'${folderId}' in parents and (${mimeFilter}) and trashed=false`;

  interface DriveListResponse {
    files: Array<{
      id: string;
      name: string;
      mimeType: string;
      modifiedTime: string;
      size?: string;
      webViewLink?: string;
    }>;
  }

  const data = await driveRequest<DriveListResponse>('/files', {
    q: query,
    fields: 'files(id,name,mimeType,modifiedTime,size,webViewLink)',
    pageSize: '100',
    orderBy: 'modifiedTime desc',
  });

  return (data.files || []).map((f) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    modifiedTime: f.modifiedTime,
    size: parseInt(f.size || '0'),
    webViewLink: f.webViewLink ?? '',
    synced: false,
    lastSyncedAt: null,
  }));
}

/**
 * Download the content of a file from Google Drive.
 *
 * @param fileId — the Drive file ID
 * @returns The file content as an ArrayBuffer
 */
export async function downloadFile(fileId: string): Promise<ArrayBuffer> {
  if (!isTokenValid()) {
    throw new Error('Not authenticated with Google Drive.');
  }

  const url = `${DRIVE_API_BASE}/files/${fileId}?alt=media`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status}`);
  }

  return response.arrayBuffer();
}

/**
 * Get metadata for a specific file.
 */
export async function getFileMetadata(fileId: string): Promise<DriveFile> {
  interface DriveFileResponse {
    id: string;
    name: string;
    mimeType: string;
    modifiedTime: string;
    size?: string;
    webViewLink?: string;
  }

  const data = await driveRequest<DriveFileResponse>(
    `/files/${fileId}`,
    { fields: 'id,name,mimeType,modifiedTime,size,webViewLink' },
  );

  return {
    id: data.id,
    name: data.name,
    mimeType: data.mimeType,
    modifiedTime: data.modifiedTime,
    size: parseInt(data.size || '0'),
    webViewLink: data.webViewLink ?? '',
    synced: false,
    lastSyncedAt: null,
  };
}

// ---- Polling-based change detection ----

let pollIntervalId: ReturnType<typeof setInterval> | null = null;
let watchedFolderId: string | null = null;
let lastKnownModified: Map<string, string> = new Map();
let changeCallback: ((changed: DriveFile[]) => void) | null = null;

/**
 * Start watching a folder for changes (polling-based).
 *
 * @param folderId  — the Drive folder ID to watch
 * @param intervalMs — polling interval (default 5 min)
 * @param onChanges — callback when new/modified files are detected
 */
export function startWatching(
  folderId: string,
  intervalMs: number = 300_000,
  onChanges: (changed: DriveFile[]) => void,
): void {
  stopWatching(); // Clear any existing watcher

  watchedFolderId = folderId;
  changeCallback = onChanges;

  // Initial scan
  pollForChanges().catch(console.error);

  pollIntervalId = setInterval(() => {
    pollForChanges().catch(console.error);
  }, intervalMs);
}

/**
 * Stop watching for changes.
 */
export function stopWatching(): void {
  if (pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
  watchedFolderId = null;
  changeCallback = null;
  lastKnownModified.clear();
}

async function pollForChanges(): Promise<void> {
  if (!watchedFolderId || !changeCallback) return;

  try {
    const files = await listFilesInFolder(watchedFolderId);
    const changedFiles: DriveFile[] = [];

    for (const file of files) {
      const lastModified = lastKnownModified.get(file.id);
      if (!lastModified || lastModified !== file.modifiedTime) {
        changedFiles.push(file);
      }
    }

    // Update known state
    lastKnownModified.clear();
    for (const file of files) {
      lastKnownModified.set(file.id, file.modifiedTime);
    }

    if (changedFiles.length > 0 && changeCallback) {
      changeCallback(changedFiles);
    }
  } catch (err) {
    console.error('[driveService] Polling error:', err);
  }
}

/**
 * Get the current sync status.
 */
export function getSyncStatus(): SyncStatus {
  return {
    isConnected: isTokenValid(),
    lastSyncAt: null, // TODO: persist in DB
    nextSyncAt: null,
    filesWatched: lastKnownModified.size,
    isSyncing: false,
    error: null,
  };
}

// --- Aliases/Wrappers for DriveConnector ---

export async function authorizeDrive(): Promise<string> {
  return authenticateWithGoogle();
}

export function disconnectDrive(): void {
  disconnectGoogle();
}

export async function listDriveFolders(): Promise<Array<{ id: string; name: string }>> {
  interface DriveFolderListResponse {
    files: Array<{ id: string; name: string }>;
  }
  const data = await driveRequest<DriveFolderListResponse>('/files', {
    q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
    fields: 'files(id,name)',
    pageSize: '100',
  });
  return data.files || [];
}

export function watchFolder(folderId: string): void {
  startWatching(folderId, 300_000, (changed) => {
    console.log('[driveService] Watched folder changes:', changed);
  });
}

export async function syncDriveFiles(folderId: string): Promise<DriveFile[]> {
  return listFilesInFolder(folderId);
}

export { generateId };
