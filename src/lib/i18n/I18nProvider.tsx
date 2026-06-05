'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Language, I18nContext as I18nContextType } from '@/types';
import { translations, type TranslationKey } from '@/lib/i18n/translations';

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = 'deadlineguard-language';

function getNestedValue(obj: Record<string, unknown>, key: string): string | undefined {
  const val = (obj as Record<string, string>)[key];
  return typeof val === 'string' ? val : undefined;
}

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>('vi');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (stored && (stored === 'vi' || stored === 'en')) {
        setLanguageState(stored);
      }
    } catch {
      // localStorage not available
    }
    setIsHydrated(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage not available
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = translations[language] as Record<string, string>;
      let value = getNestedValue(dict, key as TranslationKey);

      if (!value) {
        // Fallback to English
        const fallback = translations.en as Record<string, string>;
        value = getNestedValue(fallback, key as TranslationKey);
      }

      if (!value) {
        return key; // Return key as last resort
      }

      if (params) {
        return Object.entries(params).reduce(
          (str, [paramKey, paramValue]) =>
            str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue)),
          value
        );
      }

      return value;
    },
    [language]
  );

  const contextValue = useMemo<I18nContextType>(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  if (!isHydrated) {
    return null; // Prevent hydration mismatch
  }

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export default I18nProvider;
