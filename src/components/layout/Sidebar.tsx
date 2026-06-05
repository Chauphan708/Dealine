'use client';

// ============================================
// DeadlineGuard — Sidebar Component
// ============================================

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Settings,
  BarChart3,
  LogOut,
  Bell,
  Sun,
  Moon,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { useSettings } from '@/hooks/useSettings';
import type { Language } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const pathname = usePathname();
  const { t, language, setLanguage } = useI18n();
  const { settings, toggleTheme } = useSettings();

  const navItems = [
    { href: '/', label: t('nav.dashboard'), icon: <LayoutDashboard size={20} /> },
    { href: '/calendar', label: t('nav.calendar'), icon: <CalendarDays size={20} /> },
    { href: '/documents', label: t('nav.documents'), icon: <FileText size={20} /> },
    { href: '/statistics', label: t('nav.statistics') || 'Thống kê', icon: <BarChart3 size={20} /> },
    { href: '/settings', label: t('nav.settings'), icon: <Settings size={20} /> },
  ];

  const handleLanguageToggle = () => {
    const nextLang: Language = language === 'vi' ? 'en' : 'vi';
    setLanguage(nextLang);
  };

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setIsOpen(false)}
          id="sidebar-overlay"
        ></div>
      )}

      {/* Sidebar container */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar-container">
        {/* Top Logo */}
        <div className="sidebar-logo-container">
          <Link href="/" className="sidebar-logo" onClick={() => setIsOpen(false)}>
            <div className="logo-icon-container">
              <span className="logo-spark">⏱️</span>
            </div>
            <span className="logo-text">DeadlineGuard</span>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                id={`sidebar-nav-${item.href.replace('/', '') || 'dashboard'}`}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                <span className="sidebar-nav-label">{item.label}</span>
                {isActive && <div className="sidebar-active-indicator" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Panel */}
        <div className="sidebar-footer">
          {/* Quick settings row */}
          <div className="sidebar-settings-row">
            {/* Theme selector */}
            <button
              id="sidebar-theme-toggle"
              onClick={toggleTheme}
              className="sidebar-control-btn"
              title={settings.theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            >
              {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span className="control-btn-label">
                {settings.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>

            {/* Language toggle */}
            <button
              id="sidebar-lang-toggle"
              onClick={handleLanguageToggle}
              className="sidebar-control-btn"
              title="Change Language / Đổi ngôn ngữ"
            >
              <span className="flag-icon" style={{ fontSize: '16px' }}>
                {language === 'vi' ? '🇻🇳' : '🇺🇸'}
              </span>
              <span className="control-btn-label">
                {language === 'vi' ? 'TIẾNG VIỆT' : 'ENGLISH'}
              </span>
            </button>
          </div>

          {/* User profile card */}
          <div className="sidebar-profile-card">
            <div className="profile-avatar">
              <span>AD</span>
            </div>
            <div className="profile-info">
              <h4 className="profile-name">Administrator</h4>
              <p className="profile-role">Pro Account</p>
            </div>
          </div>

          <div className="sidebar-version-tag">
            <span>DeadlineGuard v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
