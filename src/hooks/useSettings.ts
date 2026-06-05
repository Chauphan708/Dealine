'use client';

// ============================================
// DeadlineGuard — useSettings Custom Hook
// ============================================

import { useState, useEffect, useCallback } from 'react';
import type { UserSettings, Language, ThemeMode } from '@/types';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from '@/lib/storage/database';

/**
 * Hook for loading and managing user preferences and application settings.
 * Persists data to IndexedDB and applies theme and language settings globally.
 */
export function useSettings() {
  const [settings, setSettingsState] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings from database on mount
  useEffect(() => {
    async function initSettings() {
      try {
        setLoading(true);
        const stored = await loadSettings();
        setSettingsState(stored);

        // Apply theme to document element
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', stored.theme);
        }
        setError(null);
      } catch (err: unknown) {
        console.error('[useSettings] Failed to load settings:', err);
        setError(err instanceof Error ? err.message : 'Unknown settings loading error');
      } finally {
        setLoading(false);
      }
    }

    initSettings();
  }, []);

  /**
   * Update specific setting keys in the DB and React state.
   */
  const updateSettings = useCallback(async (changes: Partial<UserSettings>) => {
    try {
      setSettingsState((prev) => {
        const next = { ...prev, ...changes };

        // Apply theme immediately if it changed
        if (changes.theme && typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', changes.theme);
        }

        return next;
      });

      await saveSettings(changes);
    } catch (err: unknown) {
      console.error('[useSettings] Failed to save settings:', err);
      throw err;
    }
  }, []);

  /**
   * Toggle between dark and light themes.
   */
  const toggleTheme = useCallback(async () => {
    const nextTheme: ThemeMode = settings.theme === 'dark' ? 'light' : 'dark';
    await updateSettings({ theme: nextTheme });
  }, [settings.theme, updateSettings]);

  /**
   * Switch languages.
   */
  const changeLanguage = useCallback(async (lang: Language) => {
    await updateSettings({ language: lang });
  }, [updateSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    toggleTheme,
    changeLanguage,
  };
}
