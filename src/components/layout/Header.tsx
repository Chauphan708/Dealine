'use client';

// ============================================
// DeadlineGuard — Header Component
// ============================================

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Bell, Search, Sun, Moon } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { useSettings } from '@/hooks/useSettings';
import { useDeadlines } from '@/hooks/useDeadlines';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const pathname = usePathname();
  const { t } = useI18n();
  const { toggleTheme, settings } = useSettings();
  const { stats } = useDeadlines();
  const [pageTitle, setPageTitle] = useState('');

  // Dynamically map path to translated title
  useEffect(() => {
    switch (pathname) {
      case '/':
        setPageTitle(t('nav.dashboard'));
        break;
      case '/calendar':
        setPageTitle(t('nav.calendar'));
        break;
      case '/documents':
        setPageTitle(t('nav.documents'));
        break;
      case '/statistics':
        setPageTitle(t('nav.statistics') || 'Thống kê');
        break;
      case '/settings':
        setPageTitle(t('nav.settings'));
        break;
      default:
        setPageTitle('DeadlineGuard');
    }
  }, [pathname, t]);

  return (
    <header className="header" id="header-container">
      {/* Left side: Hamburg menu on mobile & Page Title */}
      <div className="header-left">
        <button
          id="header-mobile-hamburger"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="header-mobile-hamburger-btn"
          aria-label="Open sidebar menu"
        >
          <Menu size={22} />
        </button>
        <h1 className="header-page-title">{pageTitle}</h1>
      </div>

      {/* Right side controls */}
      <div className="header-right">
        {/* Mock Search container */}
        <div className="header-search-container">
          <Search size={16} className="search-icon" />
          <input
            id="header-global-search"
            type="text"
            placeholder={t('common.search')}
            className="header-search-input"
          />
        </div>

        {/* Theme Shortcut Toggle */}
        <button
          id="header-theme-toggle"
          onClick={toggleTheme}
          className="header-control-btn"
          title={settings.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
          {settings.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notification Bell Badge */}
        <div className="header-notification-container">
          <button id="header-bell-btn" className="header-control-btn" aria-label="View notifications">
            <Bell size={20} />
            {stats.overdue > 0 && (
              <span className="notification-badge notification-badge-pulse" id="header-notification-count">
                {stats.overdue}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
